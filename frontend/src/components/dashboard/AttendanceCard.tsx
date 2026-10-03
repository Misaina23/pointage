"use client";

import { CalendarClock, CalendarDays, FileCheck2, UserCheck, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { formatDate, formatMinutes, formatTime } from "@/lib/formatters";
import { AttendanceStatus } from "@/components/attendance/AttendanceStatus";
import { StatCard, StatGrid } from "./StatCard";
import type { AttendanceEvent } from "@/types/attendance";
import type { OrganizationDashboard, PersonalDashboard } from "@/types/report";

export function AttendanceCard({ dashboard }: { dashboard: PersonalDashboard | null }) {
    if (!dashboard) {
        return (
            <Card title="Ma journée">
                <p className="empty-history">Données indisponibles.</p>
            </Card>
        );
    }

    return (
        <Card
            title="Ma journée"
            subtitle={dashboard.shift?.is_rest_day ? " Jour de repos" : dashboard.shift?.starts_at ? `Horaire : ${dashboard.shift.starts_at} – ${dashboard.shift.ends_at ?? "…"}` : undefined}
        >
            <StatGrid>
                <StatCard
                    icon={CalendarClock}
                    label="Entrée"
                    value={formatTime(dashboard.today.first_entry)}
                    tone="green"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Sortie"
                    value={formatTime(dashboard.today.last_exit)}
                    tone="blue"
                />
                <StatCard
                    icon={UserCheck}
                    label="Travaillé"
                    value={formatMinutes(dashboard.today.worked_minutes)}
                    tone="yellow"
                />
            </StatGrid>
            <div className="presence-summary">
                <AttendanceStatus status={dashboard.today.status} />
                {dashboard.today.late_minutes > 0 && (
                    <span className="stat-note">
                        Retard : {formatMinutes(dashboard.today.late_minutes)}
                    </span>
                )}
            </div>
        </Card>
    );
}

export function PresenceChart({ dashboard }: { dashboard: OrganizationDashboard | null }) {
    if (!dashboard) {
        return null;
    }

    const total = Math.max(
        dashboard.present + dashboard.absent + dashboard.on_leave + dashboard.on_permission,
        1,
    );

    const segments = [
        { label: "Présents", value: dashboard.present, className: "report-track present" },
        { label: "Absents", value: dashboard.absent, className: "report-track absent" },
        { label: "En congé", value: dashboard.on_leave, className: "report-track leave" },
        { label: "Permissions", value: dashboard.on_permission, className: "report-track permission" },
    ];

    return (
        <div className="report-bars">
            <div className="report-summary">
                <strong>{dashboard.employees}</strong>
                <span>agents · {formatDate(dashboard.date)}</span>
            </div>
            {segments.map((segment) => (
                <div key={segment.label} className="report-row">
                    <span className="report-link">{segment.label}</span>
                    <span className={segment.className}>
                        <span style={{ width: `${(segment.value / total) * 100}%` }} />
                    </span>
                    <span className="chart-value">{segment.value}</span>
                </div>
            ))}
        </div>
    );
}

export function LateEmployees({ events }: { events: AttendanceEvent[] }) {
    const late = events.filter((event) => event.event_type === "exit");

    return (
        <Card title="Sorties récentes" subtitle={`${late.length} sortie(s) enregistrée(s)`}>
            {late.length === 0 ? (
                <p className="empty-history">Aucune sortie pour le moment.</p>
            ) : (
                <div className="day-timeline">
                    {late.slice(0, 8).map((event) => (
                        <div key={event.id} className="timeline-item">
                            <span className="timeline-mark exit" aria-hidden>
                                S
                            </span>
                            <span>
                                <strong>
                                    {event.employee.first_name} {event.employee.last_name}
                                </strong>
                                <small>{event.badge_number ?? event.employee.employee_number}</small>
                            </span>
                            <time>{formatTime(event.occurred_at)}</time>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

export function AbsenceCard({ dashboard }: { dashboard: OrganizationDashboard | null }) {
    if (!dashboard) {
        return null;
    }

    return (
        <Card title="Absences du jour">
            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Absents"
                    value={dashboard.absent}
                    tone="red"
                />
                <StatCard
                    icon={CalendarDays}
                    label="En congé"
                    value={dashboard.on_leave}
                    tone="blue"
                />
                <StatCard
                    icon={CalendarDays}
                    label="Permissions"
                    value={dashboard.on_permission}
                    tone="yellow"
                />
            </StatGrid>
        </Card>
    );
}

export function LeaveCard({ dashboard }: { dashboard: PersonalDashboard | null }) {
    if (!dashboard) {
        return null;
    }

    return (
        <Card title="Mes demandes">
            <div className="stats-grid">
                <StatCard icon={FileCheck2} label="Congés" value={dashboard.counts.leaves} />
                <StatCard
                    icon={FileCheck2}
                    label="Permissions"
                    value={dashboard.counts.permissions}
                    tone="blue"
                />
                <StatCard
                    icon={FileCheck2}
                    label="Absences"
                    value={dashboard.counts.absences}
                    tone="yellow"
                />
            </div>
        </Card>
    );
}

export function ActivityTimelineCard({ events }: { events: AttendanceEvent[] }) {
    return (
        <Card title="Activité récente">
            {events.length === 0 ? (
                <p className="empty-history">Aucun événement aujourd&apos;hui.</p>
            ) : (
                <div className="day-timeline">
                    {events.slice(0, 10).map((event) => (
                        <div key={event.id} className="timeline-item">
                            <span className={`timeline-mark ${event.event_type}`} aria-hidden>
                                {event.event_type === "entry" ? "E" : "S"}
                            </span>
                            <span>
                                <strong>
                                    {event.employee.first_name} {event.employee.last_name}
                                </strong>
                                <small>{event.device_code ?? "Sans terminal"}</small>
                            </span>
                            <time>{formatTime(event.occurred_at)}</time>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}