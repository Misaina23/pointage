"use client";

import { CalendarClock, Clock, ShieldCheck, Users } from "lucide-react";
import { AreaShell, item } from "@/components/layout";
import { Card } from "@/components/ui";
import {
    AbsenceCard,
    ActivityTimelineCard,
    AttendanceCard,
    LeaveCard,
    PresenceChart,
    StatCard,
    StatGrid,
} from "@/components/dashboard";
import { useReports } from "@/hooks";
import { useAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatHours, formatMinutes } from "@/lib/formatters";
import { getAttendanceToday } from "@/services/api/attendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { todayIso } from "@/lib/dates";
import type { AttendanceToday } from "@/types/attendance";

export default function DashboardPage() {
    const { roles } = useAuth();
    const reports = useReports();
    const attendance = useAttendance(todayIso());
    const today = useAsyncData<AttendanceToday>(
        (signal) => getAttendanceToday(todayIso(), signal),
        [],
    );

    const organization = reports.organization;
    const personal = reports.personal;
    const attendanceHref = roles.includes("securite")
        ? "/securite/presence"
        : roles.includes("administrateur")
          ? "/admin/pointages"
          : roles.includes("rh")
            ? "/rh/pointages"
            : "/personnel/pointage";
    const canViewReports = roles.some((role) =>
        ["administrateur", "rh", "direction"].includes(role),
    );
    const sections = [
        {
            label: "Pilotage",
            items: [
                item("/dashboard", "Tableau de bord", "dashboard", true),
                ...(canViewReports ? [item("/rapports", "Rapports", "reports")] : []),
            ],
        },
        {
            label: "Mon espace",
            items: [
                item("/personnel", "Mon dossier", "profile"),
                item("/planning", "Planning", "planning"),
                item("/notifications", "Notifications", "notifications"),
            ],
        },
    ];
    const mobileItems = [
        item("/dashboard", "Accueil", "dashboard", true),
        item("/personnel", "Dossier", "profile"),
        item("/planning", "Planning", "planning"),
        ...(canViewReports ? [item("/rapports", "Rapports", "reports")] : []),
        item("/notifications", "Alertes", "notifications"),
    ];

    return (
        <AreaShell
            allowedRoles={[
                "administrateur",
                "rh",
                "direction",
                "responsable",
                "securite",
                "personnel",
            ]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Accueil", href: "/dashboard" }]}
        >
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Vue d&apos;ensemble</p>
                    <h1>Tableau de bord</h1>
                    <p className="page-subtitle">
                        Situation du jour et indicateurs de pilotage de votre périmètre.
                    </p>
                </div>
                <span className="live-pill">
                    <span className="live-dot" aria-hidden />
                    {organization?.employees ?? 0} agents suivis
                </span>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Agents présents"
                    value={organization?.present ?? 0}
                    note={`${organization?.employees ?? 0} agents au total`}
                />
                <StatCard
                    icon={Clock}
                    label="Heures travaillées"
                    value={formatHours(organization?.hours_worked ?? 0)}
                    tone="blue"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Heures supplémentaires"
                    value={formatHours(organization?.overtime_hours ?? 0)}
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid">
                <div style={{ display: "grid", gap: 18 }}>
                    <AttendanceCard dashboard={personal} />
                    <Card title="Activité récente">
                        <ActivityTimelineCard events={attendance.events} />
                    </Card>
                </div>
                <div style={{ display: "grid", gap: 18 }}>
                    <Card title="Répartition des présences">
                        <PresenceChart dashboard={organization} />
                    </Card>
                    <AbsenceCard dashboard={organization} />
                    <LeaveCard dashboard={personal} />
                </div>
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <Card
                    title="Pointages du jour"
                    subtitle={
                        today.data
                            ? `${today.data.summary.entries} entrée(s) · ${today.data.summary.exits} sortie(s)`
                            : undefined
                    }
                    actions={
                        <a className="history-footer" href={attendanceHref}>
                            Détail
                        </a>
                    }
                >
                    {today.data ? (
                        <StatGrid>
                            <StatCard
                                icon={ShieldCheck}
                                label="Présents"
                                value={today.data.summary.present}
                            />
                            <StatCard
                                icon={CalendarClock}
                                label="Retards"
                                value={today.data.summary.late}
                                tone="yellow"
                            />
                            <StatCard
                                icon={Users}
                                label="Absents"
                                value={today.data.summary.absent}
                                tone="red"
                            />
                        </StatGrid>
                    ) : (
                        <p className="empty-history">Chargement…</p>
                    )}
                </Card>
                <Card title="Mes heures du mois">
                    {personal ? (
                        <>
                            <p className="stat-number">{formatHours(personal.month.worked_hours)}</p>
                            <p className="stat-note">
                                {formatMinutes(personal.month.worked_minutes)} ·{" "}
                                {personal.month.late_count} journée(s) de retard
                            </p>
                        </>
                    ) : (
                        <p className="empty-history">Données indisponibles.</p>
                    )}
                </Card>
            </div>
        </AreaShell>
    );
}