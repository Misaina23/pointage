import { get, patch } from "./client";
import type { PermissionName } from "@/types/auth";
import type { RoleManagementData } from "@/types/role";

export function getRoleManagement(signal?: AbortSignal): Promise<{ data: RoleManagementData }> {
    return get<{ data: RoleManagementData }>("/roles", undefined, signal);
}

export function updateRolePermissions(
    roleSlug: string,
    permissions: PermissionName[],
): Promise<{ data: { slug: string; permissions: PermissionName[] } }> {
    return patch<{ data: { slug: string; permissions: PermissionName[] } }>(
        `/roles/${encodeURIComponent(roleSlug)}/permissions`,
        { permissions },
    );
}
