import { get, post, remove } from "./client";
import type { NotificationFilters, NotificationList } from "@/types/notification";

export function listNotifications(
    filters: NotificationFilters = {},
    signal?: AbortSignal,
): Promise<NotificationList> {
    return get<NotificationList>("/notifications", { ...filters }, signal);
}

export function markNotificationAsRead(id: string): Promise<void> {
    return post<void>(`/notifications/${id}/read`);
}

export function markAllNotificationsAsRead(): Promise<void> {
    return post<void>("/notifications/read-all");
}

export function deleteNotification(id: string): Promise<void> {
    return remove<void>(`/notifications/${id}`);
}