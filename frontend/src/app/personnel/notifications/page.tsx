"use client";

import { Card } from "@/components/ui";
import { NotificationList } from "@/components/notifications";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { listNotifications } from "@/services/api/notifications";
import { deleteNotification } from "@/services/api/notifications";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useState } from "react";
import type { NotificationList as NotificationPage } from "@/types/notification";

export default function PersonnelNotificationsPage() {
    const { markAllAsRead } = useNotifications();
    const [reloadKey, setReloadKey] = useState(0);
    const notifications = useAsyncData<NotificationPage>(
        (signal) => listNotifications({ per_page: 50 }, signal),
        [reloadKey],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Suivi</p>
                    <h1>Notifications</h1>
                    <p className="page-subtitle">
                        {notifications.data?.meta.unread ?? 0} notification(s) non lue(s).
                    </p>
                </div>
                <div className="heading-tools">
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={async () => {
                            await markAllAsRead();
                            setReloadKey((value) => value + 1);
                        }}
                    >
                        Tout marquer comme lu
                    </button>
                </div>
            </header>

            <Card title="Fil de notifications">
                {notifications.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <NotificationList
                        notifications={notifications.data?.data ?? []}
                        onDelete={async (id) => {
                            await deleteNotification(id);
                            setReloadKey((value) => value + 1);
                        }}
                    />
                )}
            </Card>
        </>
    );
}