"use client";

import { Card } from "@/components/ui";
import { HoursReport, ReportChart, ReportFilters } from "@/components/reports";
import { useReports } from "@/hooks";
import { formatMinutes } from "@/lib/formatters";

export default function HoursReportPage() {
    const reports = useReports();

    const rows = [
        {
            label: "Heures travaillées",
            value: Math.round(reports.monthly?.worked_minutes ?? 0),
        },
        {
            label: "Heures supplémentaires",
            value: Math.round(reports.monthly?.overtime_minutes ?? 0),
        },
        { label: "Minutes de retard", value: reports.monthly?.late_minutes ?? 0 },
    ];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Rapport des heures</h1>
                    <p className="page-subtitle">
                        Temps de travail cumulé et heures supplémentaires du mois.
                    </p>
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
            </Card>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <HoursReport monthly={reports.monthly} />
                <ReportChart title="Répartition en minutes" rows={rows} />
            </div>

            <Card title="Contexte">
                <p className="request-description">
                    Les heures supplémentaires représentent{" "}
                    {formatMinutes(reports.monthly?.overtime_minutes ?? 0)} pour{" "}
                    {formatMinutes(reports.monthly?.worked_minutes ?? 0)} travaillées.
                </p>
                <p className="footnote">
                    Moyenne de retard par journée en retard :{" "}
                    {formatMinutes(reports.monthly?.average_late_minutes ?? 0)}.
                </p>
            </Card>
        </>
    );
}