"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { PermissionForm, PermissionTable } from "@/components/permissions";
import { useAbsences } from "@/hooks/useAbsences";
import { usePermissions } from "@/hooks/usePermissions";
import { REQUEST_STATUSES } from "@/lib/constants";
import type { RequestState } from "@/types/approval";

export default function HrPermissionsPage() {
    const permissions = usePermissions();
    const { reference } = useAbsences();
    const [view, setView] = useState<"list" | "form">("list");

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Demandes</p>
                    <h1>Permissions</h1>
                    <p className="page-subtitle">
                        Suivi des demandes de permission du périmètre RH.
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
                        <Card title="Saisir une permission">
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
                                    active={permissions.status}
                                    onChange={(id) => permissions.setStatus(id as RequestState | "")}
                                />
                                <button
                                    type="button"
                                    className="text-action"
                                    onClick={permissions.reload}
                                >
                                    Actualiser
                                </button>
                            </div>
                            {permissions.loading ? (
                                <p className="empty-history">Chargement…</p>
                            ) : (
                                <PermissionTable permissions={permissions.permissions} />
                            )}
                        </Card>
                    )}
                </div>
                <Card title="Types de permission">
                    {!reference ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <div className="request-list">
                            {reference.permission_types.map((type) => (
                                <div key={type.id} className="request-card">
                                    <span className="request-title-line">{type.name}</span>
                                    <span className="request-meta">
                                        {type.code} ·{" "}
                                        {type.requires_attachment
                                            ? "pièce jointe obligatoire"
                                            : "pièce jointe facultative"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}