"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@/components/ui";
import type { BadgeTone, Column } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { ExportButtons, downloadFile, toCsv } from "@/components/reports";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { todayIso } from "@/lib/dates";
import { getAttendanceOverview, recomputeAttendance } from "@/services/api/attendance";
import type { AttendanceOverview, AttendanceOverviewRow } from "@/types/attendance";

type AttendanceHistoryProps = {
    eyebrow: string;
    title: string;
    subtitle: string;
    canRecompute?: boolean;
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
        key: "actual_entry",
        header: "Heure d’entrée",
        render: (row) => row.actual_entry ?? "—",
    },
    {
        key: "entry_scanned_by",
        header: "Compte sécurité (entrée)",
        render: (row) => row.entry_scanned_by ?? "Compte non enregistré",
    },
    {
        key: "actual_exit",
        header: "Heure de sortie",
        render: (row) => row.actual_exit ?? "—",
    },
    {
        key: "exit_scanned_by",
        header: "Compte sécurité (sortie)",
        render: (row) => row.exit_scanned_by ?? "Compte non enregistré",
    },
    {
        key: "status",
        header: "Statut",
        render: (row) => <Badge tone={statusTone(row.status)}>{row.status_label}</Badge>,
    },
];

function statusTone(status: AttendanceOverviewRow["status"]): BadgeTone {
    if (status === "on_time") {
        return "positive";
    }

    if (status === "late" || status === "absence") {
        return "pending";
    }

    if (status === "absent") {
        return "negative";
    }

    return "neutral";
}

export function AttendanceHistoryPage(props: AttendanceHistoryProps) {
    const { roles } = useAuth();

    if (!roles.includes("administrateur") && !roles.includes("rh")) {
        return (
            <Card title="Accès réservé">
                <p className="empty-history">
                    L’historique complet des présences est réservé aux espaces Administration et RH.
                </p>
            </Card>
        );
    }

    return <AttendanceHistoryContent {...props} />;
}

function AttendanceHistoryContent({
    eyebrow,
    title,
    subtitle,
    canRecompute = false,
}: AttendanceHistoryProps) {
    const [date, setDate] = useState(todayIso());
    const overview = useAsyncData<AttendanceOverview>(
        (signal) => getAttendanceOverview(date, signal),
        [date],
    );
    const { notify } = useNotifications();
    const [recomputing, setRecomputing] = useState(false);
    const rows = overview.data?.data ?? [];

    const handleExport = (format: "csv" | "json" | "xlsx") => {
        if (overview.loading || overview.error || !overview.data) {
            notify("Les pointages ne sont pas complètement chargés : l’export est annulé.", "error");

            return;
        }

        if (format === "xlsx") {
            notify("L’export Excel n’est pas disponible pour cet historique.", "error");

            return;
        }

        const filename = `pointagemisaina-pointages-${date}`;
        if (format === "json") {
            downloadFile(
                `${filename}.json`,
                JSON.stringify(overview.data, null, 2),
                "application/json;charset=utf-8",
            );
        } else {
            downloadFile(
                `${filename}.csv`,
                toCsv(
                    ["Date", "Employé", "Matricule", "Heure d’entrée", "Compte sécurité (entrée)", "Heure de sortie", "Compte sécurité (sortie)", "Statut", "Description"],
                    rows.map((row) => [
                        date,
                        row.employee.full_name,
                        row.employee.employee_number,
                        row.actual_entry ?? "",
                        row.entry_scanned_by ?? "Compte non enregistré",
                        row.actual_exit ?? "",
                        row.exit_scanned_by ?? "Compte non enregistré",
                        row.status_label,
                        row.description,
                    ]),
                ),
            );
        }

        notify("Export des pointages généré.", "success");
    };

    const recompute = async () => {
        setRecomputing(true);

        try {
            await recomputeAttendance({ date });
            overview.reload();
            notify("Présences recalculées.", "success");
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Recalcul impossible.", "error");
        } finally {
            setRecomputing(false);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                    <p className="page-subtitle">{subtitle}</p>
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
                    <ExportButtons onExport={handleExport} disabled={overview.loading || Boolean(overview.error)} />
                    {canRecompute && (
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={recompute}
                            disabled={recomputing}
                        >
                            {recomputing ? "Recalcul…" : "Recalculer"}
                        </button>
                    )}
                </div>
            </header>

            <StatGrid>
                <StatCard label="À l’heure" value={overview.data?.summary.on_time ?? 0} />
                <StatCard label="Retards" value={overview.data?.summary.late ?? 0} tone="yellow" />
                <StatCard label="Absents" value={overview.data?.summary.absent ?? 0} tone="red" />
                <StatCard label="En congé" value={overview.data?.summary.leave ?? 0} />
            </StatGrid>

            <Card title={`Pointages du ${date}`}>
                {overview.error ? (
                    <p className="form-error" role="alert">
                        Impossible de charger les pointages : {overview.error}
                    </p>
                ) : overview.loading ? (
                    <p className="empty-history">Chargement des pointages…</p>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={rows}
                        rowKey={(row) => row.employee.id}
                        emptyLabel="Aucun employé actif trouvé pour cette date."
                        pageSize={10}
                    />
                )}
            </Card>
        </>
    );
}
