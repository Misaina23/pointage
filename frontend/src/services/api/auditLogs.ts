import { get } from "./client";
import type { AuditLog } from "@/types/report";
import type { Paginated } from "@/types/user";
import type { Query } from "./client";

export function listAuditLogs(
    filters: Query = {},
    signal?: AbortSignal,
): Promise<Paginated<AuditLog>> {
    return get<Paginated<AuditLog>>("/audit-logs", { ...filters }, signal);
}

export function getAuditLog(
    auditLogId: number,
    signal?: AbortSignal,
): Promise<AuditLog> {
    return get<AuditLog>(`/audit-logs/${auditLogId}`, undefined, signal);
}
