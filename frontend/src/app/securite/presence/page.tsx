"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { AttendanceTable } from "@/components/attendance";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendance } from "@/services/api/attendance";
import { useAttendance } from "@/hooks/useAttendance";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import { titleCase } from "@/lib/formatters";
import type { AttendanceStatusValue, AttendanceToday } from "@/types/attendance";
import type { Paginated } from "@/types/user";

export default function PresencePage() {
    const attendance = useAttendance(undefined, true, false);
    const date = attendance.date;
    const [status, setStatus] = useState<AttendanceStatusValue | "">("");

    const page = useAsyncData<Paginated<AttendanceToday["attendances"]["data"][number]>>(
        (signal) =>
            listAttendance(
                { date, status: status || undefined, per_page: 200 },
                signal,
            ) as Promise<Paginated<AttendanceToday["attendances"]["data"][number]>>,
        [date, status],
    );
    const rows = (page.data?.data ?? []).map((row) => ({
        attendance: row,
        employee: row.employee ?? null,
    }));

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Contrôle d&apos;accès</p>
                    <h1>Présence du jour</h1>
                    <p className="page-subtitle">
                        Situation des agents pour la journée en cours.
                    </p>
                </div>
            </header>

            <StatGrid>
                <StatCard label="Présents" value={attendance.today?.summary.present ?? 0} />
                <StatCard label="Retards" value={attendance.today?.summary.late ?? 0} tone="yellow" />
                <StatCard label="Absents" value={attendance.today?.summary.absent ?? 0} tone="red" />
            </StatGrid>

            <Card title="Présence du jour">
                <div className="filter-row">
                    <label className="field-label">
                        Statut
                        <select
                            className="form-control"
                            value={status}
                            onChange={(event) => setStatus(event.target.value as AttendanceStatusValue | "")}
                        >
                            <option value="">Tous les statuts</option>
                            {ATTENDANCE_STATUSES.map((value) => (
                                <option key={value} value={value}>
                                    {titleCase(value)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {attendance.todayError || page.error ? (
                    <p className="form-error" role="alert">
                        Impossible de charger les présences : {attendance.todayError ?? page.error}
                    </p>
                ) : attendance.todayLoading || page.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <AttendanceTable rows={rows} />
                )}
            </Card>
        </>
    );
}