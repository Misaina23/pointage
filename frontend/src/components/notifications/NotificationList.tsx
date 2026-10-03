"use client";

import { Check, Trash2 } from "lucide-react";
import { formatDateTime, relativeTime } from "@/lib/formatters";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { NotificationItem } from "@/types/notification";

export function NotificationListItem({
    notification,
    onDelete,
}: {
    notification: NotificationItem;
    onDelete?: (id: string) => Promise<void>;
}) {
    const { markAsRead } = useNotifications();

    return (
        <article className={`request-card ${notification.read_at ? "notification-read" : ""}`}>
            <span className="request-card-head">
                <span className="request-main">
                    <span className="request-title-line">{notification.title}</span>
                    <span className="request-meta">
                        {notification.type_label ?? notification.type} · {relativeTime(notification.created_at)}
                    </span>
                </span>
                {!notification.read_at && <span className="unread-dot" aria-label="Non lue" />}
            </span>
            {Object.keys(notification.data).length > 0 && (
                <span className="request-description">
                    {Object.entries(notification.data)
                        .map(([key, value]) => `${key}: ${String(value ?? "")}`)
                        .join(" · ")}
                </span>
            )}
            <span className="request-meta">Reçue le {formatDateTime(notification.created_at)}</span>
            <div className="camera-actions">
                {!notification.read_at && (
                    <button type="button" className="compact-button" onClick={() => void markAsRead(notification.id)}>
                        <Check size={13} aria-hidden /> Marquer comme lue
                    </button>
                )}
                {onDelete && (
                    <button
                        type="button"
                        className="compact-button"
                        onClick={() => void onDelete(notification.id)}
                    >
                        <Trash2 size={13} aria-hidden /> Supprimer
                    </button>
                )}
            </div>
        </article>
    );
}

export function NotificationList({
    notifications,
    onDelete,
}: {
    notifications: NotificationItem[];
    onDelete?: (id: string) => Promise<void>;
}) {
    if (notifications.length === 0) {
        return <p className="empty-history">Aucune notification.</p>;
    }

    return (
        <div className="request-list">
            {notifications.map((notification) => (
                <NotificationListItem
                    key={notification.id}
                    notification={notification}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}