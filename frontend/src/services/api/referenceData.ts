import { get } from "./client";
import type { ReferenceData } from "@/types/absence";
import type { LeaveBalances } from "@/types/leave";

export function getReferenceData(signal?: AbortSignal): Promise<ReferenceData> {
    return get<ReferenceData>("/reference-data", undefined, signal);
}

export function getMyLeaveBalances(signal?: AbortSignal): Promise<LeaveBalances> {
    return get<LeaveBalances>("/me/leave-balances", undefined, signal);
}
