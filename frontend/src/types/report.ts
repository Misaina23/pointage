export type DailyReport = {
    date: string;
    department_id: number | null;
    employees: number;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    on_permission: number;
    remote: number;
    holidays: number;
    rest_days: number;
    worked_minutes: number;
    late_minutes: number;
    overtime_minutes: number;
    leaves: number;
    permissions: number;
    absences: number;
};

export type MonthlyReport = {
    month: string;
    department_id: number | null;
    employees: number;
    worked_minutes: number;
    overtime_minutes: number;
    late_count: number;
    late_minutes: number;
    average_late_minutes: number;
    absence_count: number;
    leave_count: number;
    permission_count: number;
    absence_records: number;
    top_late: {
        employee_id: number;
        employee_number: string | null;
        name: string;
        late_count: number;
        late_minutes: number;
    }[];
};

export type DepartmentReport = {
    from: string;
    to: string;
    late: {
        department: string;
        occurrences: number;
        late_minutes: number;
    }[];
    absences: {
        department: string;
        records: number;
    }[];
};

export type DailyReportFilters = {
    date?: string;
    department_id?: number;
};

export type MonthlyReportFilters = {
    month?: string;
    department_id?: number;
};

export type DepartmentReportFilters = {
    from?: string;
    to?: string;
};

export type OrganizationDashboard = {
    date: string;
    employees: number;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    on_permission: number;
    hours_worked: number;
    overtime_hours: number;
    pending_requests: number;
};

export type PersonalToday = {
    first_entry: string | null;
    last_exit: string | null;
    status: import("./attendance").AttendanceStatusValue;
    status_label: string | null;
    worked_minutes: number;
    late_minutes: number;
};

export type PersonalDashboard = {
    today: PersonalToday;
    month: {
        worked_minutes: number;
        worked_hours: number;
        late_count: number;
    };
    counts: {
        leaves: number;
        permissions: number;
        absences: number;
    };
    upcoming_planning: {
        id: number;
        title: string;
        event_type: string;
        starts_at: string | null;
        location: string | null;
    }[];
    shift: import("./schedule").ResolvedShift | null;
};

export type PersonalAttendance = {
    data: import("./attendance").Attendance;
    events: import("./attendance").PaginatedAttendance<import("./attendance").AttendanceEvent>;
};

export type AuditLog = {
    id: number;
    actor: string | null;
    action: string;
    subject_type: string;
    subject_id: number;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
};

export type ExportFormat = "csv" | "json" | "xlsx";

export type ExportPayload = {
    report: "daily" | "monthly" | "late" | "absence";
    format: ExportFormat;
    filters: Record<string, string | number | undefined>;
};