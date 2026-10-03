"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Button, Card, ConfirmDialog, DataTable, Modal } from "@/components/ui";
import type { Column } from "@/components/ui";
import { Input, Select } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import { issueBadge, listBadges, revokeBadge } from "@/services/api/badges";
import { listEmployees } from "@/services/api/employees";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { formatDate } from "@/lib/formatters";
import type { Badge, BadgeList } from "@/types/badge";
import type { Employee, Paginated } from "@/types/user";

export default function AdminBadgesPage() {
    const { notify } = useNotifications();
    const badges = useAsyncData<BadgeList>((signal) => listBadges({}, signal), []);
    const employees = useAsyncData<Paginated<Employee>>(
        (signal) => listEmployees({ per_page: 200, status: "active" }, signal),
        [],
    );
    const [form, setForm] = useState({ employee_id: "", badge_number: "" });
    const [pendingRevoke, setPendingRevoke] = useState<Badge | null>(null);
    const [previewBadge, setPreviewBadge] = useState<Badge | null>(null);
    const [busy, setBusy] = useState(false);

    const columns: Column<Badge>[] = [
        { key: "number", header: "Numéro", render: (row) => row.badge_number },
        {
            key: "employee",
            header: "Agent",
            render: (row) =>
                row.employee ? (
                    <span>
                        <strong>{row.employee.full_name}</strong>
                        <br />
                        <small className="muted-cell">
                            {row.employee.employee_number} · {row.employee.department ?? "—"}
                        </small>
                    </span>
                ) : (
                    "Non attribué"
                ),
        },
        { key: "issued", header: "Émis le", render: (row) => formatDate(row.issued_at) },
        {
            key: "status",
            header: "Statut",
            render: (row) => (
                <span
                    className={`status-pill status-${row.status === "active" ? "positive" : row.status === "revoked" ? "negative" : "pending"}`}
                >
                    {row.status_label}
                </span>
            ),
        },
        {
            key: "action",
            header: "Actions",
            render: (row) => (
                <div className="table-actions">
                    <button
                        type="button"
                        className="text-action"
                        onClick={() => setPreviewBadge(row)}
                    >
                        Voir la carte
                    </button>
                    <button
                        type="button"
                        className="text-action"
                        disabled={row.status !== "active"}
                        onClick={() => setPendingRevoke(row)}
                    >
                        Révoquer
                    </button>
                </div>
            ),
        },
    ];

    const submit = async () => {
        if (!form.employee_id || !form.badge_number.trim()) {
            notify("L'agent et le numéro de badge sont obligatoires.", "error");

            return;
        }

        setBusy(true);

        try {
            const issued = await issueBadge({
                employee_id: Number(form.employee_id),
                badge_number: form.badge_number.trim(),
            });

            notify("Badge émis.", "success");
            setForm({ employee_id: "", badge_number: "" });
            badges.reload();
            setPreviewBadge(issued.data);
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Émission impossible.", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Paramétrage</p>
                    <h1>Badges</h1>
                    <p className="page-subtitle">
                        {badges.data?.meta.total ?? 0} badge(s) au total.
                    </p>
                </div>
            </header>

            <div className="content-grid">
                <Card title="Inventaire">
                    {badges.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : badges.error ? (
                        <p className="form-error" role="alert">
                            Impossible de charger les badges : {badges.error}
                        </p>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={badges.data?.data ?? []}
                            rowKey={(row) => row.id}
                            emptyLabel="Aucun badge enregistré."
                        />
                    )}
                </Card>

                <Card title="Émettre un badge">
                    <div className="form-stack">
                        <Select
                            label="Agent"
                            required
                            value={form.employee_id}
                            placeholder="Sélectionner"
                            disabled={employees.loading || Boolean(employees.error)}
                            error={employees.error ?? undefined}
                            hint={employees.loading ? "Chargement des agents…" : undefined}
                            options={(employees.data?.data ?? []).map((employee) => ({
                                value: String(employee.id),
                                label: `${employee.full_name} (${employee.employee_number})`,
                            }))}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, employee_id: event.target.value }))
                            }
                        />
                        <Input
                            label="Numéro de badge"
                            required
                            value={form.badge_number}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, badge_number: event.target.value }))
                            }
                        />
                        <div className="camera-actions">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        badge_number: `BDG-${Math.floor(1000 + Math.random() * 8999)}`,
                                    }))
                                }
                            >
                                Générer un numéro
                            </Button>
                        </div>
                        <Button onClick={submit} loading={busy}>
                            Émettre et générer le QR
                        </Button>
                    </div>
                </Card>
            </div>

            {previewBadge && (
                <BadgePreview
                    badge={previewBadge}
                    onClose={() => setPreviewBadge(null)}
                />
            )}

            <ConfirmDialog
                open={pendingRevoke !== null}
                title="Révoquer le badge"
                message={`Le badge ${pendingRevoke?.badge_number ?? ""} de ${pendingRevoke?.employee?.full_name ?? ""} ne pourra plus être utilisé.`}
                confirmLabel="Révoquer"
                tone="danger"
                onCancel={() => setPendingRevoke(null)}
                onConfirm={async () => {
                    if (pendingRevoke) {
                        try {
                            await revokeBadge(pendingRevoke.id);
                            notify("Badge révoqué.", "success");
                            badges.reload();
                        } catch (caught) {
                            notify(
                                caught instanceof Error ? caught.message : "Révocation impossible.",
                                "error",
                            );
                        }
                    }

                    setPendingRevoke(null);
                }}
            />
        </>
    );
}

function BadgePreview({ badge, onClose }: { badge: Badge; onClose: () => void }) {
    const [qrResult, setQrResult] = useState<
        { publicId: string; url: string } | { publicId: string; error: string } | null
    >(null);

    useEffect(() => {
        let current = true;

        void QRCode.toDataURL(badge.public_id, {
            width: 220,
            margin: 1,
            errorCorrectionLevel: "M",
        })
            .then((url) => {
                if (current) {
                setQrResult({ publicId: badge.public_id, url });
                }
            })
            .catch((caught: unknown) => {
                if (current) {
                setQrResult({
                    publicId: badge.public_id,
                    error: caught instanceof Error ? caught.message : "Génération du QR impossible.",
                });
            }
            });

        return () => {
            current = false;
        };
    }, [badge.public_id]);
    const qrCode =
        qrResult?.publicId === badge.public_id && "url" in qrResult ? qrResult.url : null;
    const qrError =
        qrResult?.publicId === badge.public_id && "error" in qrResult ? qrResult.error : null;

    return (
        <Modal
            open
            title="Carte de pointage"
            subtitle="Le QR code contient l'identifiant public lu par le scanner sécurité."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Fermer
                    </Button>
                    <Button onClick={() => window.print()} disabled={!qrCode}>
                        Imprimer la carte
                    </Button>
                </>
            }
        >
            <div className="badge-print-area">
                <div className="badge-preview">
                    {badge.employee?.photo_url ? (
                        <Image
                            className="badge-photo"
                            src={badge.employee.photo_url}
                            alt={`Photo de ${badge.employee.full_name}`}
                            width={88}
                            height={104}
                            unoptimized
                        />
                    ) : (
                        <div className="badge-photo-placeholder" aria-label="Aucune photo">
                            {badge.employee?.full_name
                                .split(/\s+/)
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase() ?? "?"}
                        </div>
                    )}
                    <strong>{badge.employee?.full_name ?? "Badge non attribué"}</strong>
                    <span>{badge.employee?.employee_number ?? "—"}</span>
                    <span className="badge-card-number">Badge {badge.badge_number}</span>
                    {qrCode ? (
                        <Image
                            className="badge-qr"
                            src={qrCode}
                            alt="Code QR du badge"
                            width={176}
                            height={176}
                            unoptimized
                        />
                    ) : qrError ? (
                        <p className="form-error" role="alert">{qrError}</p>
                    ) : (
                        <p className="empty-history">Génération du QR…</p>
                    )}
                    <small className="badge-public-id">{badge.public_id}</small>
                    {badge.status !== "active" && (
                        <span className="badge-revoked">Badge {badge.status_label.toLowerCase()}</span>
                    )}
                </div>
            </div>
        </Modal>
    );
}
