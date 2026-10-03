import type { Paginated } from "./user";

export type RequestState = "pending" | "approved" | "rejected" | "cancelled";

export type ApprovalDecision = "approved" | "rejected";

export type ApprovalRequest = {
    id: number;
    status: RequestState;
    current_step: number;
    submitted_at: string | null;
    completed_at: string | null;
    workflow: { id: number; name: string } | null;
    current_step_detail: {
        order: number;
        name: string;
        approver_role: string | null;
    } | null;
    employee: {
        id: number;
        employee_number: string;
        full_name: string;
        department: string | null;
    } | null;
    request: {
        type: "LeaveRequest" | "PermissionRequest" | "AbsenceRecord";
        id: number;
        summary: Record<string, string | number | null>;
    } | null;
    history: {
        decision: string;
        comment: string | null;
        step: string | null;
        actor: string | null;
        acted_at: string | null;
    }[];
};

export type ApprovalsList = {
    data: ApprovalRequest[];
};

export type DecidePayload = {
    decision: ApprovalDecision;
    comment?: string | null;
};

export type DecideResult = {
    data: ApprovalRequest;
    message: string;
};

export type { Paginated };