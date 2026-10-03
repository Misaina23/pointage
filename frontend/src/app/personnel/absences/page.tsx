"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { AbsenceForm, AbsenceTable } from "@/components/absences";
import { useAbsences } from "@/hooks/useAbsences";
import { REQUEST_STATUSES } from "@/lib/constants";
import type { RequestState } from "@/types/approval";

export default function AbsencesPage() {
    const absences = useAbsences();
    const [view, setView] = useState<"form" | "list">("list");

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Mes demandes</p>
                    <h1>Absences</h1>
                    <p className="page-subtitle">
                        Signalez une absence non planifiée et suivez son traitement.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "form", label: "Signaler" },
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
                        <Card title="Mes absences">
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
                            </div>
                            {absences.loading ? (
                                <p className="empty-history">Chargement…</p>
                            ) : (
                                <AbsenceTable absences={absences.absences} />
                            )}
                        </Card>
                    )}
                </div>
                <Card title="Différence entre absence et permission">
                    <div className="quick-actions">
                        <span className="quick-row">
                            <span className="quick-action-icon" aria-hidden>
                                P
                            </span>
                            <span>Une permission autorise une absence planifiée.</span>
                        </span>
                        <span className="quick-row">
                            <span className="quick-action-icon" aria-hidden>
                                A
                            </span>
                            <span>Une absence signale un fait accompli non planifié.</span>
                        </span>
                        <span className="quick-row">
                            <span className="quick-action-icon" aria-hidden>
                                C
                            </span>
                            <span>Un congé est un droit à l&apos;absence planifiée.</span>
                        </span>
                    </div>
                </Card>
            </div>
        </>
    );
}