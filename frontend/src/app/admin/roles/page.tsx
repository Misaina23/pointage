"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { ROLES, ROLE_ORDER, roleLabel } from "@/lib/roles";
import { getRoleManagement, updateRolePermissions } from "@/services/api/roles";
import type { PermissionName, RoleSlug } from "@/types/auth";
import type { ManagedRole } from "@/types/role";

export default function AdminRolesPage() {
    const roleManagement = useAsyncData((signal) => getRoleManagement(signal), []);
    const { notify } = useNotifications();
    const [permissionOverrides, setPermissionOverrides] = useState<
        Partial<Record<RoleSlug, PermissionName[]>>
    >({});
    const [savingRole, setSavingRole] = useState<RoleSlug | null>(null);
    const roles = roleManagement.data?.data.roles ?? [];
    const availablePermissions = roleManagement.data?.data.permissions ?? [];
    const savePermissions = async (
        role: ManagedRole,
        permissions: PermissionName[],
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setSavingRole(role.slug);

        try {
            const assignedPermissions = Array.from(
                new Set<PermissionName>([
                    ...permissions,
                    ...(role.slug === "administrateur" ? ["roles.manage" as const] : []),
                ]),
            );
            const updatedRole = await updateRolePermissions(role.slug, assignedPermissions);
            if (roleManagement.data) {
                roleManagement.setData({
                    data: {
                        ...roleManagement.data.data,
                        roles: roleManagement.data.data.roles.map((role) =>
                            role.slug === updatedRole.data.slug
                                ? { ...role, permissions: updatedRole.data.permissions }
                                : role,
                        ),
                    },
                });
            }
            setPermissionOverrides((current) => {
                const next = { ...current };
                delete next[role.slug];

                return next;
            });
            notify(`Permissions du rôle ${role.name} enregistrées.`, "success");
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Enregistrement impossible.", "error");
        } finally {
            setSavingRole(null);
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h1>Rôles</h1>
                    <p className="page-subtitle">
                        Gérez les permissions de chaque rôle ; les changements s&apos;appliquent à tous ses utilisateurs.
                    </p>
                </div>
            </header>

            {roleManagement.error ? (
                <Card title="Chargement des rôles">
                    <p className="form-error" role="alert">
                        Impossible de charger les rôles : {roleManagement.error}
                    </p>
                </Card>
            ) : roleManagement.loading ? (
                <Card title="Chargement des rôles">
                    <p className="empty-history">Chargement…</p>
                </Card>
            ) : (
                <div className="content-grid">
                    {ROLE_ORDER.map((slug) => {
                        const role = roles.find((entry) => entry.slug === slug);
                        const meta = ROLES[slug];

                        if (!role) {
                            return null;
                        }

                        const selectedPermissions = permissionOverrides[role.slug] ?? role.permissions;
                        const isAdministrator = role.slug === "administrateur";

                        return (
                            <Card key={slug} title={role.name} subtitle={role.description ?? meta.description}>
                                <div className="role-select-wrap" style={{ marginBottom: 12 }}>
                                    <span className="status-pill status-neutral">{slug}</span>
                                </div>
                                <p className="request-description">
                                    Espace principal : <strong>{meta.homePath}</strong>
                                </p>
                                <form
                                    className="role-permission-editor"
                                    onSubmit={(event) => savePermissions(role, selectedPermissions, event)}
                                >
                                        <h3>Permissions attribuées</h3>
                                        {PERMISSION_GROUPS.map((group) => (
                                            <fieldset key={group.label}>
                                                <legend>{group.label}</legend>
                                                {group.items.map((permissionName) => {
                                                    const permission = availablePermissions.find(
                                                        (entry) => entry.name === permissionName,
                                                    );

                                                    if (!permission) {
                                                        return null;
                                                    }

                                                    const required =
                                                        isAdministrator && permission.name === "roles.manage";

                                                    return (
                                                        <label
                                                            key={permission.name}
                                                            className="role-permission-toggle"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissions.includes(permission.name)}
                                                                disabled={required}
                                                                onChange={(event) => {
                                                                    setPermissionOverrides((current) => {
                                                                        const currentPermissions =
                                                                            current[role.slug] ?? role.permissions;

                                                                        return {
                                                                            ...current,
                                                                            [role.slug]: event.target.checked
                                                                                ? [...currentPermissions, permission.name]
                                                                                : currentPermissions.filter(
                                                                                      (value) =>
                                                                                          value !== permission.name,
                                                                                  ),
                                                                        };
                                                                    });
                                                                }}
                                                            />
                                                            <span>{permission.label}</span>
                                                            {required && <small>Obligatoire</small>}
                                                        </label>
                                                    );
                                                })}
                                            </fieldset>
                                        ))}
                                        <p className="footnote">
                                            {isAdministrator
                                                ? "La permission de gestion des rôles reste obligatoire pour éviter de verrouiller l'administration."
                                                : "Les modifications s'appliquent à tous les utilisateurs ayant ce rôle."}
                                        </p>
                                        <Button type="submit" loading={savingRole === role.slug}>
                                            Enregistrer les permissions de {role.name}
                                        </Button>
                                    </form>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Card title="Règles d'attribution">
                <ul className="role-permission-list">
                    <li>
                        <span className="role-dot" aria-hidden />
                        Un utilisateur peut cumuler plusieurs rôles ; l&apos;accueil suit le rôle prioritaire{" "}
                        {roleLabel("administrateur")}.
                    </li>
                    <li>
                        <span className="role-dot" aria-hidden />
                        Les droits effectifs sont contrôlés côté API à chaque requête.
                    </li>
                </ul>
            </Card>
        </>
    );
}
