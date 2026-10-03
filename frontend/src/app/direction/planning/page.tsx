"use client";

import { Card } from "@/components/ui";
import { PlanningEventTable } from "@/components/planning";
import { usePlanning } from "@/hooks/usePlanning";

export default function DirectionPlanningPage() {
    const planning = usePlanning();

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pilotage</p>
                    <h1>Planning</h1>
                    <p className="page-subtitle">
                        Agenda de la direction et événements de l&apos;organisation.
                    </p>
                </div>
            </header>

            <Card title="Événements">
                <div className="filter-row">
                    <input
                        type="date"
                        className="form-control"
                        value={planning.filters.from ?? ""}
                        onChange={(event) => planning.patch({ from: event.target.value })}
                        aria-label="Date de début"
                    />
                    <input
                        type="date"
                        className="form-control"
                        value={planning.filters.to ?? ""}
                        onChange={(event) => planning.patch({ to: event.target.value })}
                        aria-label="Date de fin"
                    />
                    <button type="button" className="text-action" onClick={planning.reload}>
                        Actualiser
                    </button>
                </div>
                {planning.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <PlanningEventTable events={planning.events} />
                )}
            </Card>
        </>
    );
}