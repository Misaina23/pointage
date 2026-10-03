"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { ExportButtons, downloadFile, toCsv } from "@/components/reports";
import { useAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/components/providers/AuthProvider";
import { recomputeAttendance } from "@/services/api/attendance";
import { formatTime } from "@/lib/formatters";
import { AttendanceTable } from "./AttendanceTable";

type AttendanceHistoryProps = {
    eyebrow: string;
    title: string;
    subtitle: string;
    canRecompute?: boolean;
};

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
    const attendance = useAttendance(undefined, false, true, true);
    const { notify } = useNotifications();
    const [recomputing, setRecomputing] = useState(false);
    const rows = (attendance.today?.attendances.data ?? []).map((row) => ({
        attendance: row,
        employee: row.employee ?? null,
    }));

    const handleExport = (format: "csv" | "json" | "xlsx") => {
        if (
            attendance.todayLoading ||
            attendance.eventsLoading ||
            attendance.todayError ||
            attendance.eventsError ||
            !attendance.today
        ) {
            notify("Les pointages ne sont pas complètement chargés : l’export est annulé.", "error");

            return;
        }

        if (format === "xlsx") {
            notify("L’export Excel n’est pas disponible pour cet historique.", "error");

            return;
        }

        const filename = `pointagemisaina-pointages-${attendance.date}`;
        const employeeName = (employeeId: number) => {
            const employee = rows.find((row) => row.attendance.employee_id === employeeId)?.employee;

            return employee ? `${employee.first_name} ${employee.last_name}` : `#${employeeId}`;
        };

        if (format === "json") {
            downloadFile(
                `${filename}.json`,
                JSON.stringify({
                    date: attendance.date,
                    summary: attendance.today.summary,
                    attendance: rows.map(({ attendance: row, employee }) => ({
                        ...row,
                        employee,
                    })),
                    events: attendance.events,
                }, null, 2),
                "application/json;charset=utf-8",
            );
        } else {
            downloadFile(
                `${filename}.csv`,
                toCsv(
                    ["Date", "Type", "Employé", "Matricule", "Action", "Heure évènement", "Entrée", "Sortie", "Minutes travaillées", "Retard (min)", "Heures sup. (min)", "Badge", "Terminal"],
                    [
                        ...rows.map(({ attendance: row, employee }) => [
                            row.attendance_date,
                            "Présence",
                            employee?.full_name ?? employeeName(row.employee_id),
                            employee?.employee_number ?? "",
                            row.status,
                            "",
                            row.first_entry ?? "",
                            row.last_exit ?? "",
                            row.worked_minutes,
                            row.late_minutes,
                            row.overtime_minutes,
                            "",
                            "",
                        ]),
                        ...attendance.events.map((event) => [
                            attendance.date,
                            "Événement",
                            `${event.employee.first_name} ${event.employee.last_name}`,
                            event.employee.employee_number,
                            event.event_type === "entry" ? "Entrée" : "Sortie",
                            formatTime(event.occurred_at),
                            "",
                            "",
                            "",
                            "",
                            "",
                            event.badge_number ?? "",
                            event.device_code ?? "",
                        ]),
                    ],
                ),
            );
        }

        notify("Export des pointages généré.", "success");
    };

    const recompute = async () => {
        setRecomputing(true);

        try {
            const result = await recomputeAttendance({ date: attendance.date });
            attendance.reload();
            notify(`${result.processed} présence(s) recalculée(s).`, "success");
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
                            value={attendance.date}
                            onChange={(event) => attendance.setDate(event.target.value)}
                        />
                    </label>
                    <ExportButtons
                        onExport={handleExport}
                        disabled={
                            attendance.todayLoading ||
                            attendance.eventsLoading ||
                            Boolean(attendance.todayError) ||
                            Boolean(attendance.eventsError)
                        }
                    />
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
                <StatCard label="Présents" value={attendance.today?.summary.present ?? 0} />
                <StatCard label="Retards" value={attendance.today?.summary.late ?? 0} tone="yellow" />
                <StatCard label="Absents" value={attendance.today?.summary.absent ?? 0} tone="red" />
            </StatGrid>

            <Card title={`Pointages du ${attendance.date}`}>
                {attendance.todayError ? (
                    <p className="form-error" role="alert">
                        Impossible de charger les présences : {attendance.todayError}
                    </p>
                ) : attendance.todayLoading ? (
                    <p className="empty-history">Chargement des présences…</p>
                ) : (
                    <AttendanceTable rows={rows} />
                )}
            </Card>
        </>
    );
}
