"use client";

import { Clock, FileBarChart, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { StatCard, StatGrid, PresenceChart } from "@/components/dashboard";
import { useReports } from "@/hooks";
import { useAttendance } from "@/hooks/useAttendance";
import { HoursReport, LateReport } from "@/components/reports";
import { todayIso } from "@/lib/dates";
import { formatHours } from "@/lib/formatters";

export default function HrOverviewPage() {
    const reports = useReports();
    const attendance = useAttendance(todayIso());
    const organization = reports.organization;

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Espace RH</p>
                    <h1>Pilotage des ressources humaines</h1>
                    <p className="page-subtitle">
                        Situation du personnel, des présences et des demandes en cours.
                    </p>
                </div>
                <span className="live-pill">
                    <span className="live-dot" aria-hidden />
                    {organization?.pending_requests ?? 0} demande(s) en attente
                </span>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Effectif actif"
                    value={organization?.employees ?? 0}
                    note={`${organization?.present ?? 0} présents aujourd'hui`}
                />
                <StatCard
                    icon={Clock}
                    label="Heures du jour"
                    value={formatHours(organization?.hours_worked ?? 0)}
                    tone="blue"
                />
                <StatCard
                    icon={FileBarChart}
                    label="Heures supplémentaires"
                    value={formatHours(organization?.overtime_hours ?? 0)}
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Répartition des présences">
                    <PresenceChart dashboard={organization} />
                </Card>
                <Card title="Retards du jour" subtitle="Agent les plus souvent en retard ce mois">
                    <StatGrid>
                        <StatCard
                            label="En retard"
                            value={attendance.today?.summary.late ?? organization?.late ?? 0}
                            tone="red"
                        />
                        <StatCard label="Absents" value={organization?.absent ?? 0} tone="yellow" />
                        <StatCard label="Permissions" value={organization?.on_permission ?? 0} />
                    </StatGrid>
                </Card>
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <HoursReport monthly={reports.monthly} />
                <LateReport monthly={reports.monthly} departments={reports.departments} />
            </div>
        </>
    );
}