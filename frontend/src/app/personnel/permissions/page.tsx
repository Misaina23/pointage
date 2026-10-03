"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { PermissionForm, PermissionTable } from "@/components/permissions";
import { useAbsences } from "@/hooks/useAbsences";
import { usePermissions } from "@/hooks/usePermissions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { REQUEST_STATUSES } from "@/lib/constants";
import { listLeaveBalances } from "@/services/api/leaves";
import type { LeaveBalances } from "@/types/leave";
import type { RequestState } from "@/types/approval";

export default function PermissionsPage() {
    const permissions = usePermissions();
    const { reference } = useAbsences();
    const [view, setView] = useState<"form" | "list">("form");
    const year = new Date().getFullYear();
    const balances = useAsyncData<LeaveBalances>(
        (signal) => listLeaveBalances(year, signal),
        [year],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Mes demandes</p>
                    <h1>Permissions</h1>
                    <p className="page-subtitle">
                        Demandez une autorisation de présence sur une plage horaire précise.
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
                        <Card title="Nouvelle demande de permission">
                            <PermissionForm
                                permissionTypes={reference?.permission_types ?? []}
                                submitting={permissions.submitting}
                                onCreate={async (payload) => {
                                    await permissions.create(payload);
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
                                    active={permissions.status}
                                    onChange={(id) => permissions.setStatus(id as RequestState | "")}
                                />
                            </div>
                            {permissions.loading ? (
                                <p className="empty-history">Chargement…</p>
                            ) : (
                                <PermissionTable permissions={permissions.permissions} />
                            )}
                        </Card>
                    )}
                </div>
                <div style={{ display: "grid", gap: 18 }}>
                    <Card
                        title="Quota annuel de permissions"
                        subtitle={`Année ${year}`}
                    >
                        {balances.error ? (
                            <p className="form-error" role="alert">
                                Impossible de charger votre quota : {balances.error}
                            </p>
                        ) : balances.loading ? (
                            <p className="empty-history">Chargement…</p>
                        ) : (
                            <p className="request-description">
                                {balances.data?.permission_allowance?.remaining_days ?? 2} jour(s)
                                restant(s) sans déduction. Au-delà, les jours supplémentaires
                                sont déduits du solde annuel de congés.
                            </p>
                        )}
                    </Card>
                    <Card title="Bonnes pratiques" subtitle="Pour accélérer la validation">
                        <div className="quick-actions">
                            <span className="quick-row">
                                <span className="quick-action-icon" aria-hidden>
                                    1
                                </span>
                                <span>Précisez le motif et la plage horaire exacte.</span>
                            </span>
                            <span className="quick-row">
                                <span className="quick-action-icon" aria-hidden>
                                    2
                                </span>
                                <span>Joignez la pièce justificative si elle est exigée.</span>
                            </span>
                            <span className="quick-row">
                                <span className="quick-action-icon" aria-hidden>
                                    3
                                </span>
                                <span>
                                    Vérifiez le circuit de validation dans l&apos;historique.
                                </span>
                            </span>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}