"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { AbsenceForm, AbsenceTable } from "@/components/absences";
import { useAbsences } from "@/hooks/useAbsences";
import { REQUEST_STATUSES } from "@/lib/constants";
import type { RequestState } from "@/types/approval";

export default function HrAbsencesPage() {
    const absences = useAbsences();
    const [view, setView] = useState<"list" | "form">("list");

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Demandes</p>
                    <h1>Absences</h1>
                    <p className="page-subtitle">
                        Suivi des absences déclarées sur le périmètre RH.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "list", label: "Absences" },
                            { id: "form", label: "Signaler" },
                        ]}
                        active={view}
                        onChange={(id) => setView(id as "list" | "form")}
                    />
                </div>
            </header>

            <div className="content-grid">
                <div style={{ display: "grid", gap: 18 }}>
                    {view === "form" ? (
                        <Card title="Signaler une absence">
                            <AbsenceForm
                                absenceTypes={absences.reference?.absence_types ?? []}
                                submitting={absences.submitting}
                                onCreate={async (payload) => {
                                    await absences.create(payload);
                                    setView("list");
                                }}
                                onCancel={() => setView("list")}
                            />
                        </Card>
                    ) : (
                        <Card title="Absences déclarées">
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
                                                      ? "Validées"
                                                      : status === "rejected"
                                                        ? "Refusées"
                                                        : "Annulées",
                                        })),
                                    ]}
                                    active={absences.status}
                                    onChange={(id) => absences.setStatus(id as RequestState | "")}
                                />
                                <button type="button" className="text-action" onClick={absences.reload}>
                                    Actualiser
                                </button>
                            </div>
                            {absences.loading ? (
                                <p className="empty-history">Chargement…</p>
                            ) : (
                                <AbsenceTable absences={absences.absences} />
                            )}
                        </Card>
                    )}
                </div>
                <Card title="Types d'absence">
                    {!absences.reference ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <div className="request-list">
                            {absences.reference.absence_types.map((type) => (
                                <div key={type.id} className="request-card">
                                    <span className="request-title-line">{type.name}</span>
                                    <span className="request-meta">
                                        {type.code} ·{" "}
                                        {type.requires_attachment
                                            ? "justificatif obligatoire"
                                            : "justificatif facultatif"}
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