"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    listNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "@/services/api/notifications";
import { useAuth } from "./AuthProvider";
import type { NotificationItem } from "@/types/notification";

export type ToastTone = "success" | "error" | "info";

export type Toast = {
    id: string;
    tone: ToastTone;
    message: string;
};

type NotificationContextValue = {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    open: boolean;
    setOpen: (open: boolean) => void;
    reload: () => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    toasts: Toast[];
    notify: (message: string, tone?: ToastTone) => void;
    dismissToast: (id: string) => void;
};

type NotificationSnapshot = {
    requestKey: number;
    items: NotificationItem[];
    unread: number;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { status } = useAuth();
    const authenticated = status === "authenticated";
    const [requestKey, setRequestKey] = useState(0);
    const [snapshot, setSnapshot] = useState<NotificationSnapshot>({
        requestKey: -1,
        items: [],
        unread: 0,
    });
    const [open, setOpen] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        if (!authenticated) {
            return;
        }

        const controller = new AbortController();
        const key = requestKey;

        void listNotifications({ per_page: 15 }, controller.signal)
            .then((response) => {
                if (!controller.signal.aborted) {
                    setSnapshot({ requestKey: key, items: response.data, unread: response.meta.unread });
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setSnapshot({ requestKey: key, items: [], unread: 0 });
                }
            });

        return () => controller.abort();
    }, [authenticated, requestKey]);

    const reload = useCallback(() => setRequestKey((value) => value + 1), []);

    useEffect(() => {
        const map = timers.current;

        return () => {
            map.forEach((timer) => clearTimeout(timer));
            map.clear();
        };
    }, []);

    const notify = useCallback((message: string, tone: ToastTone = "info") => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        setToasts((current) => [...current, { id, tone, message }]);

        timers.current.set(
            id,
            setTimeout(() => {
                setToasts((current) => current.filter((toast) => toast.id !== id));
                timers.current.delete(id);
            }, 4500),
        );
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));

        const timer = timers.current.get(id);

        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const markAsRead = useCallback(
        async (id: string) => {
            try {
                await markNotificationAsRead(id);
                setSnapshot((current) => ({
                    ...current,
                    items: current.items.map((item) =>
                        item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
                    ),
                    unread: Math.max(0, current.unread - 1),
                }));
            } catch {
                notify("Impossible de marquer la notification comme lue.", "error");
            }
        },
        [notify],
    );

    const markAllAsRead = useCallback(async () => {
        try {
            await markAllNotificationsAsRead();
            const now = new Date().toISOString();

            setSnapshot((current) => ({
                ...current,
                items: current.items.map((item) => ({ ...item, read_at: now })),
                unread: 0,
            }));
        } catch {
            notify("Impossible de tout marquer comme lu.", "error");
        }
    }, [notify]);

    const fresh = snapshot.requestKey === requestKey;
    const value = useMemo<NotificationContextValue>(
        () => ({
            notifications: authenticated && fresh ? snapshot.items : [],
            unreadCount: authenticated && fresh ? snapshot.unread : 0,
            loading: authenticated && !fresh,
            open,
            setOpen,
            reload,
            markAsRead,
            markAllAsRead,
            toasts,
            notify,
            dismissToast,
        }),
        [
            authenticated,
            fresh,
            snapshot.items,
            snapshot.unread,
            open,
            reload,
            markAsRead,
            markAllAsRead,
            toasts,
            notify,
            dismissToast,
        ],
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error("useNotifications doit être utilisé dans un NotificationProvider.");
    }

    return context;
}