"use client";

import { DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui";
import { formatDate } from "@/lib/formatters";
import type { AbsenceRecord } from "@/types/absence";

export function AbsenceStatus({ absence }: { absence: AbsenceRecord }) {
    return <StatusBadge status={absence.status} />;
}

export function AbsenceCard({ absence }: { absence: AbsenceRecord }) {
    return (
        <div className="request-card">
            <span className="request-card-head">
                <span className="request-main">
                    <span className="request-title-line">
                        {absence.absence_type?.name ?? "Absence"}
                    </span>
                    <span className="request-meta">
                        {formatDate(absence.starts_on)}
                        {absence.ends_on ? ` → ${formatDate(absence.ends_on)}` : ""}
                    </span>
                </span>
                <AbsenceStatus absence={absence} />
            </span>
            {absence.reason && <span className="request-description">{absence.reason}</span>}
        </div>
    );
}

export function AbsenceTable({ absences }: { absences: AbsenceRecord[] }) {
    const columns: Column<AbsenceRecord>[] = [
        {
            key: "type",
            header: "Type",
            render: (absence) => absence.absence_type?.name ?? "—",
        },
        {
            key: "range",
            header: "Période",
            render: (absence) =>
                `${formatDate(absence.starts_on)}${absence.ends_on ? ` → ${formatDate(absence.ends_on)}` : ""}`,
        },
        {
            key: "reason",
            header: "Motif",
            render: (absence) => <span className="muted-cell">{absence.reason ?? "—"}</span>,
        },
        {
            key: "status",
            header: "Statut",
            render: (absence) => <AbsenceStatus absence={absence} />,
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={absences}
            rowKey={(absence) => absence.id}
            emptyLabel="Aucune absence enregistrée."
        />
    );
}