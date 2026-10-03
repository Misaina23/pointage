import { get, post } from "./client";
import type {
    ApprovalsList,
    DecidePayload,
    DecideResult,
} from "@/types/approval";
import type { AttendanceStatusValue } from "@/types/attendance";
import type { Paginated } from "@/types/user";
import type {
    DailyReport,
    DailyReportFilters,
    DepartmentReport,
    DepartmentReportFilters,
    MonthlyReport,
    MonthlyReportFilters,
    OrganizationDashboard,
    PersonalAttendance,
    PersonalDashboard,
} from "@/types/report";

export function getOrganizationDashboard(
    departmentId?: number,
    signal?: AbortSignal,
): Promise<OrganizationDashboard> {
    return get<OrganizationDashboard>("/dashboard", { department_id: departmentId }, signal);
}

export function getPersonalDashboard(signal?: AbortSignal): Promise<PersonalDashboard> {
    return get<PersonalDashboard>("/dashboard/personal", undefined, signal);
}

export function getMyAttendance(date?: string, signal?: AbortSignal): Promise<PersonalAttendance> {
    return get<PersonalAttendance>("/dashboard/personal-attendance", { date }, signal);
}

export function listApprovals(signal?: AbortSignal): Promise<ApprovalsList> {
    return get<ApprovalsList>("/approvals", undefined, signal);
}

export function decideApproval(id: number, payload: DecidePayload): Promise<DecideResult> {
    return post<DecideResult>(`/approvals/${id}/decide`, payload);
}

export function getDailyReport(
    filters: DailyReportFilters = {},
    signal?: AbortSignal,
): Promise<DailyReport> {
    return get<DailyReport>("/reports/daily", { ...filters }, signal);
}

export function getMonthlyReport(
    filters: MonthlyReportFilters = {},
    signal?: AbortSignal,
): Promise<MonthlyReport> {
    return get<MonthlyReport>("/reports/monthly", { ...filters }, signal);
}

export function getDepartmentReport(
    filters: DepartmentReportFilters = {},
    signal?: AbortSignal,
): Promise<DepartmentReport> {
    return get<DepartmentReport>("/reports/by-department", { ...filters }, signal);
}

export function listAuditLogs(
    filters: { page?: number; per_page?: number } = {},
    signal?: AbortSignal,
): Promise<Paginated<import("@/types/report").AuditLog>> {
    return get<Paginated<import("@/types/report").AuditLog>>("/audit-logs", { ...filters }, signal);
}

export type { AttendanceStatusValue };