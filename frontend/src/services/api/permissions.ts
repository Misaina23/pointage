import { get, post, remove, upload } from "./client";
import type {
    PermissionFilters,
    PermissionList,
    PermissionRequest,
    StorePermissionPayload,
} from "@/types/permission";

export function listPermissions(
    filters: PermissionFilters = {},
    signal?: AbortSignal,
): Promise<PermissionList> {
    return get<PermissionList>("/permissions", { ...filters }, signal);
}

export function getPermission(id: number, signal?: AbortSignal): Promise<PermissionRequest> {
    return get<PermissionRequest>(`/permissions/${id}`, undefined, signal);
}

export function createPermission(payload: StorePermissionPayload): Promise<PermissionRequest> {
    if (payload.attachment) {
        const formData = new FormData();
        formData.append("permission_type_id", String(payload.permission_type_id));
        formData.append("permission_date", payload.permission_date);
        formData.append("starts_at", payload.starts_at);
        formData.append("ends_at", payload.ends_at);
        formData.append("reason", payload.reason);
        formData.append("attachment", payload.attachment);

        return upload<PermissionRequest>("/permissions", formData);
    }

    return post<PermissionRequest>("/permissions", {
        permission_type_id: payload.permission_type_id,
        permission_date: payload.permission_date,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        reason: payload.reason,
    });
}

export function deletePermission(id: number): Promise<void> {
    return remove<void>(`/permissions/${id}`);
}