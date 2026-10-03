"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { relativeTime } from "@/lib/formatters";

export function NotificationBell() {
    const { notifications, unreadCount, open, setOpen, markAllAsRead, markAsRead } = useNotifications();

    return (
        <div className="notification-dropdown-wrap">
            <button
                type="button"
                className="icon-button notification-trigger"
                aria-label={`Notifications (${unreadCount} non lues)`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <Bell size={17} aria-hidden />
                {unreadCount > 0 && <span className="unread-dot" aria-hidden />}
            </button>
            {open && (
                <div className="notification-dropdown" role="menu">
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p className="empty-history">Aucune notification.</p>
                        ) : (
                            notifications.slice(0, 6).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`notification-item ${item.read_at ? "notification-read" : ""}`}
                                    role="menuitem"
                                    onClick={() => void markAsRead(item.id)}
                                >
                                    <span className="notice-icon" aria-hidden>
                                        {item.type_label?.charAt(0) ?? "N"}
                                    </span>
                                    <span className="notification-copy">
                                        <strong>{item.title}</strong>
                                        <small>{relativeTime(item.created_at)}</small>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="notification-footer">
                        <Link href="/notifications" onClick={() => setOpen(false)}>
                            Tout voir
                        </Link>
                        {unreadCount > 0 && (
                            <button type="button" className="text-action" onClick={() => void markAllAsRead()}>
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}