import type { RoleSlug, SessionEmployee } from "./auth";

export type { SessionUser } from "./auth";

export type UserSummary = {
    id: number;
    name: string;
    email: string;
};

export type EmployeeStatusValue = "active" | "inactive" | "suspended" | "retired";

export type EmploymentType =
    | "titulaire"
    | "contractuel"
    | "stagiaire"
    | "journalier"
    | "consultant";

export type ManagerRef = {
    id: number;
    full_name: string;
};

export type BadgeRef = {
    id: number;
    badge_number: string;
    status: string;
};

export type Employee = {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    hire_date: string | null;
    employment_type: string | null;
    status: EmployeeStatusValue;
    status_label: string;
    direction: OrganizationRef | null;
    department: OrganizationRef | null;
    position_title: string | null;
    manager: ManagerRef | null;
    badge: BadgeRef | null;
};

export type OrganizationRef = {
    id: number;
    name: string;
    code?: string;
};

export type StoreEmployeePayload = {
    employee_number: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    hire_date?: string | null;
    employment_type?: string | null;
    status?: EmployeeStatusValue;
    direction_id?: number | null;
    department_id?: number | null;
    position_title?: string | null;
    manager_id?: number | null;
    is_top_level?: boolean;
};

export type UpdateEmployeePayload = Partial<StoreEmployeePayload>;

export type Paginated<T> = {
    data: T[];
    links?: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta?: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
};

export type EmployeeFilters = {
    search?: string;
    direction_id?: number;
    department_id?: number;
    status?: EmployeeStatusValue;
    per_page?: number;
    page?: number;
};

export type EmployeeContext = {
    employee?: SessionEmployee;
    role?: RoleSlug;
};