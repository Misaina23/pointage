"use client";

import { useEffect, useState } from "react";
import { Badge, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { todayIso } from "@/lib/dates";
import { getAttendanceAvailability } from "@/services/api/attendance";
import type { AttendanceAvailability, AttendanceAvailabilityRow } from "@/types/attendance";

type AvailabilityFilter = "all" | "leave" | "permission" | "absence" | "absent";

const categoryLabels: Record<AvailabilityFilter, string> = {
    all: "Tous",
    leave: "Congés",
    permission: "Permissions",
    absence: "Absences déclarées",
    absent: "Absents détectés",
};

const columns: Column<AttendanceAvailabilityRow>[] = [
    {
        key: "employee",
        header: "Employé",
        render: (row) => (
            <div className="table-person">
                <span className="employee-avatar" aria-hidden>
                    {row.employee.full_name.charAt(0)}
                </span>
                <span>
                    <strong>{row.employee.full_name}</strong>
                    <small>{row.employee.employee_number}</small>
                </span>
            </div>
        ),
    },
    {
        key: "category",
        header: "Situation",
        render: (row) => <Badge>{row.status_label}</Badge>,
    },
    {
        key: "period",
        header: "Date / période",
        render: (row) => {
            if (!row.starts_on) {
                return "—";
            }

            return row.ends_on && row.ends_on !== row.starts_on
                ? `${row.starts_on} au ${row.ends_on}`
                : row.starts_on;
        },
    },
    { key: "hours", header: "Heures", render: (row) => row.hours ?? "—" },
    {
        key: "description",
        header: "Description",
        render: (row) => row.description,
    },
];

export function AttendanceAvailabilityPage() {
    const [from, setFrom] = useState(todayIso());
    const [to, setTo] = useState(todayIso());
    const [filter, setFilter] = useState<AvailabilityFilter>("all");
    const [search, setSearch] = useState("");
    const availability = useAsyncData<AttendanceAvailability>(
        (signal) => getAttendanceAvailability(from, to, signal),
        [from, to],
    );
    useEffect(() => {
        const refreshInterval = window.setInterval(availability.reload, 60_000);

        return () => window.clearInterval(refreshInterval);
    }, [availability.reload]);
    const rows = (availability.data?.data ?? []).filter((row) => {
        const matchesFilter = filter === "all" || row.category === filter;
        const normalizedSearch = search.trim().toLocaleLowerCase("fr");
        const matchesSearch = normalizedSearch === ""
            || row.employee.full_name.toLocaleLowerCase("fr").includes(normalizedSearch)
            || row.employee.employee_number.toLocaleLowerCase("fr").includes(normalizedSearch);

        return matchesFilter && matchesSearch;
    });
    const summary = availability.data?.summary;

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Suivi des présences</p>
                    <h1>Congés, permissions et absences</h1>
                    <p className="page-subtitle">
                        Consultez les salariés en congé ou en permission, les absences déclarées et les personnes sans pointage ni justificatif.
                    </p>
                </div>
                <div className="heading-tools">
                    <label className="field-label">
                        Date début
                        <input
                            type="date"
                            className="form-control"
                            value={from}
                            onChange={(event) => {
                                const nextFrom = event.target.value;
                                setFrom(nextFrom);

                                if (nextFrom > to) {
                                    setTo(nextFrom);
                                }
                            }}
                        />
                    </label>
                    <label className="field-label">
                        Date fin
                        <input
                            type="date"
                            className="form-control"
                            value={to}
                            min={from}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </label>
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={availability.reload}
                        disabled={availability.loading}
                    >
                        Actualiser
                    </button>
                </div>
            </header>

            <StatGrid>
                <StatCard label="En congé" value={summary?.leave ?? 0} />
                <StatCard label="En permission" value={summary?.permission ?? 0} />
                <StatCard label="Absences déclarées" value={summary?.absence ?? 0} tone="yellow" />
                <StatCard label="Sans pointage / justificatif" value={summary?.absent ?? 0} tone="red" />
            </StatGrid>

            <Card title={`Suivi du ${from} au ${to}`}>
                <div className="filter-row">
                    <label className="field-label">
                        Situation
                        <select
                            className="form-control"
                            value={filter}
                            onChange={(event) => setFilter(event.target.value as AvailabilityFilter)}
                        >
                            {Object.entries(categoryLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="field-label">
                        Rechercher un salarié
                        <input
                            type="search"
                            className="form-control"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Nom ou matricule"
                        />
                    </label>
                </div>

                {availability.error ? (
                    <p className="form-error" role="alert">
                        Impossible de charger le suivi : {availability.error}
                    </p>
                ) : availability.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={rows}
                        rowKey={(row) => row.id}
                        emptyLabel="Aucun congé, permission ou absence pour cette date."
                        pageSize={10}
                    />
                )}
            </Card>
        </>
    );
}
