export type AttendanceStatusValue =
    | "present"
    | "late"
    | "absent"
    | "on_leave"
    | "on_permission"
    | "remote"
    | "holiday"
    | "rest_day"
    | "incomplete";

export type EventType = "entry" | "exit";

export type Attendance = {
    id: number;
    employee_id: number;
    employee?: Pick<
        import("./user").Employee,
        "first_name" | "last_name" | "full_name" | "employee_number"
    > | null;
    attendance_date: string;
    first_entry: string | null;
    last_exit: string | null;
    break_starts_at?: string | null;
    break_ends_at?: string | null;
    worked_minutes: number;
    late_minutes: number;
    overtime_minutes: number;
    status: AttendanceStatusValue;
    notes: string | null;
};

export type AttendanceEventEmployee = {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    direction_id: number | null;
    department_id: number | null;
};

export type AttendanceEvent = {
    id: number;
    event_type: EventType;
    occurred_at: string | null;
    employee: AttendanceEventEmployee;
    badge_number: string | null;
    device_code: string | null;
};

export type ScanResult = {
    data: AttendanceEvent;
    duplicate: boolean;
};

export type AttendanceAnomaly = {
    id: number;
    employee: {
        id: number | null;
        employee_number: string | null;
        full_name: string | null;
    };
    attendance_date: string | null;
    type: string;
    description: string;
    status: string;
    resolved_by: string | null;
    resolved_at: string | null;
};

export type AttendanceSummary = {
    entries: number;
    exits: number;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
};

export type AttendanceToday = {
    date: string;
    summary: AttendanceSummary;
    attendances: PaginatedAttendance<Attendance>;
    events: PaginatedAttendance<AttendanceEvent>;
};

export type PaginatedAttendance<T> = {
    data: T[];
    meta?: { current_page: number; last_page: number; total: number };
};

export type AttendanceFilters = {
    date?: string;
    department_id?: number;
    employee_id?: number;
    status?: AttendanceStatusValue;
    per_page?: number;
    page?: number;
};

export type EventFilters = {
    from?: string;
    to?: string;
    employee_id?: number;
    device_code?: string;
    event_type?: EventType;
    per_page?: number;
    page?: number;
};

export type ScanPayload = {
    badge_public_id: string;
    event_type: EventType;
    client_event_id: string;
    occurred_at: string;
    device_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
};

export type EmployeeAttendanceDetail = {
    employee: import("./user").Employee;
    attendance: Attendance;
    events: PaginatedAttendance<AttendanceEvent>;
};

export type RecomputeResult = {
    date: string;
    processed: number;
    data: PaginatedAttendance<Attendance>;
};