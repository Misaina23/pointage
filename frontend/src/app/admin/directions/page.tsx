"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button, Card, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { Input } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createDirection, listDirections } from "@/services/api/directions";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { Direction } from "@/types/organization";

export default function AdminDirectionsPage() {
    const { notify } = useNotifications();
    const directions = useAsyncData<Direction[]>((signal) => listDirections(undefined, signal), []);
    const [form, setForm] = useState({ name: "", code: "", description: "" });
    const [busy, setBusy] = useState(false);

    const columns: Column<Direction>[] = [
        { key: "code", header: "Code", render: (row) => row.code },
        { key: "designation", header: "Désignation", render: (row) => row.description ?? row.name },
        {
            key: "employees",
            header: "Agents",
            align: "right",
            render: (row) => row.employees_count ?? 0,
        },
        {
            key: "active",
            header: "Statut",
            render: (row) => (
                <span className={`status-pill status-${row.is_active ? "positive" : "neutral"}`}>
                    {row.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
    ];

    const submit = async () => {
        if (!form.name.trim() || !form.code.trim()) {
            notify("Le libellé et le code sont obligatoires.", "error");

            return;
        }

        setBusy(true);

        try {
            await createDirection({
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
                description: form.description.trim() || null,
            });

            notify("Direction créée.", "success");
            setForm({ name: "", code: "", description: "" });
            directions.reload();
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
                    <h1>Directions</h1>
                    <p className="page-subtitle">Structure de premier niveau de l&apos;administration.</p>
                </div>
            </header>

            <div className="content-grid">
                <Card title="Répertoire" subtitle={`${directions.data?.length ?? 0} direction(s)`}>
                    {directions.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={directions.data ?? []}
                            rowKey={(row) => row.id}
                            emptyLabel="Aucune direction enregistrée."
                        />
                    )}
                </Card>

                <Card title="Nouvelle direction">
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
                            label="Code"
                            required
                            value={form.code}
                            hint="Identifiant court unique, par exemple DGRH."
                            onChange={(event) =>
                                setForm((current) => ({ ...current, code: event.target.value }))
                            }
                        />
                        <Input
                            label="Description"
                            value={form.description}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, description: event.target.value }))
                            }
                        />
                        <Button icon={<Building2 size={14} aria-hidden />} onClick={submit} loading={busy}>
                            Créer
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
}