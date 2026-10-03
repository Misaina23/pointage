import { get, post, remove, upload } from "./client";
import type {
    LeaveBalances,
    LeaveFilters,
    LeaveList,
    LeaveRequest,
    LeaveType,
    StoreLeavePayload,
} from "@/types/leave";

export function listLeaves(filters: LeaveFilters = {}, signal?: AbortSignal): Promise<LeaveList> {
    return get<LeaveList>("/leaves", { ...filters }, signal);
}

export function getLeave(id: number, signal?: AbortSignal): Promise<LeaveRequest> {
    return get<LeaveRequest>(`/leaves/${id}`, undefined, signal);
}

export function createLeave(payload: StoreLeavePayload): Promise<LeaveRequest> {
    if (payload.attachment) {
        const formData = new FormData();
        formData.append("leave_type_id", String(payload.leave_type_id));
        formData.append("starts_on", payload.starts_on);
        formData.append("ends_on", payload.ends_on);
        formData.append("reason", payload.reason);
        formData.append("attachment", payload.attachment);

        return upload<LeaveRequest>("/leaves", formData);
    }

    return post<LeaveRequest>("/leaves", {
        leave_type_id: payload.leave_type_id,
        starts_on: payload.starts_on,
        ends_on: payload.ends_on,
        reason: payload.reason,
    });
}

export function deleteLeave(id: number): Promise<void> {
    return remove<void>(`/leaves/${id}`);
}

export function listLeaveBalances(year?: number, signal?: AbortSignal): Promise<LeaveBalances> {
    return get<LeaveBalances>(
        "/me/leave-balances",
        { year },
        signal,
    );
}

export function listReferenceLeaveTypes(signal?: AbortSignal): Promise<LeaveType[]> {
    return get<import("@/types/absence").ReferenceData>("/reference-data", undefined, signal).then(
        (reference) => reference.leave_types,
    );
}