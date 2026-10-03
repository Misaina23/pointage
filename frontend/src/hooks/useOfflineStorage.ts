"use client";

import { useCallback, useEffect, useState } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { readScanQueue, enqueueScan, dequeueScan } from "@/services/storage";

export { useOnlineStatus } from "./useOnlineStatus";

export function useScanQueue() {
    const online = useOnlineStatus();
    const [queue, setQueue] = useState<import("@/services/storage").QueuedScan[]>(() => readScanQueue());
    const [queueLength, setQueueLength] = useState(() => readScanQueue().length);

    useEffect(() => {
        if (!online || queueLength === 0) {
            return;
        }

        const flush = async () => {
            const items = readScanQueue();

            for (const scan of items) {
                try {
                    const response = await fetch("/api/v1/attendance/scan", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            badge_public_id: scan.badge_public_id,
                            event_type: scan.event_type,
                            occurred_at: scan.occurred_at,
                            device_code: scan.device_code,
                        }),
                    });

                    if (response.ok) {
                        dequeueScan(scan.id);
                    }
                } catch {
                    break;
                }
            }

            const remaining = readScanQueue();
            setQueue(remaining);
            setQueueLength(remaining.length);
        };

        void flush();
    }, [online, queueLength]);

    const enqueue = useCallback(
        (scan: Omit<import("@/services/storage").QueuedScan, "id" | "queued_at">) => {
            const queued: import("@/services/storage").QueuedScan = {
                ...scan,
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                queued_at: new Date().toISOString(),
            };

            enqueueScan(queued);
            const remaining = readScanQueue();
            setQueue(remaining);
            setQueueLength(remaining.length);

            return queued;
        },
        [],
    );

    const dequeue = useCallback(
        (id: string) => {
            dequeueScan(id);
            const remaining = readScanQueue();
            setQueue(remaining);
            setQueueLength(remaining.length);
        },
        [],
    );

    return {
        queue,
        queueLength,
        enqueue,
        dequeue,
        reload: () => {
            const items = readScanQueue();
            setQueue(items);
            setQueueLength(items.length);
        },
    };
}
