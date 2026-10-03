"use client";

import { useState } from "react";
import { BadgeCheck, Building2, LogIn, LogOut, Users } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAttendance } from "@/hooks/useAttendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listEmployees } from "@/services/api/employees";
import { listDirections } from "@/services/api/directions";
import { listDevices } from "@/services/api/devices";
import { listBadges } from "@/services/api/badges";
import { formatDateTime } from "@/lib/formatters";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permissions";
import type { Direction } from "@/types/organization";
import type { Employee, Paginated } from "@/types/user";
import type { DeviceList } from "@/types/device";
import type { BadgeList } from "@/types/badge";

export default function AdminOverviewPage() {
    const attendance = useAttendance();
    const employees = useAsyncData<Paginated<Employee>>(
        (signal) => listEmployees({ per_page: 1 }, signal),
        [],
    );
    const directions = useAsyncData<Direction[]>((signal) => listDirections(undefined, signal), []);
    const devices = useAsyncData<DeviceList>((signal) => listDevices({}, signal), []);
    const badges = useAsyncData<BadgeList>((signal) => listBadges({}, signal), []);

    const [showPermissions, setShowPermissions] = useState(false);

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h1>État de la plateforme</h1>
                    <p className="page-subtitle">
                        Effectif, structure et terminaux de pointage.
                    </p>
                </div>
                <div className="heading-tools">
                    <Button
                        variant="secondary"
                        onClick={() => setShowPermissions((value) => !value)}
                    >
                        {showPermissions ? "Masquer" : "Voir"} les permissions
                    </Button>
                </div>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Employés"
                    value={employees.data?.meta?.total ?? 0}
                    note="Tous statuts confondus"
                />
                <StatCard
                    icon={Building2}
                    label="Directions"
                    value={directions.data?.length ?? 0}
                    tone="blue"
                />
                <StatCard
                    icon={BadgeCheck}
                    label="Badges"
                    value={badges.data?.meta.total ?? 0}
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <div style={{ display: "grid", gap: 18 }}>
                    <Card title="Appareils">
                        {!devices.data || devices.data.data.length === 0 ? (
                            <p className="empty-history">Aucun appareil enregistré.</p>
                        ) : (
                            <div className="history-list">
                                {devices.data.data.slice(0, 6).map((device) => (
                                    <div key={device.id} className="history-row">
                                        <span className="history-avatar" aria-hidden>
                                            {device.name.charAt(0)}
                                        </span>
                                        <span>
                                            <span className="history-name">{device.name}</span>
                                            <span className="history-code">
                                                {device.location ?? "Sans emplacement"}
                                            </span>
                                        </span>
                                        <span
                                            className={`history-status ${device.status === "active" ? "valid" : "denied"}`}
                                        >
                                            {device.status === "active" ? "Actif" : "Inactif"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card
                        title="Derniers scans de sécurité"
                        subtitle={`${attendance.events.length} événement(s) aujourd'hui`}
                    >
                        {attendance.eventsLoading ? (
                            <p className="empty-history">Chargement des scans…</p>
                        ) : attendance.events.length === 0 ? (
                            <p className="empty-history">Aucun scan enregistré aujourd&apos;hui.</p>
                        ) : (
                            <div className="history-list">
                                {attendance.events.slice(0, 8).map((event) => {
                                    const isEntry = event.event_type === "entry";
                                    const Icon = isEntry ? LogIn : LogOut;

                                    return (
                                        <div key={event.id} className="history-row">
                                            <span className="history-avatar" aria-hidden>
                                                <Icon size={16} />
                                            </span>
                                            <span>
                                                <span className="history-name">
                                                    {event.employee.first_name} {event.employee.last_name}
                                                </span>
                                                <span className="history-code">
                                                    {event.occurred_at ? formatDateTime(event.occurred_at) : "Heure inconnue"}
                                                    {" · "}{event.device_code ?? "Sans terminal"}
                                                </span>
                                            </span>
                                            <span className="history-status valid">
                                                {isEntry ? "Entrée" : "Sortie"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {showPermissions && (
                <Card title="Matrice des permissions" subtitle="Rôles et droits configurés dans l'API">
                    <div className="security-dashboard-grid">
                        {PERMISSION_GROUPS.map((group) => (
                            <div key={group.label}>
                                <p className="side-label">{group.label}</p>
                                <ul className="role-permission-list">
                                    {group.items.map((permission) => (
                                        <li key={permission}>
                                            <span className="role-dot" aria-hidden />
                                            {PERMISSION_LABELS[permission]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </>
    );
}