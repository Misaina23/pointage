"use client";

import { formatDateTime, formatTime } from "@/lib/formatters";
import type { AttendanceEvent } from "@/types/attendance";
import type { Employee } from "@/types/user";

export function EntryCard({
    events,
    employees = [],
}: {
    events: AttendanceEvent[];
    employees?: Employee[];
}) {
    const entries = events.filter((event) => event.event_type === "entry");

    return (
        <div className="scan-list">
            {entries.length === 0 ? (
                <p className="empty-history">Aucune arrivée enregistrée aujourd&apos;hui.</p>
            ) : (
                entries.map((event) => (
                    <div key={event.id} className="scan-row">
                        <span className="scan-avatar" aria-hidden>
                            {event.employee.first_name.charAt(0)}
                            {event.employee.last_name.charAt(0)}
                        </span>
                        <span className="scan-person">
                            <strong>
                                {event.employee.first_name} {event.employee.last_name}
                            </strong>
                            <small>{event.badge_number ?? event.employee.employee_number}</small>
                        </span>
                        <span className="scan-time">{formatTime(event.occurred_at)}</span>
                    </div>
                ))
            )}
            <span className="sr-only">{employees.length} employés chargés</span>
        </div>
    );
}

export function ExitCard({ events }: { events: AttendanceEvent[] }) {
    const exits = events.filter((event) => event.event_type === "exit");

    return (
        <div className="scan-list">
            {exits.length === 0 ? (
                <p className="empty-history">Aucune sortie enregistrée.</p>
            ) : (
                exits.map((event) => (
                    <div key={event.id} className="scan-row">
                        <span className="scan-avatar" aria-hidden>
                            {event.employee.first_name.charAt(0)}
                            {event.employee.last_name.charAt(0)}
                        </span>
                        <span className="scan-person">
                            <strong>
                                {event.employee.first_name} {event.employee.last_name}
                            </strong>
                            <small>{event.badge_number ?? event.employee.employee_number}</small>
                        </span>
                        <span className="scan-time">{formatTime(event.occurred_at)}</span>
                    </div>
                ))
            )}
        </div>
    );
}

export function ActivityTimeline({ events }: { events: AttendanceEvent[] }) {
    if (events.length === 0) {
        return <p className="empty-history">Aucun événement enregistré.</p>;
    }

    return (
        <div className="day-timeline">
            {events.slice(0, 12).map((event) => (
                <div key={event.id} className="timeline-item">
                    <span className={`timeline-mark ${event.event_type}`} aria-hidden>
                        {event.event_type === "entry" ? "E" : "S"}
                    </span>
                    <span>
                        <strong>
                            {event.employee.first_name} {event.employee.last_name}
                        </strong>
                        <small>
                            {formatDateTime(event.occurred_at)} · {event.device_code ?? "Sans terminal"}
                        </small>
                    </span>
                    <time>{formatTime(event.occurred_at)}</time>
                </div>
            ))}
        </div>
    );
}