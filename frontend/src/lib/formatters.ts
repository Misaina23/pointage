import { toDate } from "./dates";

export function formatDate(
    value: Date | string | null | undefined,
    options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
    const date = toDate(value);

    return date ? new Intl.DateTimeFormat("fr-FR", options).format(date) : "—";
}

export function formatLongDate(value: Date | string | null | undefined): string {
    return formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(value: Date | string | null | undefined): string {
    const date = toDate(value);

    return date
        ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date)
        : "—";
}

export function formatDateTime(value: Date | string | null | undefined): string {
    const date = toDate(value);

    return date ? `${formatDate(date)} · ${formatTime(date)}` : "—";
}

export function formatMonth(value: Date | string | null | undefined): string {
    const date = toDate(value);

    return date
        ? new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date)
        : "—";
}

export function formatNumber(value: number | null | undefined, fraction = 0): string {
    if (value === null || value === undefined) {
        return "—";
    }

    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
    }).format(value);
}

export function formatMinutes(minutes: number | null | undefined): string {
    const total = minutes ?? 0;
    const sign = total < 0 ? "-" : "";
    const absolute = Math.abs(total);
    const hours = Math.floor(absolute / 60);
    const rest = absolute % 60;

    if (hours === 0) {
        return `${sign}${rest} min`;
    }

    return `${sign}${hours} h ${`${rest}`.padStart(2, "0")}`;
}

export function formatHours(hours: number | null | undefined): string {
    return hours === null || hours === undefined ? "—" : `${formatNumber(hours, 2)} h`;
}

export function formatDays(days: number | null | undefined): string {
    return days === null || days === undefined ? "—" : `${formatNumber(days, days % 1 === 0 ? 0 : 1)} j`;
}

export function relativeTime(value: Date | string | null | undefined): string {
    const date = toDate(value);

    if (!date) {
        return "—";
    }

    const diffMs = date.getTime() - Date.now();
    const diffMinutes = Math.round(diffMs / 60000);

    if (Math.abs(diffMinutes) < 60) {
        return new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" }).format(diffMinutes, "minute");
    }

    const diffHours = Math.round(diffMinutes / 60);

    if (Math.abs(diffHours) < 24) {
        return new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" }).format(diffHours, "hour");
    }

    return new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" }).format(
        Math.round(diffHours / 24),
        "day",
    );
}

export function initials(value: string | null | undefined): string {
    if (!value) {
        return "—";
    }

    return value
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

export function titleCase(value: string): string {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}