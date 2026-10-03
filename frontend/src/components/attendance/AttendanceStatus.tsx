"use client";

import { StatusBadge } from "@/components/ui";
import { formatDate, formatMinutes, formatTime } from "@/lib/formatters";
import type { Attendance, AttendanceStatusValue } from "@/types/attendance";

const LABELS: Record<AttendanceStatusValue, string> = {
    present: "Présent",
    late: "En retard",
    absent: "Absent",
    on_leave: "En congé",
    on_permission: "En permission",
    remote: "Télé travail",
    holiday: "Jour férié",
    rest_day: "Jour de repos",
    incomplete: "Incomplet",
};

export function statusLabel(status: AttendanceStatusValue): string {
    return LABELS[status] ?? status;
}

export function AttendanceStatus({ status }: { status: AttendanceStatusValue }) {
    return <StatusBadge status={status} label={statusLabel(status)} />;
}

export function LateBadge({ minutes }: { minutes: number }) {
    if (minutes <= 0) {
        return null;
    }

    return <span className="status-pill status-pending">+{formatMinutes(minutes)}</span>;
}

export function AttendanceHistory({ attendance }: { attendance: Attendance | null }) {
    if (!attendance) {
        return <p className="empty-history">Aucune présence enregistrée.</p>;
    }

    return (
        <div className="history-list">
            <div className="history-row">
                <span className="history-avatar" aria-hidden>
                    E
                </span>
                <span>
                    <span className="history-name">Entrée</span>
                    <span className="history-code">{formatDate(attendance.attendance_date)}</span>
                </span>
                <span className="history-time">{formatTime(attendance.first_entry)}</span>
            </div>
            <div className="history-row">
                <span className="history-avatar" aria-hidden>
                    S
                </span>
                <span>
                    <span className="history-name">Sortie</span>
                    <span className="history-code">
                        {formatMinutes(attendance.worked_minutes)} travaillées
                    </span>
                </span>
                <span className="history-time">{formatTime(attendance.last_exit)}</span>
            </div>
        </div>
    );
}