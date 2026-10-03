"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { ExportButtons, ReportFilters, downloadFile, toCsv } from "@/components/reports";
import { useReports } from "@/hooks";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { formatMinutes } from "@/lib/formatters";
import type { ExportFormat } from "@/types/report";

export default function ExportPage() {
    const { notify } = useNotifications();
    const reports = useReports();
    const [busy, setBusy] = useState<ExportFormat | null>(null);

    const datasets = {
        presence: {
            filename: `pointagemisaina-presence-${reports.date}`,
            headers: ["Date", "Agents", "Présents", "Absents", "Retards", "Heures (min)"],
            rows: [
                [
                    reports.date,
                    reports.daily?.employees ?? 0,
                    reports.daily?.present ?? 0,
                    reports.daily?.absent ?? 0,
                    reports.daily?.late ?? 0,
                    reports.daily?.worked_minutes ?? 0,
                ],
            ],
        },
        late: {
            filename: `pointagemisaina-retards-${reports.month}`,
            headers: ["Département", "Occurrences", "Retard cumulé (min)"],
            rows: (reports.departments?.late ?? []).map((row) => [
                row.department,
                row.occurrences,
                row.late_minutes,
            ]),
        },
        absence: {
            filename: `pointagemisaina-absences-${reports.month}`,
            headers: ["Département", "Absences"],
            rows: (reports.departments?.absences ?? []).map((row) => [
                row.department,
                row.records,
            ]),
        },
        hours: {
            filename: `pointagemisaina-heures-${reports.month}`,
            headers: ["Indicateur", "Valeur"],
            rows: [
                ["Heures travaillées (min)", reports.monthly?.worked_minutes ?? 0],
                ["Heures supplémentaires (min)", reports.monthly?.overtime_minutes ?? 0],
                ["Journées de retard", reports.monthly?.late_count ?? 0],
                ["Retard cumulé (min)", reports.monthly?.late_minutes ?? 0],
            ],
        },
    } as const;

    const run = async (key: keyof typeof datasets, format: ExportFormat) => {
        const dataset = datasets[key];

        setBusy(format);

        if (format === "json") {
            downloadFile(
                `${dataset.filename}.json`,
                JSON.stringify({ [key]: dataset.rows }, null, 2),
                "application/json;charset=utf-8",
            );
        } else {
            downloadFile(`${dataset.filename}.csv`, toCsv(dataset.headers, dataset.rows));
        }

        notify(`Export ${key} généré (${format.toUpperCase()}).`, "success");
        setBusy(null);
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Export de données</h1>
                    <p className="page-subtitle">
                        Générez les extractions CSV ou JSON des indicateurs calculés par l&apos;API.
                    </p>
                </div>
            </header>

            <Card title="Période">
                <ReportFilters
                    date={reports.date}
                    month={reports.month}
                    range={reports.range}
                    onDateChange={reports.setDate}
                    onMonthChange={reports.setMonth}
                    onRangeChange={reports.setRange}
                />
            </Card>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Présences" subtitle={reports.date}>
                    <ExportButtons onExport={(format) => void run("presence", format)} />
                </Card>
                <Card title="Retards" subtitle={reports.month}>
                    <ExportButtons onExport={(format) => void run("late", format)} />
                </Card>
                <Card title="Absences" subtitle={reports.month}>
                    <ExportButtons onExport={(format) => void run("absence", format)} />
                </Card>
                <Card title="Heures" subtitle={reports.month}>
                    <ExportButtons onExport={(format) => void run("hours", format)} />
                </Card>
            </div>

            <Card title="Aperçu">
                <p className="request-description">
                    Les extractions utilisent la période sélectionnée ci-dessus. Le taux de retard moyen
                    du mois est de {formatMinutes(reports.monthly?.average_late_minutes ?? 0)}.
                </p>
                {busy && <p className="footnote">Export {busy.toUpperCase()} généré.</p>}
            </Card>
        </>
    );
}