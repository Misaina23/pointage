"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, FileText, UserRound } from "lucide-react";
import { Card, Tabs } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAuth } from "@/hooks";
import { listLeaveBalances } from "@/services/api/leaves";
import { listNotifications } from "@/services/api/notifications";
import { listPlanning } from "@/services/api/planning";
import { getPersonalDashboard } from "@/services/api/reports";
import { useAsyncData } from "@/hooks/useAsyncData";
import { formatDate, formatDays, formatHours } from "@/lib/formatters";
import { endOfMonth, startOfMonth } from "@/lib/dates";
import { AttendanceStatus } from "@/components/attendance";
import type { LeaveBalance } from "@/types/leave";
import type { NotificationList } from "@/types/notification";
import type { PersonalDashboard } from "@/types/report";
import type { PlanningList } from "@/types/planning";

export default function PersonnelOverviewPage() {
    const { roles } = useAuth();
    const router = useRouter();
    const hasSecurityRole = roles.includes("securite");

    useEffect(() => {
        if (hasSecurityRole) {
            router.replace("/securite");
        }
    }, [hasSecurityRole, router]);

    if (hasSecurityRole) {
        return null;
    }

    return <PersonnelOverviewContent />;
}

function PersonnelOverviewContent() {
    const { user } = useAuth();
    const personal = useAsyncData<PersonalDashboard>((signal) => getPersonalDashboard(signal), []);
    const balances = useAsyncData<{ data: LeaveBalance[] }>(
        (signal) => listLeaveBalances(new Date().getFullYear(), signal),
        [],
    );
    const notifications = useAsyncData<NotificationList>(
        (signal) => listNotifications({ per_page: 5 }, signal),
        [],
    );
    const planning = useAsyncData<PlanningList>(
        (signal) =>
            listPlanning({ from: startOfMonth(), to: endOfMonth() }, signal),
        [],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Espace personnel</p>
                    <h1>Bonjour, {user?.employee?.first_name ?? user?.name ?? ""}</h1>
                    <p className="page-subtitle">
                        {user?.employee?.employee_number ?? "Aucun dossier"} · situation du jour et prochaines échéances.
                    </p>
                </div>
            </header>

            <StatGrid>
                <StatCard
                    icon={CalendarClock}
                    label="Heures du mois"
                    value={formatHours(personal.data?.month.worked_hours ?? 0)}
                />
                <StatCard
                    icon={FileText}
                    label="Congés restants"
                    value={formatDays(
                        balances.data?.data.reduce((total, balance) => total + balance.remaining_days, 0) ?? 0,
                    )}
                    tone="blue"
                />
                <StatCard
                    icon={UserRound}
                    label="Demandes"
                    value={
                        (personal.data?.counts.leaves ?? 0) +
                        (personal.data?.counts.permissions ?? 0) +
                        (personal.data?.counts.absences ?? 0)
                    }
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid">
                <div style={{ display: "grid", gap: 18 }}>
                    <Card title="Ma journée">
                        {personal.data ? (
                            <>
                                <div className="presence-summary">
                                    <AttendanceStatus status={personal.data.today.status} />
                                    <span className="muted-cell">
                                        {formatDate(new Date())}
                                    </span>
                                </div>
                                <StatGrid>
                                    <StatCard
                                        label="Entrée"
                                        value={personal.data.today.first_entry ?? "—"}
                                    />
                                    <StatCard
                                        label="Sortie"
                                        value={personal.data.today.last_exit ?? "—"}
                                        tone="blue"
                                    />
                                    <StatCard
                                        label="Retard"
                                        value={personal.data.today.late_minutes}
                                        tone="red"
                                    />
                                </StatGrid>
                            </>
                        ) : (
                            <p className="empty-history">Chargement…</p>
                        )}
                    </Card>
                    <Card title="Planning du mois">
                        {!planning.data || planning.data.data.length === 0 ? (
                            <p className="empty-history">Aucun événement planifié ce mois-ci.</p>
                        ) : (
                            <div className="day-timeline">
                                {planning.data.data.slice(0, 8).map((event) => (
                                    <div key={event.id} className="timeline-item">
                                        <span className="timeline-mark" aria-hidden>
                                            {event.title.charAt(0)}
                                        </span>
                                        <span>
                                            <strong>{event.title}</strong>
                                            <small>{event.location ?? "Lieu non précisé"}</small>
                                        </span>
                                        <time>{formatDate(event.starts_at)}</time>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
                <div style={{ display: "grid", gap: 18 }}>
                    <Card title="Notifications récentes">
                        {!notifications.data || notifications.data.data.length === 0 ? (
                            <p className="empty-history">Aucune notification.</p>
                        ) : (
                            <Tabs
                                items={[{ id: "all", label: "Récentes", count: notifications.data.meta.unread }]}
                                active="all"
                                onChange={() => undefined}
                            />
                        )}
                        {notifications.data && notifications.data.data.length > 0 && (
                            <div className="request-list" style={{ marginTop: 12 }}>
                                {notifications.data.data.map((item) => (
                                    <div key={item.id} className="request-card">
                                        <span className="request-title-line">{item.title}</span>
                                        <span className="request-meta">{item.type_label ?? item.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                    <Card title="Raccourcis" subtitle="Actions fréquentes de mon espace">
                        <div className="quick-actions">
                            <a className="quick-row" href="/personnel/conges">
                                <span className="quick-action-icon" aria-hidden>
                                    <CalendarClock size={15} />
                                </span>
                                <span>Demander un congé</span>
                            </a>
                            <a className="quick-row" href="/personnel/permissions">
                                <span className="quick-action-icon" aria-hidden>
                                    <CalendarClock size={15} />
                                </span>
                                <span>Demander une permission</span>
                            </a>
                            <a className="quick-row" href="/personnel/documents">
                                <span className="quick-action-icon" aria-hidden>
                                    <FileText size={15} />
                                </span>
                                <span>Consulter mes documents</span>
                            </a>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}