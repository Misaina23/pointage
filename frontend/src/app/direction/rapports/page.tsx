"use client";

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
import type { ExportFormat } from "@/types/report";

export default function DirectionReportsPage() {
    const reports = useReports();

    const handleExport = (format: ExportFormat) => {
        if (format === "json") {
            downloadFile(
                `pointagemisaina-direction-${reports.month}.json`,
                JSON.stringify(reports.monthly, null, 2),
                "application/json;charset=utf-8",
            );

            return;
        }

        downloadFile(
            `pointagemisaina-direction-${reports.month}.csv`,
            toCsv(
                ["Indicateur", "Valeur"],
                [
                    ["Mois", reports.month],
                    ["Agents", reports.monthly?.employees ?? 0],
                    ["Heures (min)", reports.monthly?.worked_minutes ?? 0],
                    ["Heures sup. (min)", reports.monthly?.overtime_minutes ?? 0],
                    ["Journées de retard", reports.monthly?.late_count ?? 0],
                    ["Retard cumulé (min)", reports.monthly?.late_minutes ?? 0],
                    ["Absences", reports.monthly?.absence_count ?? 0],
                    ["Congés", reports.monthly?.leave_count ?? 0],
                    ["Permissions", reports.monthly?.permission_count ?? 0],
                ],
            ),
        );
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pilotage</p>
                    <h1>Rapports</h1>
                    <p className="page-subtitle">
                        Synthèse mensuelle et indicateurs consolidés de la direction.
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

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <HoursReport monthly={reports.monthly} />
                <LateReport monthly={reports.monthly} departments={reports.departments} />
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <LeaveReport daily={reports.daily} monthly={reports.monthly} />
                <AbsenceReport daily={reports.daily} departments={reports.departments} />
            </div>

            <Card title="Rapport quotidien">
                <PresenceReport report={reports.daily} />
                <DepartmentBreakdown departments={reports.departments} />
            </Card>
        </>
    );
}