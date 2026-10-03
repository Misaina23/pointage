import { get, post } from "./client";
import type { Department, StoreDepartmentPayload } from "@/types/organization";

export function listDepartments(directionId?: number, signal?: AbortSignal): Promise<Department[]> {
    return get<Department[]>("/departments", { direction_id: directionId }, signal).then((response) => {
        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray((response as { data?: unknown }).data)) {
            return (response as { data: Department[] }).data;
        }

        return [];
    });
}

export function createDepartment(payload: StoreDepartmentPayload): Promise<Department> {
    return post<Department>("/departments", payload);
}