export function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function todayIso(): string {
    return toIsoDate(new Date());
}

export function toIsoDate(value: Date | string | null | undefined): string {
    const date = toDate(value);

    if (!date) {
        return "";
    }

    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
}

export function toIsoMonth(value: Date | string | null | undefined): string {
    const date = toDate(value);

    if (!date) {
        return "";
    }

    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function toIsoDateTime(value: Date | string | null | undefined): string {
    const date = toDate(value);

    if (!date) {
        return "";
    }

    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");

    return `${toIsoDate(date)}T${hours}:${minutes}`;
}

export function startOfMonth(value: Date | string = new Date()): string {
    const date = toDate(value) ?? new Date();

    return `${toIsoMonth(date)}-01`;
}

export function endOfMonth(value: Date | string = new Date()): string {
    const date = toDate(value) ?? new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return toIsoDate(lastDay);
}

export function addDays(value: Date | string, days: number): string {
    const date = toDate(value);

    if (!date) {
        return "";
    }

    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);

    return toIsoDate(shifted);
}

export function workingDaysBetween(start: string, end: string): number {
    const from = toDate(start);
    const to = toDate(end);

    if (!from || !to || from > to) {
        return 0;
    }

    let total = 0;
    const cursor = new Date(from);

    while (cursor <= to) {
        const day = cursor.getDay();

        if (day !== 0) {
            total += 1;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return total;
}