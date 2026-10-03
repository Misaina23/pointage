import { get, patch, post, remove } from "./client";
import type {
    PlanningEvent,
    PlanningFilters,
    PlanningList,
    StorePlanningPayload,
    UpdatePlanningPayload,
} from "@/types/planning";

export function listPlanning(
    filters: PlanningFilters = {},
    signal?: AbortSignal,
): Promise<PlanningList> {
    return get<PlanningList>("/planning", { ...filters }, signal);
}

export function getPlanningEvent(id: number, signal?: AbortSignal): Promise<PlanningEvent> {
    return get<PlanningEvent>(`/planning/${id}`, undefined, signal);
}

export function createPlanningEvent(payload: StorePlanningPayload): Promise<PlanningEvent> {
    return post<PlanningEvent>("/planning", payload);
}

export function updatePlanningEvent(
    id: number,
    payload: UpdatePlanningPayload,
): Promise<PlanningEvent> {
    return patch<PlanningEvent>(`/planning/${id}`, payload);
}

export function deletePlanningEvent(id: number): Promise<void> {
    return remove<void>(`/planning/${id}`);
}