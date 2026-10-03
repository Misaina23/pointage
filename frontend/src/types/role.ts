import type { PermissionName, RoleSlug } from "./auth";

export type ManagedRole = {
    id: number;
    slug: RoleSlug;
    name: string;
    description: string | null;
    permissions: PermissionName[];
};

export type ManagedPermission = {
    name: PermissionName;
    label: string;
};

export type RoleManagementData = {
    roles: ManagedRole[];
    permissions: ManagedPermission[];
};
