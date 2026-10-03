import type { Paginated } from "./user";
import type { RequestState } from "./approval";

export type AbsenceType = {
    id: number;
    name: string;
    code: string;
    requires_attachment: boolean;
};

export type AbsenceRecord = {
    id: number;
    employee_id: number;
    absence_type_id: number;
    starts_on: string;
    ends_on: string | null;
    reason: string | null;
    attachment_path: string | null;
    status: RequestState;
    absence_type: { id: number; name: string; code: string } | null;
    employee: { id: number; employee_number: string; full_name: string } | null;
};

export type AbsenceFilters = {
    status?: RequestState;
    employee_id?: number;
    per_page?: number;
    page?: number;
};

export type StoreAbsencePayload = {
    absence_type_id: number;
    starts_on: string;
    ends_on?: string | null;
    reason?: string | null;
    attachment?: File | null;
};

export type AbsenceList = Paginated<AbsenceRecord>;

export type ReferenceData = {
    leave_types: import("./leave").LeaveType[];
    permission_types: import("./permission").PermissionType[];
    absence_types: AbsenceType[];
};