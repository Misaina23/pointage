"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { todayIso } from "@/lib/dates";
import { getAttendanceOverview } from "@/services/api/attendance";
import type { AttendanceOverview, AttendanceOverviewRow } from "@/types/attendance";

type AvailabilityFilter = "all" | "leave" | "permission" | "absence" | "absent";

const categoryLabels: Record<AvailabilityFilter, string> = {
    all: "Tous",
    leave: "Congés",
    permission: "Permissions",
    absence: "Absences déclarées",
    absent: "Absences sans justificatif",
};

const columns: Column<AttendanceOverviewRow>[] = [
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
    {
        key: "hours",
        header: "Heures",
        render: (row) =>
            row.permission_starts_at && row.permission_ends_at
                ? `${row.permission_starts_at.slice(0, 5)} – ${row.permission_ends_at.slice(0, 5)}`
                : "—",
    },
    {
        key: "description",
        header: "Description",
        render: (row) => row.description,
    },
];

export function AttendanceAvailabilityPage() {
    const [date, setDate] = useState(todayIso());
    const [filter, setFilter] = useState<AvailabilityFilter>("all");
    const [search, setSearch] = useState("");
    const overview = useAsyncData<AttendanceOverview>(
        (signal) => getAttendanceOverview(date, signal),
        [date],
    );
    const availabilityRows = (overview.data?.data ?? []).filter((row) =>
        row.category === "leave"
        || row.category === "permission"
        || row.category === "absence"
        || row.category === "absent");
    const rows = availabilityRows.filter((row) => {
        const matchesFilter = filter === "all" || row.category === filter;
        const normalizedSearch = search.trim().toLocaleLowerCase("fr");
        const matchesSearch = normalizedSearch === ""
            || row.employee.full_name.toLocaleLowerCase("fr").includes(normalizedSearch)
            || row.employee.employee_number.toLocaleLowerCase("fr").includes(normalizedSearch);

        return matchesFilter && matchesSearch;
    });
    const summary = overview.data?.summary;

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
                        Date
                        <input
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </label>
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={overview.reload}
                        disabled={overview.loading}
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

            <Card title={`Suivi du ${date}`}>
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

                {overview.error ? (
                    <p className="form-error" role="alert">
                        Impossible de charger le suivi : {overview.error}
                    </p>
                ) : overview.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={rows}
                        rowKey={(row) => row.employee.id}
                        emptyLabel="Aucun congé, permission ou absence pour cette date."
                        pageSize={10}
                    />
                )}
            </Card>
        </>
    );
}
