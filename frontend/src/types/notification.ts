export type NotificationType =
    | "leave_submitted"
    | "leave_decided"
    | "permission_decided"
    | "absence_decided"
    | "planning_invitation"
    | "attendance_alert";

export type NotificationItem = {
    id: string;
    type: string;
    type_label: string | null;
    title: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
};

export type NotificationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    unread: number;
};

export type NotificationList = {
    data: NotificationItem[];
    meta: NotificationMeta;
};

export type NotificationFilters = {
    unread_only?: boolean;
    type?: string;
    per_page?: number;
    page?: number;
};