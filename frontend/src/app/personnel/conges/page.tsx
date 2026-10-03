"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { LeaveBalanceCard, LeaveForm, LeaveTable } from "@/components/leaves";
import { useAbsences } from "@/hooks/useAbsences";
import { useLeaves } from "@/hooks/useLeaves";
import { REQUEST_STATUSES } from "@/lib/constants";
import { listLeaveBalances } from "@/services/api/leaves";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { LeaveBalance } from "@/types/leave";
import type { RequestState } from "@/types/approval";

export default function LeavesPage() {
    const leaves = useLeaves();
    const { reference } = useAbsences();
    const [view, setView] = useState<"form" | "list">("form");
    const year = new Date().getFullYear();
    const balances = useAsyncData<{ data: LeaveBalance[] }>(
        (signal) => listLeaveBalances(year, signal),
        [year],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Mes demandes</p>
                    <h1>Congés</h1>
                    <p className="page-subtitle">
                        Déposez une demande et suivez son parcours de validation.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "form", label: "Nouvelle demande" },
                            { id: "list", label: "Historique" },
                        ]}
                        active={view}
                        onChange={(id) => setView(id as "form" | "list")}
                    />
                </div>
            </header>

            <div className="content-grid">
                <div style={{ display: "grid", gap: 18 }}>
                    {view === "form" ? (
                        <Card title="Nouvelle demande de congé">
                            <LeaveForm
                                leaveTypes={reference?.leave_types ?? []}
                                submitting={leaves.submitting}
                                onCreate={async (payload) => {
                                    await leaves.create(payload);
                                    setView("list");
                                }}
                                onCancel={() => setView("list")}
                            />
                        </Card>
                    ) : (
                        <Card title="Mes demandes">
                            <div className="filter-row">
                                <SegmentedControl
                                    items={[
                                        { id: "", label: "Tous" },
                                        ...REQUEST_STATUSES.map((status) => ({
                                            id: status,
                                            label:
                                                status === "pending"
                                                    ? "En attente"
                                                    : status === "approved"
                                                      ? "Approuvées"
                                                      : status === "rejected"
                                                        ? "Refusées"
                                                        : "Annulées",
                                        })),
                                    ]}
                                    active={leaves.status}
                                    onChange={(id) => leaves.setStatus(id as RequestState | "")}
                                />
                            </div>
                            {leaves.loading ? (
                                <p className="empty-history">Chargement…</p>
                            ) : (
                                <LeaveTable leaves={leaves.leaves} />
                            )}
                        </Card>
                    )}
                </div>
                <LeaveBalanceCard balances={balances.data?.data ?? []} year={year} />
            </div>
        </>
    );
}