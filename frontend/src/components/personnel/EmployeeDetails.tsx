"use client";

import { DataTable, Modal } from "@/components/ui";
import { formatDate, formatMinutes, formatTime } from "@/lib/formatters";
import { AttendanceStatus } from "@/components/attendance/AttendanceStatus";
import { EmployeeAvatar } from "./EmployeeCard";
import type { AttendanceEvent, EmployeeAttendanceDetail } from "@/types/attendance";
import type { Employee } from "@/types/user";

export function EmployeeDetails({
    detail,
    onClose,
}: {
    detail: EmployeeAttendanceDetail | null;
    onClose: () => void;
}) {
    if (!detail) {
        return null;
    }

    return (
        <Modal
            open
            title={detail.employee.full_name}
            subtitle={`${detail.employee.employee_number} · ${detail.employee.position_title ?? "Poste non défini"}`}
            onClose={onClose}
            size="lg"
        >
            <div className="profile-details">
                <div>
                    <dt>Direction / département</dt>
                    <dd>{detail.employee.department?.name ?? detail.employee.direction?.name ?? "—"}</dd>
                </div>
                <div>
                    <dt>Email</dt>
                    <dd>{detail.employee.email ?? "—"}</dd>
                </div>
                <div>
                    <dt>Statut du jour</dt>
                    <dd>
                        <AttendanceStatus status={detail.attendance.status} />
                    </dd>
                </div>
                <div>
                    <dt>Entrée</dt>
                    <dd>{formatTime(detail.attendance.first_entry)}</dd>
                </div>
                <div>
                    <dt>Sortie</dt>
                    <dd>{formatTime(detail.attendance.last_exit)}</dd>
                </div>
                <div>
                    <dt>Travail</dt>
                    <dd>{formatMinutes(detail.attendance.worked_minutes)}</dd>
                </div>
                <div>
                    <dt>Retard</dt>
                    <dd>{formatMinutes(detail.attendance.late_minutes)}</dd>
                </div>
            </div>
            <h3 className="panel-heading" style={{ marginTop: 20 }}>
                Événements
            </h3>
            {detail.events.data.length === 0 ? (
                <p className="empty-history">Aucun pointage pour cette journée.</p>
            ) : (
                <EmployeeEventsTable events={detail.events.data} />
            )}
        </Modal>
    );
}

export function EmployeeEventsTable({ events }: { events: AttendanceEvent[] }) {
    return (
        <DataTable
            columns={[
                {
                    key: "time",
                    header: "Heure",
                    render: (event) => formatTime(event.occurred_at),
                },
                {
                    key: "type",
                    header: "Type",
                    render: (event) => (event.event_type === "entry" ? "Entrée" : "Sortie"),
                },
                {
                    key: "device",
                    header: "Terminal",
                    render: (event) => event.device_code ?? "—",
                },
                {
                    key: "badge",
                    header: "Badge",
                    render: (event) => event.badge_number ?? "—",
                },
            ]}
            rows={events}
            rowKey={(event) => event.id}
            emptyLabel="Aucun événement."
        />
    );
}

export function EmployeeProfileCard({ employee }: { employee: Employee }) {
    return (
        <div className="profile-panel">
            <div className="profile-main">
                <EmployeeAvatar employee={employee} size="lg" />
                <div>
                    <strong>{employee.full_name}</strong>
                    <small>{employee.employee_number}</small>
                </div>
            </div>
            <div className="profile-org">
                {employee.direction && <span>{employee.direction.name}</span>}
                {employee.department && <span>{employee.department.name}</span>}
            </div>
            <div className="profile-details">
                <div>
                    <dt>Recrutement</dt>
                    <dd>{formatDate(employee.hire_date)}</dd>
                </div>
                <div>
                    <dt>Contrat</dt>
                    <dd>{employee.employment_type ?? "—"}</dd>
                </div>
            </div>
        </div>
    );
}