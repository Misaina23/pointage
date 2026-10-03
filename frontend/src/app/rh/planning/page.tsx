"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { PlanningEventTable, PlanningForm } from "@/components/planning";
import { usePlanning } from "@/hooks/usePlanning";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAuth } from "@/hooks";
import { PLANNING_EVENT_TYPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";
import { titleCase } from "@/lib/formatters";

export default function HrPlanningPage() {
    const { notify } = useNotifications();
    const { user } = useAuth();
    const planning = usePlanning();
    const [showForm, setShowForm] = useState(false);

    const canManage = user?.roles.some((role) => ["rh", "administrateur"].includes(role)) ?? false;

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Gestion</p>
                    <h1>Planning</h1>
                    <p className="page-subtitle">
                        Événements, réunions et sessions planifiées pour les agents.
                    </p>
                </div>
                {canManage && (
                    <div className="heading-tools">
                        <Button onClick={() => setShowForm((value) => !value)}>
                            {showForm ? "Masquer le formulaire" : "Nouvel événement"}
                        </Button>
                    </div>
                )}
            </header>

            {showForm && canManage && (
                <div style={{ marginBottom: 18 }}>
                    <PlanningForm
                        submitting={planning.submitting}
                        onSubmit={async (payload) => {
                            try {
                                await planning.create(payload);
                                setShowForm(false);
                            } catch (caught) {
                                notify(
                                    caught instanceof Error
                                        ? caught.message
                                        : "Création impossible.",
                                    "error",
                                );
                                throw caught;
                            }
                        }}
                    />
                </div>
            )}

            <Card
                title="Événements planifiés"
                subtitle={`${planning.events.length} événement(s) sur la période`}
            >
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
                    <select
                        className="form-control"
                        value={planning.filters.event_type ?? ""}
                        onChange={(event) =>
                            planning.patch({
                                event_type: (event.target.value || undefined) as never,
                            })
                        }
                        aria-label="Type d'événement"
                    >
                        <option value="">Tous les types</option>
                        {PLANNING_EVENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {titleCase(type)}
                            </option>
                        ))}
                    </select>
                    <button type="button" className="text-action" onClick={planning.reload}>
                        Actualiser
                    </button>
                </div>
                {planning.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <PlanningEventTable events={planning.events} />
                )}
                {planning.events.length > 0 && (
                    <p className="footnote">
                        Prochain événement :{" "}
                        {formatDateTime(planning.events[0]?.starts_at)} —{" "}
                        {planning.events[0]?.title}
                    </p>
                )}
            </Card>
        </>
    );
}