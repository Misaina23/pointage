import { get, post } from "./client";
import type { BadgeFilters, BadgeList, StoreBadgePayload } from "@/types/badge";

export function listBadges(filters: BadgeFilters = {}, signal?: AbortSignal): Promise<BadgeList> {
    return get<BadgeList>("/badges", { ...filters }, signal);
}

export function issueBadge(payload: StoreBadgePayload): Promise<{ data: BadgeList["data"][number] }> {
    return post<{ data: BadgeList["data"][number] }>("/badges", payload);
}

export function revokeBadge(id: number): Promise<{ data: BadgeList["data"][number] }> {
    return post<{ data: BadgeList["data"][number] }>(`/badges/${id}/revoke`);
}