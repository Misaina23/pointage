"use client";

import type { ReactNode } from "react";

export type BadgeTone = "positive" | "pending" | "negative" | "neutral";

const TONE_BY_STATUS: Record<string, BadgeTone> = {
    present: "positive",
    approved: "positive",
    active: "positive",
    revoked: "negative",
    rejected: "negative",
    absent: "negative",
    late: "pending",
    pending: "pending",
    on_leave: "neutral",
    on_permission: "neutral",
    holiday: "neutral",
    rest_day: "neutral",
    remote: "neutral",
    incomplete: "pending",
    inactive: "neutral",
    suspended: "pending",
    retired: "neutral",
    cancelled: "neutral",
    lost: "negative",
};

export function Badge({ children, tone }: { children: ReactNode; tone?: BadgeTone }) {
    return <span className={`status-pill status-${tone ?? "neutral"}`}>{children}</span>;
}

export function StatusBadge({ status, label }: { status: string; label?: string | null }) {
    return <Badge tone={TONE_BY_STATUS[status] ?? "neutral"}>{label ?? status}</Badge>;
}

export function statusTone(status: string): BadgeTone {
    return TONE_BY_STATUS[status] ?? "neutral";
}