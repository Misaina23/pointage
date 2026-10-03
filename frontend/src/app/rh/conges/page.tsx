"use client";

import { useState } from "react";
import { Card, ConfirmDialog, SegmentedControl } from "@/components/ui";
import { LeaveForm, LeaveTable } from "@/components/leaves";
import { useAbsences } from "@/hooks/useAbsences";
import { useLeaves } from "@/hooks/useLeaves";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { REQUEST_STATUSES } from "@/lib/constants";
import type { RequestState } from "@/types/approval";

export default function HrLeavesPage() {
    const { notify } = useNotifications();
    const leaves = useLeaves();
    const { reference } = useAbsences();
    const [view, setView] = useState<"list" | "form">("list");
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Demandes</p>
                    <h1>Congés</h1>
                    <p className="page-subtitle">
                        Suivi des demandes de congé du périmètre RH.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "list", label: "Demandes" },
                            { id: "form", label: "Nouvelle demande" },
                        ]}
                        active={view}
                        onChange={(id) => setView(id as "list" | "form")}
                    />
                </div>
            </header>

            <div className="content-grid">
                <div style={{ display: "grid", gap: 18 }}>
                    {view === "form" ? (
                        <Card title="Saisir une demande">
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
                        <Card title="Demandes reçues">
                            <div className="filter-row">
                                <SegmentedControl
                                    items={[
                                        { id: "", label: "Toutes" },
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
                                <button
                                    type="button"
                                    className="text-action"
                                    onClick={leaves.reload}
                                >
                                    Actualiser
                                </button>
                            </div>
                            {leaves.loading ? (
                                <p className="empty-history">Chargement…</p>
                            ) : (
                                <LeaveTable leaves={leaves.leaves} />
                            )}
                        </Card>
                    )}
                </div>
                <Card title="Circuits de validation">
                    <p className="request-description">
                        Les demandes suivent le circuit défini par le workflow correspondant au
                        département de l&apos;agent. La validation est effectuée depuis l&apos;espace
                        Direction ou Responsable.
                    </p>
                    <p className="footnote">
                        {leaves.leaves.filter((leave) => leave.status === "pending").length} demande(s)
                        en attente de traitement.
                    </p>
                </Card>
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Supprimer la demande"
                message="Cette action retire définitivement la demande de congé."
                confirmLabel="Supprimer"
                tone="danger"
                onCancel={() => setPendingDelete(null)}
                onConfirm={async () => {
                    if (pendingDelete !== null) {
                        try {
                            await leaves.remove(pendingDelete);
                            notify("Demande supprimée.", "success");
                        } catch (caught) {
                            notify(
                                caught instanceof Error ? caught.message : "Suppression impossible.",
                                "error",
                            );
                        }
                    }

                    setPendingDelete(null);
                }}
            />
        </>
    );
}