"use client";

import { Card } from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getRoleManagement } from "@/services/api/roles";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { ROLES, ROLE_ORDER } from "@/lib/roles";

export default function AdminPermissionsPage() {
    const roleManagement = useAsyncData((signal) => getRoleManagement(signal), []);
    const roles = roleManagement.data?.data.roles ?? [];
    const permissions = roleManagement.data?.data.permissions ?? [];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h1>Matrice des permissions</h1>
                    <p className="page-subtitle">
                        {permissions.length} permissions définies par l&apos;API.
                    </p>
                </div>
            </header>

            {roleManagement.error ? (
                <Card title="Matrice indisponible">
                    <p className="form-error" role="alert">
                        Impossible de charger les permissions : {roleManagement.error}
                    </p>
                </Card>
            ) : roleManagement.loading ? (
                <Card title="Matrice des permissions">
                    <p className="empty-history">Chargement…</p>
                </Card>
            ) : (
                PERMISSION_GROUPS.map((group) => (
                    <Card key={group.label} title={group.label}>
                        <div>
                            {group.items.map((permissionName) => {
                                const permission = permissions.find((entry) => entry.name === permissionName);

                                if (!permission) {
                                    return null;
                                }

                                return (
                                    <div key={permission.name} className="quick-row">
                                        <span className="request-main">
                                            <span className="request-title-line">{permission.label}</span>
                                            <span className="request-meta">{permission.name}</span>
                                        </span>
                                        <span className="request-decisions">
                                            {ROLE_ORDER.filter((roleSlug) =>
                                                roles.find((role) => role.slug === roleSlug)
                                                    ?.permissions.includes(permission.name),
                                            ).map((roleSlug) => (
                                                <span key={roleSlug} className="status-pill status-neutral">
                                                    {roles.find((role) => role.slug === roleSlug)?.name ??
                                                        ROLES[roleSlug].shortLabel}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))
            )}
        </>
    );
}