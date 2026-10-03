"use client";

import { Card, SegmentedControl } from "@/components/ui";
import { usePlanning } from "@/hooks/usePlanning";
import { endOfMonth, startOfMonth, todayIso } from "@/lib/dates";
import { useState } from "react";
import { Input } from "@/components/forms";
import { PLANNING_EVENT_TYPES } from "@/lib/constants";
import { titleCase } from "@/lib/formatters";
import type { PlanningEventType } from "@/types/planning";

export default function MyPlanningPage() {
    const planning = usePlanning({ from: todayIso(), to: endOfMonth() });
    const [range, setRange] = useState<"month" | "all">("month");

    const from = range === "month" ? todayIso() : startOfMonth();
    const to = range === "month" ? endOfMonth() : endOfMonth();

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Espace personnel</p>
                    <h1>Planning</h1>
                    <p className="page-subtitle">Les événements auxquels vous êtes associé.</p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "month", label: "Ce mois" },
                            { id: "all", label: "Année" },
                        ]}
                        active={range}
                        onChange={(id) => setRange(id as "month" | "all")}
                    />
                </div>
            </header>

            <Card title="Mes événements">
                <div className="filter-row">
                    <Input
                        label="Du"
                        type="date"
                        value={from}
                        onChange={(event) => planning.patch({ from: event.target.value })}
                    />
                    <Input
                        label="Au"
                        type="date"
                        value={to}
                        onChange={(event) => planning.patch({ to: event.target.value })}
                    />
                </div>
                {planning.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : planning.events.length === 0 ? (
                    <p className="empty-history">Aucun événement sur cette période.</p>
                ) : (
                    <div className="request-list">
                        {planning.events.map((event) => (
                            <div key={event.id} className="request-card">
                                <span className="request-card-head">
                                    <span className="request-main">
                                        <span className="request-title-line">{event.title}</span>
                                        <span className="request-meta">
                                            {event.location ?? "Lieu non précisé"} ·{" "}
                                            {titleCase(event.event_type as PlanningEventType)}
                                        </span>
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <p className="footnote">
                    {PLANNING_EVENT_TYPES.length} types d&apos;événements gérés par la plateforme.
                </p>
            </Card>
        </>
    );
}