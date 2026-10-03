import type { Paginated } from "./user";
import type { RequestState } from "./approval";

export type PermissionType = {
    id: number;
    name: string;
    code: string;
    requires_attachment: boolean;
};

export type PermissionApproval = {
    id: number;
    status: RequestState;
    current_step: number;
    workflow: string | null;
};

export type PermissionRequest = {
    id: number;
    employee_id: number;
    permission_type_id: number;
    permission_date: string;
    starts_at: string;
    ends_at: string;
    requested_days: number;
    reason: string;
    attachment_path: string | null;
    status: RequestState;
    submitted_at: string | null;
    permission_type: { id: number; name: string; code: string } | null;
    employee: { id: number; employee_number: string; full_name: string } | null;
    approval: PermissionApproval | null;
};

export type PermissionFilters = {
    status?: RequestState;
    employee_id?: number;
    per_page?: number;
    page?: number;
};

export type StorePermissionPayload = {
    permission_type_id: number;
    permission_date: string;
    starts_at: string;
    ends_at: string;
    reason: string;
    attachment?: File | null;
};

export type PermissionList = Paginated<PermissionRequest>;