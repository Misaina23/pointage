"use client";

import { Card } from "@/components/ui";
import { PlanningEventTable } from "@/components/planning";
import { usePlanning } from "@/hooks/usePlanning";

export default function ManagerPlanningPage() {
    const planning = usePlanning();

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Suivi</p>
                    <h1>Planning de l&apos;équipe</h1>
                    <p className="page-subtitle">
                        Réunions et événements impliquant vos collaborateurs.
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