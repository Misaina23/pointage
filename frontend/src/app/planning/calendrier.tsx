"use client";

import { useMemo } from "react";
import { formatDate, titleCase } from "@/lib/formatters";
import type { PlanningEvent } from "@/types/planning";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function PlanningCalendar({
    month,
    events,
}: {
    month: string;
    events: PlanningEvent[];
}) {
    const cells = useMemo(() => {
        const [year, monthIndex] = month.split("-").map(Number);
        const daysInMonth = new Date(year, monthIndex, 0).getDate();
        const firstWeekday = (new Date(year, monthIndex - 1, 1).getDay() + 6) % 7;

        return Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
            const dayNumber = index - firstWeekday + 1;

            if (dayNumber < 1 || dayNumber > daysInMonth) {
                return null;
            }

            const date = `${month}-${`${dayNumber}`.padStart(2, "0")}`;

            return { date, dayNumber };
        });
    }, [month]);

    const byDate = useMemo(() => {
        const map = new Map<string, PlanningEvent[]>();

        for (const event of events) {
            if (!event.starts_at) {
                continue;
            }

            const key = event.starts_at.slice(0, 10);
            map.set(key, [...(map.get(key) ?? []), event]);
        }

        return map;
    }, [events]);

    return (
        <div className="planning-table" role="grid" aria-label={`Calendrier ${month}`}>
            {WEEKDAYS.map((day) => (
                <span key={day} className="side-label" role="columnheader">
                    {day}
                </span>
            ))}
            {cells.map((cell, index) => {
                if (!cell) {
                    return (
                        <span key={`empty-${index}`} className="schedule-line" role="gridcell" />
                    );
                }

                const dayEvents = byDate.get(cell.date) ?? [];

                return (
                    <span key={cell.date} className="schedule-line" role="gridcell" title={formatDate(cell.date)}>
                        <strong>{cell.dayNumber}</strong>
                        {dayEvents.slice(0, 2).map((event) => (
                            <small key={event.id} className="event-title">
                                {titleCase(event.event_type)} · {event.title}
                            </small>
                        ))}
                        {dayEvents.length > 2 && <small>+{dayEvents.length - 2} autres</small>}
                    </span>
                );
            })}
        </div>
    );
}

export default PlanningCalendar;