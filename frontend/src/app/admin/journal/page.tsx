"use client";

import { useState } from "react";
import { Card, DataTable, Pagination } from "@/components/ui";
import type { Column } from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAuditLogs } from "@/services/api/reports";
import { formatDateTime } from "@/lib/formatters";
import { titleCase } from "@/lib/formatters";
import type { AuditLog } from "@/types/report";

export default function AdminJournalPage() {
    const [page, setPage] = useState(1);
    const logs = useAsyncData(
        (signal) => listAuditLogs({ page, per_page: 5 }, signal),
        [page],
    );

    const columns: Column<AuditLog>[] = [
        { key: "date", header: "Date", render: (row) => formatDateTime(row.created_at) },
        { key: "actor", header: "Acteur", render: (row) => row.actor ?? "système" },
        { key: "action", header: "Action", render: (row) => titleCase(row.action) },
        {
            key: "subject",
            header: "Objet",
            render: (row) => `${row.subject_type} #${row.subject_id}`,
        },
        { key: "ip", header: "Adresse IP", render: (row) => row.ip_address ?? "—" },
    ];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Paramétrage</p>
                    <h1>Journal d&apos;audit</h1>
                    <p className="page-subtitle">
                        Trace des opérations sensibles réalisées dans la plateforme.
                    </p>
                </div>
            </header>

            <Card title="Événements">
                {logs.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            rows={logs.data?.data ?? []}
                            rowKey={(row) => row.id}
                            emptyLabel="Aucun événement enregistré."
                            pagination={false}
                        />
                        <Pagination
                            currentPage={logs.data?.meta?.current_page ?? 1}
                            lastPage={logs.data?.meta?.last_page ?? 1}
                            onChange={setPage}
                        />
                    </>
                )}
            </Card>
        </>
    );
}