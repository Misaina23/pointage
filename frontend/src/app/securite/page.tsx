"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Clock, ScanLine, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { LeaveBalanceCard } from "@/components/leaves";
import { StatCard, StatGrid, PresenceChart } from "@/components/dashboard";
import { ActivityTimelineCard } from "@/components/dashboard";
import { EntryCard, ExitCard, Horloge } from "@/components/attendance";
import { ScanHistoryPanel } from "@/components/scanner";
import { useAttendance } from "@/hooks/useAttendance";
import { useAuth, useReports } from "@/hooks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { formatDate } from "@/lib/formatters";
import { listDevices } from "@/services/api/devices";
import { listLeaveBalances } from "@/services/api/leaves";
import type { LeaveBalance } from "@/types/leave";
import type { DeviceList } from "@/types/device";

export default function SecurityOverviewPage() {
    const { user } = useAuth();
    const attendance = useAttendance(undefined, true);
    const reports = useReports();
    const devices = useAsyncData<DeviceList>((signal) => listDevices({}, signal), []);
    const year = new Date().getFullYear();
    const balances = useAsyncData<{ data: LeaveBalance[] }>(
        (signal) => listLeaveBalances(year, signal),
        [year],
    );
    const [deviceCode, setDeviceCode] = useState("");

    const active = devices.data?.data.filter((device) => device.status === "active") ?? [];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Mon espace sécurité</p>
                    <h1>Bonjour, {user?.employee?.first_name ?? user?.name ?? ""}</h1>
                    <p className="page-subtitle">
                        Vos informations personnelles et les outils communs de l&apos;équipe, au même endroit.
                    </p>
                </div>
                <div className="heading-tools">
                    <span className="live-pill">
                        <Horloge />
                    </span>
                    <Link href="/securite/scanner" className="button-primary">
                        <ScanLine size={16} aria-hidden />
                        Scanner un badge
                    </Link>
                </div>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Présents"
                    value={attendance.today?.summary.present ?? 0}
                    note={`${attendance.today?.summary.late ?? 0} en retard`}
                />
                <StatCard
                    icon={Clock}
                    label="Entrées"
                    value={attendance.today?.summary.entries ?? 0}
                    tone="blue"
                />
                <StatCard
                    icon={CalendarDays}
                    label="Sorties"
                    value={attendance.today?.summary.exits ?? 0}
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Mon profil" subtitle="Vos informations personnelles">
                    <div className="history-list">
                        <div className="history-row">
                            <span>
                                <span className="history-name">
                                    {user?.employee
                                        ? `${user.employee.first_name} ${user.employee.last_name}`
                                        : user?.name ?? "Profil"}
                                </span>
                                <span className="history-code">
                                    {user?.employee?.employee_number ?? user?.email ?? ""}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="quick-actions" style={{ marginTop: 12 }}>
                        <Link href="/personnel/profil" className="quick-row">
                            Voir mon profil
                        </Link>
                        <Link href="/personnel/conges" className="quick-row">
                            Mes congés et mon solde
                        </Link>
                        <Link href="/personnel/permissions" className="quick-row">
                            Mes permissions
                        </Link>
                    </div>
                </Card>
                {balances.loading ? (
                    <Card title="Soldes de congés">
                        <p className="empty-history">Chargement de vos soldes…</p>
                    </Card>
                ) : balances.error ? (
                    <Card title="Soldes de congés">
                        <p className="form-error" role="alert">
                            Impossible de charger vos soldes : {balances.error}
                        </p>
                    </Card>
                ) : (
                    <LeaveBalanceCard balances={balances.data?.data ?? []} year={year} />
                )}
            </div>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <div style={{ display: "grid", gap: 18 }}>
                    <Card title="Activité récente">
                        <ActivityTimelineCard events={attendance.events} />
                    </Card>
                    <Card title="Historique de scan">
                        <ScanHistoryPanel />
                    </Card>
                </div>
                <div style={{ display: "grid", gap: 18 }}>
                    <Card title="Répartition">
                        <PresenceChart dashboard={reports.organization} />
                    </Card>
                    <Card title="Terminaux" subtitle={`${active.length} terminal(aux) actif(s)`}>
                        <div className="filter-row">
                            <select
                                className="form-control"
                                value={deviceCode}
                                onChange={(event) => setDeviceCode(event.target.value)}
                                aria-label="Filtrer par terminal"
                            >
                                <option value="">Tous les terminaux</option>
                                {active.map((device) => (
                                    <option key={device.id} value={device.device_code}>
                                        {device.name} ({device.device_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {active.length === 0 ? (
                            <p className="empty-history">Aucun terminal actif enregistré.</p>
                        ) : (
                            <div className="history-list">
                                {active.slice(0, 8).map((device) => (
                                    <div key={device.id} className="history-row">
                                        <span className="history-avatar" aria-hidden>
                                            T
                                        </span>
                                        <span>
                                            <span className="history-name">{device.name}</span>
                                            <span className="history-code">
                                                {device.location ?? "Sans emplacement"}
                                            </span>
                                        </span>
                                        <span className="history-status valid">
                                            {device.last_seen_at ? "Actif" : "Inactif"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <div className="lower-grid" style={{ marginTop: 18 }}>
                <Card
                    title="Arrivées du jour"
                    subtitle={`Pointages enregistrés le ${formatDate(attendance.date)}`}
                    actions={
                        <Link href="/securite/entrees" className="history-footer">
                            Tout voir
                        </Link>
                    }
                >
                    {attendance.eventsError ? (
                        <p className="form-error" role="alert">
                            Impossible de charger les arrivées : {attendance.eventsError}
                        </p>
                    ) : attendance.eventsLoading ? (
                        <p className="empty-history">Chargement des arrivées…</p>
                    ) : (
                        <EntryCard events={attendance.events} />
                    )}
                </Card>
                <Card title="Dernières sorties du jour">
                    <ExitCard events={attendance.events} />
                </Card>
            </div>
        </>
    );
}