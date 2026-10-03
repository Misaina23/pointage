import type { Paginated } from "./user";

export type PlanningEventType = "meeting" | "training" | "leave" | "mission" | "other";

export type PlanningParticipant = {
    id: number;
    employee_number: string;
    full_name: string;
    attendance_status: string;
};

export type PlanningEvent = {
    id: number;
    title: string;
    event_type: PlanningEventType;
    description: string | null;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
    direction_id: number | null;
    department_id: number | null;
    creator: string | null;
    participants: PlanningParticipant[];
};

export type PlanningList = {
    data: PlanningEvent[];
};

export type PlanningFilters = {
    from?: string;
    to?: string;
    event_type?: PlanningEventType;
    department_id?: number;
};

export type StorePlanningPayload = {
    title: string;
    event_type: PlanningEventType;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
    location?: string | null;
    direction_id?: number | null;
    department_id?: number | null;
    participant_ids: number[];
};

export type UpdatePlanningPayload = Partial<StorePlanningPayload>;

export type { Paginated };

export type Meeting = PlanningEvent & {
    event_type: "meeting";
};

export type MeetingFormPayload = {
    title: string;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
    location?: string | null;
    participant_ids: number[];
};