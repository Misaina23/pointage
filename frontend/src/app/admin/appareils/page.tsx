"use client";

import { useState } from "react";
import { Button, Card, ConfirmDialog, DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { Input } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createDevice, deleteDevice, listDevices } from "@/services/api/devices";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { formatDateTime } from "@/lib/formatters";
import type { Device, DeviceList } from "@/types/device";

export default function AdminDevicesPage() {
    const { notify } = useNotifications();
    const devices = useAsyncData<DeviceList>((signal) => listDevices({}, signal), []);
    const [form, setForm] = useState({ name: "", device_code: "", location: "" });
    const [pendingDelete, setPendingDelete] = useState<Device | null>(null);
    const [busy, setBusy] = useState(false);

    const columns: Column<Device>[] = [
        { key: "name", header: "Nom", render: (row) => row.name },
        { key: "code", header: "Code", render: (row) => row.device_code },
        { key: "location", header: "Emplacement", render: (row) => row.location ?? "—" },
        {
            key: "lastSeen",
            header: "Dernier signal",
            render: (row) => formatDateTime(row.last_seen_at),
        },
        {
            key: "status",
            header: "Statut",
            render: (row) => (
                <span className={`status-pill status-${row.status === "active" ? "positive" : "neutral"}`}>
                    {row.status === "active" ? "Actif" : "Inactif"}
                </span>
            ),
        },
        {
            key: "action",
            header: "Action",
            render: (row) => (
                <button
                    type="button"
                    className="text-action"
                    disabled={row.status !== "active"}
                    onClick={() => setPendingDelete(row)}
                >
                    Désactiver
                </button>
            ),
        },
    ];

    const submit = async () => {
        if (!form.name.trim() || !form.device_code.trim()) {
            notify("Le nom et le code sont obligatoires.", "error");

            return;
        }

        setBusy(true);

        try {
            await createDevice({
                name: form.name.trim(),
                device_code: form.device_code.trim().toUpperCase(),
                location: form.location.trim() || null,
            });

            notify("Appareil enregistré.", "success");
            setForm({ name: "", device_code: "", location: "" });
            devices.reload();
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
                    <h1>Appareils</h1>
                    <p className="page-subtitle">
                        Terminaux autorisés à émettre des événements de pointage.
                    </p>
                </div>
            </header>

            <div className="content-grid">
                <Card title="Terminaux" subtitle={`${devices.data?.data.length ?? 0} appareil(s)`}>
                    {devices.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={devices.data?.data ?? []}
                            rowKey={(row) => row.id}
                            emptyLabel="Aucun appareil enregistré."
                        />
                    )}
                </Card>

                <Card title="Enregistrer un appareil">
                    <div className="form-stack">
                        <Input
                            label="Nom"
                            required
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, name: event.target.value }))
                            }
                        />
                        <Input
                            label="Code terminal"
                            required
                            hint="Identifiant transmis lors des scans."
                            value={form.device_code}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, device_code: event.target.value }))
                            }
                        />
                        <Input
                            label="Emplacement"
                            value={form.location}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, location: event.target.value }))
                            }
                        />
                        <Button onClick={submit} loading={busy}>
                            Enregistrer
                        </Button>
                    </div>
                </Card>
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Désactiver l'appareil"
                message={`${pendingDelete?.name ?? ""} ne pourra plus transmettre de pointage.`}
                confirmLabel="Désactiver"
                tone="danger"
                onCancel={() => setPendingDelete(null)}
                onConfirm={async () => {
                    if (pendingDelete) {
                        try {
                            await deleteDevice(pendingDelete.id);
                            notify("Appareil désactivé.", "success");
                            devices.reload();
                        } catch (caught) {
                            notify(
                                caught instanceof Error ? caught.message : "Désactivation impossible.",
                                "error",
                            );
                        }
                    }

                    setPendingDelete(null);
                }}
            />
        </>
    );
}