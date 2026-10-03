"use client";

import { Clock, FileBarChart, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { AbsenceCard, PresenceChart, StatCard, StatGrid } from "@/components/dashboard";
import { useReports } from "@/hooks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listApprovals } from "@/services/api/reports";
import { formatDateTime, formatHours } from "@/lib/formatters";
import type { ApprovalsList } from "@/types/approval";

export default function DirectionOverviewPage() {
    const reports = useReports();
    const approvals = useAsyncData<ApprovalsList>((signal) => listApprovals(signal), []);
    const organization = reports.organization;

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Espace direction</p>
                    <h1>Vue d&apos;ensemble</h1>
                    <p className="page-subtitle">
                        Indicateurs de la direction et validations en attente.
                    </p>
                </div>
                <span className="live-pill">
                    <span className="live-dot" aria-hidden />
                    {approvals.data?.data.length ?? 0} validation(s)
                </span>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Effectif"
                    value={organization?.employees ?? 0}
                    note={`${organization?.present ?? 0} présents`}
                />
                <StatCard
                    icon={Clock}
                    label="Heures du jour"
                    value={formatHours(organization?.hours_worked ?? 0)}
                    tone="blue"
                />
                <StatCard
                    icon={FileBarChart}
                    label="Demandes en attente"
                    value={organization?.pending_requests ?? 0}
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Répartition des présences">
                    <PresenceChart dashboard={organization} />
                </Card>
                <div style={{ display: "grid", gap: 18 }}>
                    <AbsenceCard dashboard={organization} />
                    <Card title="Validations récentes">
                        {!approvals.data || approvals.data.data.length === 0 ? (
                            <p className="empty-history">Aucune validation en attente.</p>
                        ) : (
                            <div className="request-list">
                                {approvals.data.data.slice(0, 5).map((approval) => (
                                    <div key={approval.id} className="request-card">
                                        <span className="request-title-line">
                                            {approval.employee?.full_name ?? "Employé"}
                                        </span>
                                        <span className="request-meta">
                                            {approval.workflow?.name ?? "Circuit par défaut"} ·{" "}
                                            {formatDateTime(approval.submitted_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}