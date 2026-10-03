"use client";

import { DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { formatDays } from "@/lib/formatters";
import type { LeaveBalance } from "@/types/leave";

export function LeaveBalanceCard({
    balances,
    year,
}: {
    balances: LeaveBalance[];
    year: number;
}) {
    if (balances.length === 0) {
        return (
            <div className="panel">
                <div className="panel-heading">
                    <div>
                        <h2>Soldes de congés</h2>
                        <p>Année {year}</p>
                    </div>
                </div>
                <p className="empty-history">Aucun solde configuré pour cette année.</p>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="panel-heading">
                <div>
                    <h2>Soldes de congés</h2>
                    <p>Année {year}</p>
                </div>
            </div>
            <div className="stats-grid">
                {balances.map((balance) => (
                    <div key={balance.leave_type_id} className="stat-card">
                        <span className="stat-copy">
                            <span className="stat-label">{balance.leave_type ?? "Congé"}</span>
                            <span className="stat-number">{formatDays(balance.remaining_days)}</span>
                            <span className="stat-note">
                                {formatDays(balance.used_days)} utilisés sur{" "}
                                {formatDays(balance.allocated_days)}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function LeaveBalanceTable({ balances }: { balances: LeaveBalance[] }) {
    const columns: Column<LeaveBalance>[] = [
        { key: "type", header: "Type", render: (balance) => balance.leave_type ?? "—" },
        {
            key: "allocated",
            header: "Alloué",
            align: "right",
            render: (balance) => formatDays(balance.allocated_days),
        },
        {
            key: "used",
            header: "Utilisé",
            align: "right",
            render: (balance) => formatDays(balance.used_days),
        },
        {
            key: "remaining",
            header: "Restant",
            align: "right",
            render: (balance) => formatDays(balance.remaining_days),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={balances}
            rowKey={(balance) => balance.leave_type_id}
            emptyLabel="Aucun solde de congé."
        />
    );
}