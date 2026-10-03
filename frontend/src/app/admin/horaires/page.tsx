"use client";

import { useState } from "react";
import { Button, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { Input, Select } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
    assignSchedule,
    createSchedule,
    listSchedules,
} from "@/services/api/schedules";
import { listEmployees } from "@/services/api/employees";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { SCHEDULE_TYPES } from "@/lib/constants";
import { DAY_LABELS } from "@/types/schedule";
import { todayIso } from "@/lib/dates";
import { titleCase } from "@/lib/formatters";
import type { ScheduleList } from "@/types/schedule";
import type { Employee, Paginated } from "@/types/user";

type DayForm = {
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    break_starts_at: string;
    break_ends_at: string;
};

const EMPTY_DAY: DayForm = {
    day_of_week: 1,
    starts_at: "08:00",
    ends_at: "17:00",
    break_starts_at: "12:00",
    break_ends_at: "13:00",
};

export default function AdminSchedulesPage() {
    const { notify } = useNotifications();
    const schedules = useAsyncData<ScheduleList>((signal) => listSchedules(signal), []);
    const employees = useAsyncData<Paginated<Employee>>(
        (signal) => listEmployees({ per_page: 200, status: "active" }, signal),
        [],
    );
    const [meta, setMeta] = useState({
        name: "",
        schedule_type: "fixed",
        late_tolerance_minutes: "10",
    });
    const [days, setDays] = useState<DayForm[]>([{ ...EMPTY_DAY }]);
    const [assignment, setAssignment] = useState({ employee_id: "", work_schedule_id: "", starts_on: todayIso() });
    const [busy, setBusy] = useState(false);

    const columns: Column<ScheduleList["data"][number]>[] = [
        { key: "name", header: "Nom", render: (row) => row.name },
        { key: "type", header: "Type", render: (row) => titleCase(row.schedule_type) },
        {
            key: "days",
            header: "Journées",
            align: "right",
            render: (row) => row.days.filter((day) => day.starts_at).length,
        },
        {
            key: "tolerance",
            header: "Tolérance",
            align: "right",
            render: (row) => `${row.late_tolerance_minutes} min`,
        },
        {
            key: "active",
            header: "Statut",
            render: (row) => (
                <span className={`status-pill status-${row.is_active ? "positive" : "neutral"}`}>
                    {row.is_active ? "Actif" : "Inactif"}
                </span>
            ),
        },
    ];

    const submit = async () => {
        if (!meta.name.trim() || days.length === 0) {
            notify("Le nom et au moins une journée sont requis.", "error");

            return;
        }

        setBusy(true);

        try {
            await createSchedule({
                name: meta.name.trim(),
                schedule_type: meta.schedule_type as never,
                late_tolerance_minutes: Number(meta.late_tolerance_minutes) || 0,
                days: days.map((day) => ({
                    day_of_week: day.day_of_week,
                    starts_at: day.starts_at || null,
                    ends_at: day.ends_at || null,
                    break_starts_at: day.break_starts_at || null,
                    break_ends_at: day.break_ends_at || null,
                })),
            });

            notify("Horaire créé.", "success");
            setMeta({ name: "", schedule_type: "fixed", late_tolerance_minutes: "10" });
            setDays([{ ...EMPTY_DAY }]);
            schedules.reload();
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Création impossible.", "error");
        } finally {
            setBusy(false);
        }
    };

    const submitAssignment = async () => {
        if (!assignment.employee_id || !assignment.work_schedule_id) {
            notify("Sélectionnez un agent et un horaire.", "error");

            return;
        }

        setBusy(true);

        try {
            await assignSchedule({
                employee_id: Number(assignment.employee_id),
                work_schedule_id: Number(assignment.work_schedule_id),
                starts_on: assignment.starts_on,
            });

            notify("Horaire affecté.", "success");
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Affectation impossible.", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Paramétrage</p>
                    <h1>Horaires de travail</h1>
                    <p className="page-subtitle">
                        Définition des semaines types et affectation aux agents.
                    </p>
                </div>
            </header>

            <Card title="Horaires" subtitle={`${schedules.data?.data.length ?? 0} horaire(s)`}>
                {schedules.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={schedules.data?.data ?? []}
                        rowKey={(row) => row.id}
                        emptyLabel="Aucun horaire défini."
                    />
                )}
            </Card>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Nouvel horaire">
                    <div className="form-stack">
                        <Input
                            label="Nom"
                            required
                            value={meta.name}
                            onChange={(event) => setMeta((c) => ({ ...c, name: event.target.value }))}
                        />
                        <Select
                            label="Type"
                            value={meta.schedule_type}
                            placeholder="Sélectionner"
                            options={SCHEDULE_TYPES.map((type) => ({
                                value: type,
                                label: titleCase(type),
                            }))}
                            onChange={(event) =>
                                setMeta((c) => ({ ...c, schedule_type: event.target.value }))
                            }
                        />
                        <Input
                            label="Tolérance de retard (minutes)"
                            type="number"
                            min={0}
                            max={120}
                            value={meta.late_tolerance_minutes}
                            onChange={(event) =>
                                setMeta((c) => ({ ...c, late_tolerance_minutes: event.target.value }))
                            }
                        />
                        {days.map((day, index) => (
                            <fieldset key={index} className="form-two-columns" style={{ border: 0 }}>
                                <Select
                                    label="Jour"
                                    value={String(day.day_of_week)}
                                    placeholder="Sélectionner"
                                    options={DAY_LABELS.map((label, position) => ({
                                        value: String(position + 1),
                                        label,
                                    }))}
                                    onChange={(event) =>
                                        setDays((current) =>
                                            current.map((item, position) =>
                                                position === index
                                                    ? {
                                                          ...item,
                                                          day_of_week: Number(event.target.value),
                                                      }
                                                    : item,
                                            ),
                                        )
                                    }
                                />
                                <Input
                                    label="Début"
                                    type="time"
                                    value={day.starts_at}
                                    onChange={(event) =>
                                        setDays((current) =>
                                            current.map((item, position) =>
                                                position === index
                                                    ? { ...item, starts_at: event.target.value }
                                                    : item,
                                            ),
                                        )
                                    }
                                />
                                <Input
                                    label="Fin"
                                    type="time"
                                    value={day.ends_at}
                                    onChange={(event) =>
                                        setDays((current) =>
                                            current.map((item, position) =>
                                                position === index
                                                    ? { ...item, ends_at: event.target.value }
                                                    : item,
                                            ),
                                        )
                                    }
                                />
                                <div className="camera-actions">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            setDays((current) => [...current, { ...EMPTY_DAY }])
                                        }
                                    >
                                        Ajouter un jour
                                    </Button>
                                    {days.length > 1 && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                setDays((current) =>
                                                    current.filter((_, position) => position !== index),
                                                )
                                            }
                                        >
                                            Retirer
                                        </Button>
                                    )}
                                </div>
                            </fieldset>
                        ))}
                        <Button onClick={submit} loading={busy}>
                            Créer l&apos;horaire
                        </Button>
                    </div>
                </Card>

                <Card title="Affecter un horaire">
                    <div className="form-stack">
                        <Select
                            label="Agent"
                            required
                            value={assignment.employee_id}
                            placeholder="Sélectionner"
                            options={(employees.data?.data ?? []).map((employee) => ({
                                value: String(employee.id),
                                label: `${employee.full_name} (${employee.employee_number})`,
                            }))}
                            onChange={(event) =>
                                setAssignment((c) => ({ ...c, employee_id: event.target.value }))
                            }
                        />
                        <Select
                            label="Horaire"
                            required
                            value={assignment.work_schedule_id}
                            placeholder="Sélectionner"
                            options={(schedules.data?.data ?? []).map((schedule) => ({
                                value: String(schedule.id),
                                label: schedule.name,
                            }))}
                            onChange={(event) =>
                                setAssignment((c) => ({ ...c, work_schedule_id: event.target.value }))
                            }
                        />
                        <Input
                            label="À partir du"
                            type="date"
                            value={assignment.starts_on}
                            onChange={(event) =>
                                setAssignment((c) => ({ ...c, starts_on: event.target.value }))
                            }
                        />
                        <Button onClick={submitAssignment} loading={busy}>
                            Affecter
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
}