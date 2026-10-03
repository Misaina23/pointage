"use client";

import { Card } from "@/components/ui";
import {
    DepartmentBreakdown,
    ExportButtons,
    HoursReport,
    LateReport,
    MonthlySummary,
    ReportFilters,
    downloadFile,
    toCsv,
} from "@/components/reports";
import { useReports } from "@/hooks";
import type { ExportFormat } from "@/types/report";

export default function ManagerReportsPage() {
    const reports = useReports();

    const handleExport = (format: ExportFormat) => {
        if (format === "json") {
            downloadFile(
                `pointagemisaina-equipe-${reports.month}.json`,
                JSON.stringify(reports.monthly, null, 2),
                "application/json;charset=utf-8",
            );

            return;
        }

        downloadFile(
            `pointagemisaina-equipe-${reports.month}.csv`,
            toCsv(
                ["Indicateur", "Valeur"],
                [
                    ["Mois", reports.month],
                    ["Agents", reports.monthly?.employees ?? 0],
                    ["Heures (min)", reports.monthly?.worked_minutes ?? 0],
                    ["Retards", reports.monthly?.late_count ?? 0],
                    ["Absences", reports.monthly?.absence_count ?? 0],
                    ["Congés", reports.monthly?.leave_count ?? 0],
                ],
            ),
        );
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Suivi</p>
                    <h1>Rapports d&apos;équipe</h1>
                    <p className="page-subtitle">
                        Indicateurs consolidés du périmètre que vous encadrez.
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

            <div className="content-grid" style={{ marginTop: 18 }}>
                <HoursReport monthly={reports.monthly} />
                <LateReport monthly={reports.monthly} departments={reports.departments} />
            </div>

            <Card title="Périmètre">
                <DepartmentBreakdown departments={reports.departments} />
            </Card>
        </>
    );
}