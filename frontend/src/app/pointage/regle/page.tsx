"use client";

import { useState } from "react";
import { Card } from "@/components/ui";

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export default function RulePage() {
    const [arrival, setArrival] = useState("08:00");
    const [departure, setDeparture] = useState("17:00");
    const [schedule, setSchedule] = useState("08:00");
    const [tolerance, setTolerance] = useState(15);

    const arrived = toMinutes(arrival);
    const left = toMinutes(departure);
    const start = toMinutes(schedule);

    let status = "Présent";
    let tone: "present" | "late" | "absent" | "incomplete" = "present";
    let detail = "";

    if (left <= arrived) {
        status = "Incomplet";
        tone = "incomplete";
        detail = "L'heure de départ doit être postérieure à l'arrivée.";
    } else {
        const worked = left - arrived;
        const late = Math.max(0, arrived - start);
        if (late > tolerance) {
            status = `Retard ${late} min`;
            tone = "absent";
        } else if (late > 0) {
            status = `Retard léger ${late} min`;
            tone = "late";
        } else {
            status = `Présent · ${worked} min`;
            tone = "present";
        }
    }

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pointage</p>
                    <h1>Test de règle horaire</h1>
                    <p className="page-subtitle">
                        Simulez une arrivée et un départ pour vérifier le statut calculé selon l&apos;horaire
                        et la tolérance.
                    </p>
                </div>
            </header>

            <Card title="Paramètres">
                <div className="form-two-columns">
                    <div className="form-group">
                        <label htmlFor="arrival">Arrivée</label>
                        <input
                            id="arrival"
                            type="time"
                            className="form-control"
                            value={arrival}
                            onChange={(e) => setArrival(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="departure">Départ</label>
                        <input
                            id="departure"
                            type="time"
                            className="form-control"
                            value={departure}
                            onChange={(e) => setDeparture(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="schedule">Horaire de référence</label>
                        <input
                            id="schedule"
                            type="time"
                            className="form-control"
                            value={schedule}
                            onChange={(e) => setSchedule(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="tolerance">Tolérance (min)</label>
                        <input
                            id="tolerance"
                            type="number"
                            className="form-control"
                            value={tolerance}
                            min={0}
                            max={120}
                            onChange={(e) => setTolerance(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div style={{ marginTop: 18 }}>
                    <span className={`status-pill ${tone}`}>{status}</span>
                    {detail && <p style={{ marginTop: 10, color: "var(--mut)", fontSize: 13 }}>{detail}</p>}
                </div>
            </Card>
        </>
    );
}
