"use client";

import { useState } from "react";
import { Button, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { Input, Select } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createDepartment, listDepartments } from "@/services/api/departments";
import { listDirections } from "@/services/api/directions";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { Department, Direction } from "@/types/organization";

export default function AdminDepartmentsPage() {
    const { notify } = useNotifications();
    const departments = useAsyncData<Department[]>((signal) => listDepartments(undefined, signal), []);
    const directions = useAsyncData<Direction[]>((signal) => listDirections(undefined, signal), []);
    const [form, setForm] = useState({ direction_id: "", name: "", code: "" });
    const [busy, setBusy] = useState(false);

    const columns: Column<Department>[] = [
        { key: "code", header: "Code", render: (row) => row.code },
        { key: "name", header: "Libellé", render: (row) => row.name },
        {
            key: "direction",
            header: "Direction",
            render: (row) => row.direction?.name ?? "—",
        },
        {
            key: "employees",
            header: "Agents",
            align: "right",
            render: (row) => row.employees_count ?? 0,
        },
    ];

    const submit = async () => {
        if (!form.direction_id || !form.name.trim() || !form.code.trim()) {
            notify("Direction, libellé et code sont obligatoires.", "error");

            return;
        }

        setBusy(true);

        try {
            await createDepartment({
                direction_id: Number(form.direction_id),
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
            });

            notify("Département créé.", "success");
            setForm({ direction_id: "", name: "", code: "" });
            departments.reload();
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Création impossible.", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Organisation</p>
                    <h1>Départements</h1>
                    <p className="page-subtitle">Unités rattachées à une direction.</p>
                </div>
            </header>

            <div className="content-grid">
                <Card title="Répertoire" subtitle={`${departments.data?.length ?? 0} département(s)`}>
                    {departments.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={departments.data ?? []}
                            rowKey={(row) => row.id}
                            emptyLabel="Aucun département enregistré."
                        />
                    )}
                </Card>

                <Card title="Nouveau département">
                    <div className="form-stack">
                        <Select
                            label="Direction"
                            required
                            value={form.direction_id}
                            placeholder="Sélectionner"
                            options={(directions.data ?? []).map((direction) => ({
                                value: String(direction.id),
                                label: direction.name,
                            }))}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, direction_id: event.target.value }))
                            }
                        />
                        <Input
                            label="Libellé"
                            required
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, name: event.target.value }))
                            }
                        />
                        <Input
                            label="Code"
                            required
                            value={form.code}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, code: event.target.value }))
                            }
                        />
                        <Button onClick={submit} loading={busy}>
                            Créer
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
}