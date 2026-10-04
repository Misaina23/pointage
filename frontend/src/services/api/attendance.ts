import { get, patch, post } from "./client";
import type {
    Attendance,
    AttendanceAnomaly,
    AttendanceEvent,
    AttendanceFilters,
    AttendanceOverview,
    AttendanceToday,
    EventFilters,
    PaginatedAttendance,
    RecomputeResult,
    ScanPayload,
    ScanResult,
} from "@/types/attendance";
import type { Paginated } from "@/types/user";

export function listAttendance(
    filters: AttendanceFilters = {},
    signal?: AbortSignal,
): Promise<Paginated<Attendance>> {
    return get<Paginated<Attendance>>("/attendance", { ...filters }, signal);
}

export function getAttendanceToday(
    date?: string,
    signal?: AbortSignal,
): Promise<AttendanceToday> {
    return get<AttendanceToday>("/attendance/today", { date }, signal);
}

export function getAttendanceOverview(
    date?: string,
    signal?: AbortSignal,
): Promise<AttendanceOverview> {
    return get<AttendanceOverview>("/attendance/overview", { date }, signal);
}

export function listAttendanceEvents(
    filters: EventFilters = {},
    signal?: AbortSignal,
): Promise<Paginated<AttendanceEvent>> {
    return get<Paginated<AttendanceEvent>>("/attendance/events", { ...filters }, signal);
}

export function recomputeAttendance(payload: {
    date?: string;
    department_id?: number;
    employee_id?: number;
}): Promise<RecomputeResult> {
    return post<RecomputeResult>("/attendance/recompute", payload);
}

export function listAnomalies(
    filters: { status?: string; type?: string; per_page?: number; page?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedAttendance<AttendanceAnomaly>> {
    return get<PaginatedAttendance<AttendanceAnomaly>>("/attendance/anomalies", { ...filters }, signal);
}

export function listScans(
    date?: string,
    deviceCode?: string,
    signal?: AbortSignal,
): Promise<{ date: string; data: AttendanceEvent[] }> {
    return get<{ date: string; data: AttendanceEvent[] }>(
        "/attendance/scans",
        { date, device_code: deviceCode },
        signal,
    );
}

export function sendScan(payload: ScanPayload): Promise<ScanResult> {
    return post<ScanResult>("/attendance/scan", payload);
}

export function refreshEmployeeAttendance(
    employeeId: number,
    date?: string,
): Promise<{ data: Attendance; events: PaginatedAttendance<AttendanceEvent> }> {
    return post<{ data: Attendance; events: PaginatedAttendance<AttendanceEvent> }>(
        `/attendance/refresh/${employeeId}`,
        { date },
    );
}

export function getEmployeeAttendance(
    employeeId: number,
    date?: string,
    signal?: AbortSignal,
): Promise<import("@/types/attendance").EmployeeAttendanceDetail> {
    return get<import("@/types/attendance").EmployeeAttendanceDetail>(
        `/employees/${employeeId}/attendance`,
        { date },
        signal,
    );
}

export function patchAttendance(id: number, payload: Partial<Attendance>): Promise<Attendance> {
    return patch<Attendance>(`/attendance/${id}`, payload);
}