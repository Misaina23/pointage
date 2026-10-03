export type BadgeStatusValue = "active" | "suspended" | "revoked" | "lost";

export type Badge = {
    id: number;
    public_id: string;
    badge_number: string;
    status: BadgeStatusValue;
    status_label: string;
    issued_at: string | null;
    revoked_at: string | null;
    employee: {
        id: number;
        employee_number: string;
        full_name: string;
        department: string | null;
        photo_url: string | null;
    } | null;
};

export type BadgeList = {
    data: Badge[];
    meta: { total: number };
};

export type StoreBadgePayload = {
    employee_id: number;
    badge_number: string;
};

export type BadgeFilters = {
    status?: BadgeStatusValue;
    employee_id?: number;
};