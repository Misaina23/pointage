"use client";

import { useMemo, useState } from "react";
import { Button, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { SearchInput } from "@/components/forms";
import { toIsoDate } from "@/lib/dates";
import { listEmployees } from "@/services/api/employees";
import { useAsyncData } from "@/hooks/useAsyncData";
import { formatDateTime, initials, titleCase } from "@/lib/formatters";
import type { Employee } from "@/types/user";

type Props = {
    selected: number[];
    onChange: (ids: number[]) => void;
    label?: string;
};

export function ParticipantSelector({ selected, onChange, label }: Props) {
    const [search, setSearch] = useState("");
    const employees = useAsyncData<Employee[]>(
        (signal) =>
            listEmployees({ search: search || undefined, per_page: 50, status: "active" }, signal).then(
                (page) => page.data,
            ),
        [search],
    );

    const options = useMemo(() => employees.data ?? [], [employees.data]);

    const toggle = (id: number) => {
        onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
    };

    return (
        <div className="form-stack">
            {label && <span className="field-label">{label}</span>}
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un agent" />
            {employees.loading ? (
                <p className="empty-history">Chargement…</p>
            ) : (
                <div className="request-list" role="group">
                    {options.length === 0 ? (
                        <p className="empty-history">Aucun agent trouvé.</p>
                    ) : (
                        options.map((employee) => (
                            <label key={employee.id} className="quick-row">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(employee.id)}
                                    onChange={() => toggle(employee.id)}
                                />
                                <span className="scan-avatar" aria-hidden>
                                    {initials(`${employee.first_name} ${employee.last_name}`)}
                                </span>
                                <span>
                                    <strong>{employee.full_name}</strong>
                                    <small>
                                        {employee.employee_number}
                                        {employee.department ? ` · ${employee.department.name}` : ""}
                                    </small>
                                </span>
                            </label>
                        ))
                    )}
                </div>
            )}
            <div className="camera-actions">
                <Button variant="secondary" size="sm" onClick={() => onChange(options.map((item) => item.id))}>
                    Tout sélectionner
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onChange([])}>
                    Tout désélectionner
                </Button>
            </div>
        </div>
    );
}

export function PlanningEventTable({
    events,
    onSelect,
}: {
    events: import("@/types/planning").PlanningEvent[];
    onSelect?: (event: import("@/types/planning").PlanningEvent) => void;
}) {
    const columns: Column<import("@/types/planning").PlanningEvent>[] = [
        {
            key: "title",
            header: "Événement",
            render: (event) => (
                <span>
                    <strong>{event.title}</strong>
                    <br />
                    <small className="muted-cell">{titleCase(event.event_type)}</small>
                </span>
            ),
        },
        {
            key: "start",
            header: "Début",
            render: (event) => formatDateTime(event.starts_at),
        },
        {
            key: "location",
            header: "Lieu",
            render: (event) => event.location ?? "—",
        },
        {
            key: "participants",
            header: "Participants",
            align: "right",
            render: (event) => event.participants.length,
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={events}
            rowKey={(event) => event.id}
            emptyLabel="Aucun événement planifié sur cette période."
            onRowClick={onSelect}
        />
    );
}

export function PlanningCard({ event }: { event: import("@/types/planning").PlanningEvent }) {
    return (
        <div className="request-card">
            <span className="request-card-head">
                <span className="request-main">
                    <span className="request-title-line">{event.title}</span>
                    <span className="request-meta">{formatDateTime(event.starts_at)}</span>
                </span>
                <span className="status-pill status-neutral">{titleCase(event.event_type)}</span>
            </span>
            <span className="request-description">
                {event.location ?? "Lieu non précisé"} · {event.participants.length} participant(s)
            </span>
        </div>
    );
}

export function PlanningMonth({ month }: { month: string }) {
    const days = useMemo(() => {
        const [year, monthIndex] = month.split("-").map(Number);
        const count = new Date(year, monthIndex, 0).getDate();

        return Array.from({ length: count }, (_, index) => toIsoDate(new Date(year, monthIndex - 1, index + 1)));
    }, [month]);

    return (
        <div className="planning-table">
            {days.map((day) => (
                <span key={day} className="schedule-line" title={day}>
                    {Number(day.slice(-2))}
                </span>
            ))}
        </div>
    );
}

export { Card };