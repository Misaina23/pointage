"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listScans, sendScan } from "@/services/api/attendance";
import { ApiError } from "@/lib/api";
import {
    clearScanHistory,
    dequeueScan,
    enqueueScan,
    markScanFailed,
    readScanHistory,
    readScanQueue,
    recordScan,
    removeStoredScan,
} from "@/services/storage";
import { useOnlineStatus } from "./useOnlineStatus";
import { todayIso } from "@/lib/dates";
import type { AttendanceEvent, EventType, ScanPayload, ScanResult } from "@/types/attendance";
import type { QueuedScan, StoredScan } from "@/services/storage";

function createClientEventId(): string | null {
    if (typeof crypto === "undefined") {
        return null;
    }

    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues !== "function") {
        return null;
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function useScanner(deviceCode?: string | null) {
    const online = useOnlineStatus();
    const [history, setHistory] = useState<StoredScan[]>(() => readScanHistory());
    const [queue, setQueue] = useState<QueuedScan[]>(() => readScanQueue());
    const [recent, setRecent] = useState<AttendanceEvent[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [syncingQueue, setSyncingQueue] = useState(false);
    const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
    const syncLock = useRef(false);

    const refreshRecent = useCallback(async (): Promise<AttendanceEvent[]> => {
        try {
            const response = await listScans(todayIso(), deviceCode ?? undefined);

            return response.data.slice(0, 20);
        } catch {
            return [];
        }
    }, [deviceCode]);

    const flushQueue = useCallback(async (): Promise<{ history: StoredScan[]; queue: QueuedScan[] }> => {
        const pending = readScanQueue();

        for (const item of pending) {
            try {
                await sendScan({
                    badge_public_id: item.badge_public_id,
                    event_type: item.event_type,
                    client_event_id: item.id,
                    occurred_at: item.occurred_at,
                    device_code: item.device_code,
                });
                dequeueScan(item.id);
                recordScan({
                    id: item.id,
                    badge_public_id: item.badge_public_id,
                    event_type: item.event_type,
                    occurred_at: item.occurred_at,
                    device_code: item.device_code,
                    employee_name: null,
                    synced: true,
                });
            } catch (caught) {
                const errorMessage = caught instanceof Error
                    ? caught.message
                    : "Échec de synchronisation du scan.";
                markScanFailed(item.id, errorMessage);
                break;
            }
        }

        return { history: readScanHistory(), queue: readScanQueue() };
    }, []);

    const syncQueue = useCallback(async () => {
        if (!online || syncLock.current) {
            return;
        }

        syncLock.current = true;
        setSyncingQueue(true);

        try {
            const flushed = await flushQueue();
            setHistory(flushed.history);
            setQueue(flushed.queue);
            setRecent(await refreshRecent());
        } finally {
            syncLock.current = false;
            setSyncingQueue(false);
        }
    }, [flushQueue, online, refreshRecent]);

    useEffect(() => {
        void syncQueue();
    }, [syncQueue]);

    const queueForSync = useCallback((payload: ScanPayload, syncError?: string): void => {
        enqueueScan({
            id: payload.client_event_id,
            badge_public_id: payload.badge_public_id,
            event_type: payload.event_type,
            occurred_at: payload.occurred_at,
            device_code: payload.device_code ?? null,
            queued_at: new Date().toISOString(),
            ...(syncError ? { sync_error: syncError } : {}),
        });
        setHistory(
            recordScan({
                id: payload.client_event_id,
                badge_public_id: payload.badge_public_id,
                event_type: payload.event_type,
                occurred_at: payload.occurred_at,
                device_code: payload.device_code ?? null,
                employee_name: null,
                synced: false,
            }),
        );
        setQueue(readScanQueue());
    }, []);

    const submit = useCallback(
        async (badgePublicId: string, eventType: EventType): Promise<ScanResult | null> => {
            const trimmed = badgePublicId.trim();

            if (!trimmed) {
                setMessage({ tone: "error", text: "Saisissez un identifiant de badge." });

                return null;
            }

            const clientEventId = createClientEventId();

            if (!clientEventId) {
                setMessage({
                    tone: "error",
                    text: "Impossible de créer un identifiant sécurisé pour ce pointage.",
                });

                return null;
            }

            const occurredAt = new Date().toISOString();
            const payload: ScanPayload = {
                badge_public_id: trimmed,
                event_type: eventType,
                client_event_id: clientEventId,
                occurred_at: occurredAt,
                device_code: deviceCode ?? null,
            };

            setSubmitting(true);

            if (!online) {
                queueForSync(payload);
                setMessage({ tone: "success", text: "Scan mis en file d'attente hors ligne." });
                setSubmitting(false);

                return null;
            }

            try {
                if (readScanQueue().length > 0) {
                    await syncQueue();

                    if (readScanQueue().length > 0) {
                        queueForSync(payload);
                        setMessage({
                            tone: "success",
                            text: "Scan ajouté après les pointages en attente de synchronisation.",
                        });

                        return null;
                    }
                }

                const result = await sendScan(payload);
                const name = `${result.data.employee.first_name} ${result.data.employee.last_name}`.trim();

                setHistory(
                    recordScan({
                        id: clientEventId,
                        badge_public_id: trimmed,
                        event_type: eventType,
                        occurred_at: occurredAt,
                        device_code: deviceCode ?? null,
                        employee_name: name,
                        synced: true,
                    }),
                );
                setMessage({
                    tone: result.duplicate ? "error" : "success",
                    text: result.duplicate
                        ? "Ce scan a déjà été enregistré."
                        : `${name} · ${eventType === "entry" ? "Entrée" : "Sortie"} enregistrée.`,
                });
                setRecent(await refreshRecent());

                return result;
            } catch (caught) {
                if (
                    caught instanceof ApiError
                    && (caught.status === 0 || caught.status === 408 || caught.status === 429 || caught.status >= 500)
                ) {
                    const syncError = caught instanceof Error
                        ? caught.message
                        : "Réseau indisponible. Réessayez la synchronisation.";
                    queueForSync(payload, syncError);
                    setMessage({
                        tone: "success",
                        text: "Le réseau est indisponible. Scan conservé pour synchronisation.",
                    });
                } else {
                    setMessage({
                        tone: "error",
                        text: caught instanceof Error ? caught.message : "Échec du scan.",
                    });
                }

                return null;
            } finally {
                setSubmitting(false);
            }
        },
        [deviceCode, online, queueForSync, refreshRecent, syncQueue],
    );

    const discardQueuedScan = useCallback(async (id: string) => {
        dequeueScan(id);
        setQueue(readScanQueue());
        setHistory(removeStoredScan(id));
        setMessage(null);

        await syncQueue();
    }, [syncQueue]);

    const resetHistory = useCallback(() => {
        const preservedHistory = clearScanHistory();
        const pendingScans = readScanQueue();

        setHistory(preservedHistory);
        setQueue(pendingScans);
        setMessage(pendingScans.length > 0
            ? { tone: "success", text: "Historique effacé. Les scans en attente sont conservés." }
            : null);
    }, []);

    return {
        online,
        history,
        queue,
        recent,
        submitting,
        message,
        syncingQueue,
        submit,
        retryQueue: syncQueue,
        discardQueuedScan,
        resetHistory,
        reload: refreshRecent,
    };
}