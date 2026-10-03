"use client";

import { Card } from "@/components/ui";
import { LateReport, ReportChart, ReportFilters } from "@/components/reports";
import { useReports } from "@/hooks";
import { useAbsences } from "@/hooks/useAbsences";
import { formatNumber, formatMinutes } from "@/lib/formatters";

export default function LateReportPage() {
    const reports = useReports();
    const absences = useAbsences();

    const rows = (reports.departments?.late ?? []).map((row) => ({
        label: row.department,
        value: row.late_minutes,
    }));

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Rapport des retards</h1>
                    <p className="page-subtitle">
                        Retards cumulés par agent et par département.
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
                <LateReport monthly={reports.monthly} departments={reports.departments} />
                <ReportChart title="Minutes de retard par département" rows={rows} />
            </div>

            <Card title="Demandes liées">
                <p className="request-description">
                    {absences.absences.length} absence(s) enregistrée(s) sur le périmètre.
                </p>
                <p className="footnote">
                    Total cumulé du mois : {formatMinutes(reports.monthly?.late_minutes ?? 0)} sur{" "}
                    {formatNumber(reports.monthly?.late_count ?? 0)} journée(s).
                </p>
            </Card>
        </>
    );
}