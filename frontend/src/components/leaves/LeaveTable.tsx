"use client";

import { DataTable, Modal, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui";
import { formatDate, formatDateTime, formatDays } from "@/lib/formatters";
import type { LeaveRequest } from "@/types/leave";

export function LeaveStatus({ leave }: { leave: LeaveRequest }) {
    return <StatusBadge status={leave.status} />;
}

export function LeaveCard({ leave }: { leave: LeaveRequest }) {
    return (
        <div className="request-card">
            <span className="request-card-head">
                <span className="request-main">
                    <span className="request-title-line">
                        {leave.leave_type?.name ?? "Congé"} · {formatDays(leave.requested_days)}
                    </span>
                    <span className="request-meta">
                        {formatDate(leave.starts_on)} → {formatDate(leave.ends_on)}
                    </span>
                </span>
                <LeaveStatus leave={leave} />
            </span>
            <span className="request-description">{leave.reason}</span>
            <span className="request-meta">
                {leave.approval?.workflow ?? "Circuit par défaut"}
                {leave.submitted_at ? ` · déposé le ${formatDateTime(leave.submitted_at)}` : ""}
            </span>
        </div>
    );
}

export function LeaveTable({ leaves }: { leaves: LeaveRequest[] }) {
    const columns: Column<LeaveRequest>[] = [
        {
            key: "type",
            header: "Type",
            render: (leave) => leave.leave_type?.name ?? "—",
        },
        {
            key: "range",
            header: "Période",
            render: (leave) => `${formatDate(leave.starts_on)} → ${formatDate(leave.ends_on)}`,
        },
        {
            key: "days",
            header: "Jours",
            align: "right",
            render: (leave) => formatDays(leave.requested_days),
        },
        {
            key: "reason",
            header: "Motif",
            render: (leave) => <span className="muted-cell">{leave.reason}</span>,
        },
        {
            key: "status",
            header: "Statut",
            render: (leave) => <LeaveStatus leave={leave} />,
        },
        {
            key: "submitted",
            header: "Déposé le",
            render: (leave) => formatDate(leave.submitted_at),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={leaves}
            rowKey={(leave) => leave.id}
            emptyLabel="Aucune demande de congé."
        />
    );
}

export function LeaveDetails({
    leave,
    onClose,
}: {
    leave: LeaveRequest | null;
    onClose: () => void;
}) {
    if (!leave) {
        return null;
    }

    return (
        <Modal open title="Demande de congé" subtitle={leave.leave_type?.name} onClose={onClose} size="lg">
            <dl className="profile-details">
                <div>
                    <dt>Période</dt>
                    <dd>
                        {formatDate(leave.starts_on)} → {formatDate(leave.ends_on)}
                    </dd>
                </div>
                <div>
                    <dt>Durée</dt>
                    <dd>{formatDays(leave.requested_days)}</dd>
                </div>
                <div>
                    <dt>Statut</dt>
                    <dd>
                        <LeaveStatus leave={leave} />
                    </dd>
                </div>
                <div>
                    <dt>Circuit</dt>
                    <dd>{leave.approval?.workflow ?? "—"}</dd>
                </div>
            </dl>
            <p className="request-description" style={{ marginTop: 14 }}>
                {leave.reason}
            </p>
            {leave.approval?.history && leave.approval.history.length > 0 && (
                <>
                    <h3 className="panel-heading" style={{ marginTop: 20 }}>
                        Historique
                    </h3>
                    <div className="day-timeline">
                        {leave.approval.history.map((entry, index) => (
                            <div key={index} className="timeline-item">
                                <span className="timeline-mark" aria-hidden>
                                    {entry.decision === "approved" ? "✓" : "✕"}
                                </span>
                                <span>
                                    <strong>{entry.actor ?? "Système"}</strong>
                                    <small>{entry.comment ?? "Sans commentaire"}</small>
                                </span>
                                <time>{formatDate(entry.acted_at)}</time>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Modal>
    );
}