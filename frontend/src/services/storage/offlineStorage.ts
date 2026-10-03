const SESSION_KEY = "pointa.session";

export type StoredScan = {
    id: string;
    badge_public_id: string;
    event_type: "entry" | "exit";
    occurred_at: string;
    device_code: string | null;
    employee_name: string | null;
    synced: boolean;
};

export type QueuedScan = {
    id: string;
    badge_public_id: string;
    event_type: "entry" | "exit";
    occurred_at: string;
    device_code: string | null;
    queued_at: string;
    sync_error?: string;
};

export function readSession<T>(): T | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(SESSION_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function writeSession(value: unknown): void {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(value));
}

export function clearSession(): void {
    window.localStorage.removeItem(SESSION_KEY);
}