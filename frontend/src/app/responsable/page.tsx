"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/ui";
import { AbsenceCard, PresenceChart, StatCard, StatGrid } from "@/components/dashboard";
import { useReports } from "@/hooks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listEmployees } from "@/services/api/employees";
import { useAuth } from "@/hooks";
import { formatHours } from "@/lib/formatters";
import type { Employee, Paginated } from "@/types/user";

export default function ManagerOverviewPage() {
    const { user } = useAuth();
    const reports = useReports();
    const team = useAsyncData<Paginated<Employee>>(
        (signal) =>
            listEmployees(
                { department_id: user?.employee?.department_id ?? undefined, per_page: 100 },
                signal,
            ),
        [user?.employee?.department_id],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Espace responsable</p>
                    <h1>Suivi de mon équipe</h1>
                    <p className="page-subtitle">
                        Présences et indicateurs du périmètre que vous encadrez.
                    </p>
                </div>
                <span className="live-pill">
                    <span className="live-dot" aria-hidden />
                    {team.data?.meta?.total ?? team.data?.data.length ?? 0} agent(s)
                </span>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Équipe"
                    value={team.data?.data.length ?? 0}
                    note={`${reports.organization?.present ?? 0} présents aujourd'hui`}
                />
                <StatCard
                    icon={Users}
                    label="Absents"
                    value={reports.organization?.absent ?? 0}
                    tone="red"
                />
                <StatCard
                    icon={Users}
                    label="Heures"
                    value={formatHours(reports.organization?.hours_worked ?? 0)}
                    tone="blue"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Répartition des présences">
                    <PresenceChart dashboard={reports.organization} />
                </Card>
                <AbsenceCard dashboard={reports.organization} />
            </div>
        </>
    );
}