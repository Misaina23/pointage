"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import {
    AbsenceReport,
    DepartmentBreakdown,
    ExportButtons,
    HoursReport,
    LateReport,
    LeaveReport,
    MonthlySummary,
    PresenceReport,
    ReportFilters,
    downloadFile,
    toCsv,
} from "@/components/reports";
import { useReports } from "@/hooks";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { ExportFormat } from "@/types/report";

export default function HrReportsPage() {
    const { notify } = useNotifications();
    const reports = useReports();
    const [exporting, setExporting] = useState(false);

    const handleExport = async (format: ExportFormat) => {
        setExporting(true);

        try {
            const daily = reports.daily;
            const monthly = reports.monthly;

            if (format === "json") {
                downloadFile(
                    `pointagemisaina-rapport-${reports.date}.json`,
                    JSON.stringify({ daily, monthly, departments: reports.departments }, null, 2),
                    "application/json;charset=utf-8",
                );
            } else {
                downloadFile(
                    `pointagemisaina-rapport-${reports.date}.csv`,
                    toCsv(
                        ["Indicateur", "Valeur"],
                        [
                            ["Date", reports.date],
                            ["Agents", daily?.employees ?? 0],
                            ["Présents", daily?.present ?? 0],
                            ["Absents", daily?.absent ?? 0],
                            ["Retards", daily?.late ?? 0],
                            ["Heures travaillées (min)", daily?.worked_minutes ?? 0],
                            ["Heures sup. (min)", daily?.overtime_minutes ?? 0],
                            ["Congés", daily?.leaves ?? 0],
                            ["Permissions", daily?.permissions ?? 0],
                            ["Absences", daily?.absences ?? 0],
                        ],
                    ),
                );
            }

            notify("Export généré.", "success");
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Export impossible.", "error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pilotage</p>
                    <h1>Rapports</h1>
                    <p className="page-subtitle">
                        Indicateurs quotidiens, mensuels et agrégés par département.
                    </p>
                </div>
                <div className="heading-tools">
                    <ExportButtons onExport={handleExport} />
                </div>
            </header>

            <Card title="Filtres">
                <ReportFilters
                    date={reports.date}
                    month={reports.month}
                    range={reports.range}
                    onDateChange={reports.setDate}
                    onMonthChange={reports.setMonth}
                    onRangeChange={reports.setRange}
                />
                <MonthlySummary monthly={reports.monthly} />
            </Card>

            <div style={{ marginTop: 18 }}>
                <PresenceReport report={reports.daily} />
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <LateReport monthly={reports.monthly} departments={reports.departments} />
                <LeaveReport daily={reports.daily} monthly={reports.monthly} />
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <HoursReport monthly={reports.monthly} />
                <AbsenceReport daily={reports.daily} departments={reports.departments} />
            </div>

            <Card title="Périmètre analysé">
                <DepartmentBreakdown departments={reports.departments} />
            </Card>

            {exporting && <p className="footnote">Préparation de l&apos;export…</p>}
        </>
    );
}