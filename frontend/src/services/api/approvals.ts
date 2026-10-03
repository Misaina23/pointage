import { get, post } from "./client";
import type { ApprovalsList, DecidePayload, DecideResult } from "@/types/approval";

export function listApprovals(
    filters: { status?: string; per_page?: number; page?: number } = {},
    signal?: AbortSignal,
): Promise<ApprovalsList> {
    return get<ApprovalsList>("/approvals", { ...filters }, signal);
}

export function decideApproval(
    approvalRequestId: number,
    payload: DecidePayload,
): Promise<DecideResult> {
    return post<DecideResult>(`/approvals/${approvalRequestId}/decide`, payload);
}
