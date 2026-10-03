"use client";

import { useReports } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { Card } from "@/components/ui";
import {
    AbsenceReport,
    DepartmentBreakdown,
    HoursReport,
    LateReport,
    LeaveReport,
    MonthlySummary,
    PresenceReport,
    ReportFilters,
} from "@/components/reports";
import { StatCard, StatGrid } from "@/components/dashboard";
import { formatMinutes } from "@/lib/formatters";

export default function ReportsOverviewPage() {
    const reports = useReports();
    const permissions = usePermissions();

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Vue d&apos;ensemble</h1>
                    <p className="page-subtitle">
                        Tous les indicateurs consolidés de la plateforme.
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
                <MonthlySummary monthly={reports.monthly} />
            </Card>

            <StatGrid>
                <StatCard
                    label="Présents"
                    value={reports.daily?.present ?? 0}
                    note={`sur ${reports.daily?.employees ?? 0} agents`}
                />
                <StatCard
                    label="Heures"
                    value={formatMinutes(reports.monthly?.worked_minutes ?? 0)}
                    tone="blue"
                />
                <StatCard
                    label="Demandes en attente"
                    value={
                        permissions.permissions.filter((row) => row.status === "pending").length
                    }
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <PresenceReport report={reports.daily} />
                <LateReport monthly={reports.monthly} departments={reports.departments} />
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <AbsenceReport daily={reports.daily} departments={reports.departments} />
                <LeaveReport daily={reports.daily} monthly={reports.monthly} />
            </div>

            <Card title="Heures">
                <HoursReport monthly={reports.monthly} />
                <DepartmentBreakdown departments={reports.departments} />
            </Card>
        </>
    );
}