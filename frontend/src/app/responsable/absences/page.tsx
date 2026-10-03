"use client";

import { Card, SegmentedControl } from "@/components/ui";
import { AbsenceTable } from "@/components/absences";
import { useAbsences } from "@/hooks/useAbsences";
import { REQUEST_STATUSES } from "@/lib/constants";
import { useState } from "react";
import type { RequestState } from "@/types/approval";

export default function ManagerAbsencesPage() {
    const absences = useAbsences();
    const [filter, setFilter] = useState<RequestState | "">("");

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Suivi</p>
                    <h1>Absences de l&apos;équipe</h1>
                    <p className="page-subtitle">
                        Suivi des absences déclarées dans votre périmètre.
                    </p>
                </div>
            </header>

            <Card title="Absences">
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
                        active={filter}
                        onChange={(id) => {
                            setFilter(id as RequestState | "");
                            absences.setStatus(id as RequestState | "");
                        }}
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
        </>
    );
}