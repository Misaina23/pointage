import { get, patch, post } from "./client";
import type { Direction, StoreOrganizationPayload } from "@/types/organization";

export function listDirections(search?: string, signal?: AbortSignal): Promise<Direction[]> {
    return get<Direction[]>("/directions", { search }, signal).then((response) => {
        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray((response as { data?: unknown }).data)) {
            return (response as { data: Direction[] }).data;
        }

        return [];
    });
}

export function createDirection(payload: StoreOrganizationPayload): Promise<Direction> {
    return post<Direction>("/directions", payload);
}

export function updateDirection(id: number, payload: Partial<StoreOrganizationPayload>): Promise<Direction> {
    return patch<Direction>(`/directions/${id}`, payload);
}