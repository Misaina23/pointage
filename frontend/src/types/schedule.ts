export type ScheduleType = "fixed" | "flexible" | "shift" | "rest";

export type ScheduleDay = {
    day_of_week: number;
    starts_at: string | null;
    ends_at: string | null;
    break_starts_at: string | null;
    break_ends_at: string | null;
};

export type WorkSchedule = {
    id: number;
    name: string;
    schedule_type: ScheduleType;
    late_tolerance_minutes: number;
    is_active: boolean;
    days: ScheduleDay[];
};

export type ScheduleList = {
    data: WorkSchedule[];
    holidays: Holiday[];
};

export type Holiday = {
    id: number;
    name: string;
    date: string;
    is_paid: boolean;
    description?: string | null;
};

export type HolidayList = {
    data: Holiday[];
};

export type StoreSchedulePayload = {
    name: string;
    schedule_type: ScheduleType;
    late_tolerance_minutes: number;
    is_active?: boolean;
    days: ScheduleDay[];
};

export type UpdateSchedulePayload = Partial<StoreSchedulePayload>;

export type AssignSchedulePayload = {
    employee_id: number;
    work_schedule_id: number;
    starts_on: string;
    ends_on?: string | null;
};

export type StoreHolidayPayload = {
    name: string;
    date: string;
    is_paid?: boolean;
    description?: string | null;
};

export type ResolvedShift = {
    starts_at: string | null;
    ends_at: string | null;
    break_starts_at: string | null;
    break_ends_at: string | null;
    late_tolerance_minutes: number;
    is_rest_day: boolean;
};

export const DAY_LABELS = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
] as const;