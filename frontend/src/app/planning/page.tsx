"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { PlanningEventTable, PlanningForm } from "@/components/planning";
import { usePlanning } from "@/hooks/usePlanning";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAuth } from "@/hooks";
import { endOfMonth, startOfMonth, toIsoDate } from "@/lib/dates";
import { formatDate } from "@/lib/formatters";
import { PlanningCalendar } from "./calendrier";

export default function PlanningPage() {
    const { notify } = useNotifications();
    const { user } = useAuth();
    const planning = usePlanning({ from: startOfMonth(), to: endOfMonth() });
    const [view, setView] = useState<"list" | "calendar">("list");

    const canManage =
        user?.roles.some((role) =>
            ["administrateur", "rh", "direction", "responsable"].includes(role),
        ) ?? false;

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Organisation</p>
                    <h1>Planning général</h1>
                    <p className="page-subtitle">
                        Calendrier commun des réunions, formations et missions.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "list", label: "Liste" },
                            { id: "calendar", label: "Calendrier" },
                        ]}
                        active={view}
                        onChange={(id) => setView(id as "list" | "calendar")}
                    />
                </div>
            </header>

            {view === "calendar" ? (
                <Card title="Calendrier">
                    <PlanningCalendar
                        month={toIsoDate(new Date()).slice(0, 7)}
                        events={planning.events}
                    />
                </Card>
            ) : (
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
            )}

            {canManage && (
                <div style={{ marginTop: 18 }}>
                    <PlanningForm
                        submitting={planning.submitting}
                        onSubmit={async (payload) => {
                            try {
                                await planning.create(payload);
                                notify("Événement ajouté au planning général.", "success");
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

            <p className="footnote">
                {planning.events.length} événement(s) du{" "}
                {formatDate(planning.filters.from)} au {formatDate(planning.filters.to)}.
            </p>
        </>
    );
}