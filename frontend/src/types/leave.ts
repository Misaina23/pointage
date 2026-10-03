import type { Paginated } from "./user";
import type { RequestState } from "./approval";

export type LeaveType = {
    id: number;
    name: string;
    code: string;
    requires_attachment: boolean;
    is_paid: boolean;
};

export type LeaveBalance = {
    leave_type_id: number;
    leave_type: string | null;
    allocated_days: number;
    used_days: number;
    remaining_days: number;
};

export type PermissionAllowance = {
    allocated_days: number;
    used_days: number;
    remaining_days: number;
    year: number;
};

export type LeaveBalances = {
    data: LeaveBalance[];
    permission_allowance?: PermissionAllowance;
};

export type LeaveApproval = {
    id: number;
    status: RequestState;
    current_step: number;
    workflow: string | null;
    history?: {
        decision: string;
        comment: string | null;
        actor: string | null;
        acted_at: string | null;
    }[];
};

export type LeaveRequest = {
    id: number;
    employee_id: number;
    leave_type_id: number;
    starts_on: string;
    ends_on: string;
    requested_days: number;
    reason: string;
    attachment_path: string | null;
    status: RequestState;
    submitted_at: string | null;
    leave_type: { id: number; name: string; code: string } | null;
    employee: { id: number; employee_number: string; full_name: string } | null;
    approval: LeaveApproval | null;
};

export type LeaveFilters = {
    status?: RequestState;
    employee_id?: number;
    per_page?: number;
    page?: number;
};

export type StoreLeavePayload = {
    leave_type_id: number;
    starts_on: string;
    ends_on: string;
    reason: string;
    attachment?: File | null;
};

export type LeaveList = Paginated<LeaveRequest>;