"use client";

import { DataTable, Modal, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/formatters";
import type { PermissionRequest } from "@/types/permission";

export function PermissionStatus({ permission }: { permission: PermissionRequest }) {
    return <StatusBadge status={permission.status} />;
}

export function PermissionCard({ permission }: { permission: PermissionRequest }) {
    return (
        <div className="request-card">
            <span className="request-card-head">
                <span className="request-main">
                    <span className="request-title-line">
                        {permission.permission_type?.name ?? "Permission"}
                    </span>
                    <span className="request-meta">
                        {formatDate(permission.permission_date)} · {permission.starts_at} –{" "}
                        {permission.ends_at}
                    </span>
                </span>
                <PermissionStatus permission={permission} />
            </span>
            <span className="request-description">{permission.reason}</span>
        </div>
    );
}

export function PermissionTable({ permissions }: { permissions: PermissionRequest[] }) {
    const columns: Column<PermissionRequest>[] = [
        {
            key: "type",
            header: "Type",
            render: (permission) => permission.permission_type?.name ?? "—",
        },
        {
            key: "date",
            header: "Date",
            render: (permission) => formatDate(permission.permission_date),
        },
        {
            key: "slot",
            header: "Créneau",
            render: (permission) => `${permission.starts_at} – ${permission.ends_at}`,
        },
        {
            key: "reason",
            header: "Motif",
            render: (permission) => <span className="muted-cell">{permission.reason}</span>,
        },
        {
            key: "status",
            header: "Statut",
            render: (permission) => <PermissionStatus permission={permission} />,
        },
        {
            key: "submitted",
            header: "Déposé le",
            render: (permission) => formatDate(permission.submitted_at),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={permissions}
            rowKey={(permission) => permission.id}
            emptyLabel="Aucune demande de permission."
        />
    );
}

export function PermissionDetails({
    permission,
    onClose,
}: {
    permission: PermissionRequest | null;
    onClose: () => void;
}) {
    if (!permission) {
        return null;
    }

    return (
        <Modal
            open
            title="Demande de permission"
            subtitle={permission.permission_type?.name}
            onClose={onClose}
        >
            <dl className="profile-details">
                <div>
                    <dt>Date</dt>
                    <dd>{formatDate(permission.permission_date)}</dd>
                </div>
                <div>
                    <dt>Créneau</dt>
                    <dd>
                        {permission.starts_at} – {permission.ends_at}
                    </dd>
                </div>
                <div>
                    <dt>Statut</dt>
                    <dd>
                        <PermissionStatus permission={permission} />
                    </dd>
                </div>
                <div>
                    <dt>Déposé le</dt>
                    <dd>{formatDateTime(permission.submitted_at)}</dd>
                </div>
            </dl>
            <p className="request-description" style={{ marginTop: 14 }}>
                {permission.reason}
            </p>
        </Modal>
    );
}