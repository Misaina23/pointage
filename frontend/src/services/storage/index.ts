import { SCAN_HISTORY_KEY, SCAN_QUEUE_KEY, STORAGE_SCAN_CAPACITY } from "@/lib/constants";
import type { QueuedScan, StoredScan } from "./offlineStorage";

export { readSession, writeSession, clearSession } from "./offlineStorage";
export type { QueuedScan, StoredScan } from "./offlineStorage";

function readJson<T>(key: string): T[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(key);

        return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
        return [];
    }
}

function writeJson<T>(key: string, value: T[]): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
}

export function readScanHistory(): StoredScan[] {
    return readJson<StoredScan>(SCAN_HISTORY_KEY);
}

export function recordScan(scan: StoredScan): StoredScan[] {
    const history = [scan, ...readScanHistory().filter((item) => item.id !== scan.id)].slice(
        0,
        STORAGE_SCAN_CAPACITY,
    );

    writeJson(SCAN_HISTORY_KEY, history);

    return history;
}

export function removeStoredScan(id: string): StoredScan[] {
    const history = readScanHistory().filter((item) => item.id !== id);

    writeJson(SCAN_HISTORY_KEY, history);

    return history;
}

export function clearScanHistory(): StoredScan[] {
    const pendingIds = new Set(readScanQueue().map((scan) => scan.id));
    const history = readScanHistory().filter((scan) => !scan.synced && pendingIds.has(scan.id));

    writeJson(SCAN_HISTORY_KEY, history);

    return history;
}

export function readScanQueue(): QueuedScan[] {
    return readJson<QueuedScan>(SCAN_QUEUE_KEY);
}

export function enqueueScan(scan: QueuedScan): QueuedScan[] {
    const queue = [...readScanQueue(), scan];

    writeJson(SCAN_QUEUE_KEY, queue);

    return queue;
}

export function dequeueScan(id: string): QueuedScan[] {
    const queue = readScanQueue().filter((item) => item.id !== id);

    writeJson(SCAN_QUEUE_KEY, queue);

    return queue;
}

export function markScanFailed(id: string, syncError: string): QueuedScan[] {
    const queue = readScanQueue().map((item) =>
        item.id === id ? { ...item, sync_error: syncError } : item,
    );

    writeJson(SCAN_QUEUE_KEY, queue);

    return queue;
}

export function clearScanQueue(): void {
    writeJson(SCAN_QUEUE_KEY, []);
}