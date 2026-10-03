import { get, patch, post } from "./client";
import type {
    AssignSchedulePayload,
    Holiday,
    HolidayList,
    ScheduleList,
    StoreHolidayPayload,
    StoreSchedulePayload,
    UpdateSchedulePayload,
    WorkSchedule,
} from "@/types/schedule";

export function listSchedules(signal?: AbortSignal): Promise<ScheduleList> {
    return get<ScheduleList>("/schedules", undefined, signal);
}

export function createSchedule(payload: StoreSchedulePayload): Promise<WorkSchedule> {
    return post<WorkSchedule>("/schedules", payload);
}

export function updateSchedule(id: number, payload: UpdateSchedulePayload): Promise<WorkSchedule> {
    return patch<WorkSchedule>(`/schedules/${id}`, payload);
}

export function assignSchedule(payload: AssignSchedulePayload): Promise<{ data: unknown }> {
    return post<{ data: unknown }>("/schedules/assign", payload);
}

export function listHolidays(year?: number, signal?: AbortSignal): Promise<HolidayList> {
    return get<HolidayList>("/holidays", { year }, signal);
}

export function createHoliday(payload: StoreHolidayPayload): Promise<{ data: Holiday }> {
    return post<{ data: Holiday }>("/holidays", payload);
}