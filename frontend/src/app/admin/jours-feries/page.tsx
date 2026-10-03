"use client";

import { useState } from "react";
import { Button, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { Input } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createHoliday, listHolidays } from "@/services/api/schedules";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { formatDate } from "@/lib/formatters";
import type { HolidayList } from "@/types/schedule";

export default function AdminHolidaysPage() {
    const { notify } = useNotifications();
    const [year, setYear] = useState(new Date().getFullYear());
    const holidays = useAsyncData<HolidayList>(
        (signal) => listHolidays(year, signal),
        [year],
    );
    const [form, setForm] = useState({ name: "", date: "", is_paid: true });
    const [busy, setBusy] = useState(false);

    const columns: Column<HolidayList["data"][number]>[] = [
        { key: "date", header: "Date", render: (row) => formatDate(row.date) },
        { key: "name", header: "Libellé", render: (row) => row.name },
        {
            key: "paid",
            header: "Rémunéré",
            render: (row) => (
                <span className={`status-pill status-${row.is_paid ? "positive" : "neutral"}`}>
                    {row.is_paid ? "Oui" : "Non"}
                </span>
            ),
        },
    ];

    const submit = async () => {
        if (!form.name.trim() || !form.date) {
            notify("Le libellé et la date sont obligatoires.", "error");

            return;
        }

        setBusy(true);

        try {
            await createHoliday({ name: form.name.trim(), date: form.date, is_paid: form.is_paid });
            notify("Jour férié enregistré.", "success");
            setForm({ name: "", date: "", is_paid: true });
            holidays.reload();
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Enregistrement impossible.", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Paramétrage</p>
                    <h1>Jours fériés</h1>
                    <p className="page-subtitle">
                        Jours non travaillés pris en compte dans le calcul des présences.
                    </p>
                </div>
            </header>

            <div className="content-grid">
                <Card title={`Calendrier ${year}`}>
                    <div className="filter-row">
                        <Input
                            label="Année"
                            type="number"
                            value={String(year)}
                            onChange={(event) => setYear(Number(event.target.value) || year)}
                        />
                    </div>
                    {holidays.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={holidays.data?.data ?? []}
                            rowKey={(row) => row.id}
                            emptyLabel="Aucun jour férié pour cette année."
                        />
                    )}
                </Card>

                <Card title="Ajouter un jour férié">
                    <div className="form-stack">
                        <Input
                            label="Libellé"
                            required
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, name: event.target.value }))
                            }
                        />
                        <Input
                            label="Date"
                            type="date"
                            required
                            value={form.date}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, date: event.target.value }))
                            }
                        />
                        <label className="quick-row">
                            <input
                                type="checkbox"
                                checked={form.is_paid}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, is_paid: event.target.checked }))
                                }
                            />
                            <span>Jour rémunéré</span>
                        </label>
                        <Button onClick={submit} loading={busy}>
                            Enregistrer
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
}