export type RoleSlug =
    | "administrateur"
    | "rh"
    | "direction"
    | "responsable"
    | "securite"
    | "personnel";

export type PermissionName =
    | "employees.view"
    | "employees.manage"
    | "organization.manage"
    | "attendance.view"
    | "attendance.history"
    | "attendance.scan"
    | "schedules.manage"
    | "leave.manage"
    | "leave.approve"
    | "leave.request"
    | "permission.request"
    | "absence.request"
    | "absences.manage"
    | "planning.view"
    | "planning.manage"
    | "reports.view"
    | "roles.manage"
    | "audit.view";

export type SessionUser = {
    id: number;
    name: string;
    email: string;
    roles: RoleSlug[];
    employee: SessionEmployee | null;
};

export type SessionEmployee = {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    direction_id: number | null;
    department_id: number | null;
    position_title: string | null;
};

export type LoginPayload = {
    email: string;
    password: string;
    device_name?: string;
};

export type LoginResponse = {
    token: string;
    token_type: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
};