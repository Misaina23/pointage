"use client";

import { Card, EmptyState } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listLeaves } from "@/services/api/leaves";
import { listPermissions } from "@/services/api/permissions";
import { listAbsences } from "@/services/api/absences";
import type { LeaveRequest } from "@/types/leave";
import type { PermissionRequest } from "@/types/permission";
import type { AbsenceRecord } from "@/types/absence";

export default function DocumentsPage() {
    const leaves = useAsyncData<LeaveRequest[]>(
        (signal) => listLeaves({ per_page: 50 }, signal).then((page) => page.data),
        [],
    );
    const permissions = useAsyncData<PermissionRequest[]>(
        (signal) => listPermissions({ per_page: 50 }, signal).then((page) => page.data),
        [],
    );
    const absences = useAsyncData<AbsenceRecord[]>(
        (signal) => listAbsences({ per_page: 50 }, signal).then((page) => page.data),
        [],
    );

    const documents = [
        ...(leaves.data ?? [])
            .filter((leave) => leave.attachment_path)
            .map((leave) => ({
                id: `leave-${leave.id}`,
                label: `Congé ${leave.leave_type?.name ?? ""} — ${formatDate(leave.starts_on)}`,
                meta: formatDateTime(leave.submitted_at),
            })),
        ...(permissions.data ?? [])
            .filter((permission) => permission.attachment_path)
            .map((permission) => ({
                id: `permission-${permission.id}`,
                label: `Permission ${permission.permission_type?.name ?? ""} — ${formatDate(permission.permission_date)}`,
                meta: formatDateTime(permission.submitted_at),
            })),
        ...(absences.data ?? [])
            .filter((absence) => absence.attachment_path)
            .map((absence) => ({
                id: `absence-${absence.id}`,
                label: `Absence ${absence.absence_type?.name ?? ""} — ${formatDate(absence.starts_on)}`,
                meta: absence.status,
            })),
    ];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Suivi</p>
                    <h1>Mes documents</h1>
                    <p className="page-subtitle">
                        Pièces jointes déposées avec vos demandes, classées par type.
                    </p>
                </div>
            </header>

            <StatGrid>
                <StatCard label="Congés" value={leaves.data?.length ?? 0} />
                <StatCard
                    label="Permissions"
                    value={permissions.data?.length ?? 0}
                    tone="blue"
                />
                <StatCard
                    label="Absences"
                    value={absences.data?.length ?? 0}
                    tone="yellow"
                />
            </StatGrid>

            <Card title="Pièces jointes" subtitle={`${documents.length} document(s)`}>
                {documents.length === 0 ? (
                    <EmptyState
                        title="Aucune pièce jointe"
                        description="Les documents joints à vos demandes apparaîtront ici."
                    />
                ) : (
                    <div className="history-list">
                        {documents.map((document) => (
                            <div key={document.id} className="history-row">
                                <span className="history-avatar" aria-hidden>
                                    D
                                </span>
                                <span>
                                    <span className="history-name">{document.label}</span>
                                    <span className="history-code">{document.meta}</span>
                                </span>
                                <span className="history-status valid">JOINT</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </>
    );
}