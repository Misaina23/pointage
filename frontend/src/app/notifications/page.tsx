"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { NotificationList } from "@/components/notifications";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { listNotifications, deleteNotification } from "@/services/api/notifications";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { NotificationList as NotificationPage } from "@/types/notification";

export default function NotificationsPage() {
    const { markAllAsRead } = useNotifications();
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [page, setPage] = useState(1);
    const notifications = useAsyncData<NotificationPage>(
        (signal) => listNotifications({ per_page: 50, page, unread_only: unreadOnly }, signal),
        [page, unreadOnly],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Communication</p>
                    <h1>Centre de notifications</h1>
                    <p className="page-subtitle">
                        {notifications.data?.meta.unread ?? 0} notification(s) non lue(s) sur{" "}
                        {notifications.data?.meta.total ?? 0}.
                    </p>
                </div>
                <div className="heading-tools">
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={() => setUnreadOnly((value) => !value)}
                    >
                        {unreadOnly ? "Tout afficher" : "Non lues uniquement"}
                    </button>
                    <button
                        type="button"
                        className="button-primary"
                        onClick={async () => {
                            await markAllAsRead();
                            notifications.reload();
                        }}
                    >
                        Tout marquer comme lu
                    </button>
                </div>
            </header>

            <Card title="Fil">
                {notifications.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <NotificationList
                        notifications={notifications.data?.data ?? []}
                        onDelete={async (id) => {
                            await deleteNotification(id);
                            notifications.reload();
                        }}
                    />
                )}
            </Card>

            <div className="pagination" style={{ marginTop: 14 }}>
                <button
                    type="button"
                    className="compact-button"
                    disabled={(notifications.data?.meta.current_page ?? 1) <= 1}
                    onClick={() => setPage((value) => value - 1)}
                >
                    Précédent
                </button>
                <span>
                    Page {notifications.data?.meta.current_page ?? 1} sur{" "}
                    {notifications.data?.meta.last_page ?? 1}
                </span>
                <button
                    type="button"
                    className="compact-button"
                    disabled={
                        (notifications.data?.meta.current_page ?? 1) >=
                        (notifications.data?.meta.last_page ?? 1)
                    }
                    onClick={() => setPage((value) => value + 1)}
                >
                    Suivant
                </button>
            </div>
        </>
    );
}