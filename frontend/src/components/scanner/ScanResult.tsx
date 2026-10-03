"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button, ResultBanner } from "@/components/ui";
import { formatTime } from "@/lib/formatters";
import type { QueuedScan } from "@/services/storage";
import type { ScanResult } from "@/types/attendance";

export function ScanQueueErrors({
    queue,
    online,
    syncing,
    onRetry,
    onDiscard,
}: {
    queue: QueuedScan[];
    online: boolean;
    syncing: boolean;
    onRetry: () => void;
    onDiscard: (id: string) => void;
}) {
    const failedScans = queue.filter((scan) => scan.sync_error);

    if (failedScans.length === 0) {
        return null;
    }

    return (
        <div className="scan-queue-errors" aria-live="polite">
            {failedScans.map((scan) => (
                <div key={scan.id}>
                    <ResultBanner tone="error">
                        Scan du badge {scan.badge_public_id.slice(0, 8)} non synchronisé :{" "}
                        {scan.sync_error}
                    </ResultBanner>
                    <div className="camera-actions">
                        <Button
                            variant="secondary"
                            disabled={!online}
                            loading={syncing}
                            onClick={onRetry}
                        >
                            Réessayer
                        </Button>
                        <Button
                            variant="danger"
                            disabled={syncing}
                            onClick={() => onDiscard(scan.id)}
                        >
                            Retirer ce scan
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ScanResultBanner({ result }: { result: ScanResult }) {
    const event = result.data;
    const name = `${event.employee.first_name} ${event.employee.last_name}`.trim();

    return (
        <div className={`result-banner ${result.duplicate ? "error" : "success"}`} role="status">
            {result.duplicate ? (
                <XCircle size={16} aria-hidden />
            ) : (
                <CheckCircle2 size={16} aria-hidden />
            )}
            <span>
                <strong>{name}</strong> · {event.employee.employee_number} ·{" "}
                {event.event_type === "entry" ? "Entrée" : "Sortie"} à{" "}
                {formatTime(event.occurred_at)}
                {result.duplicate ? " — déjà enregistré" : ""}
            </span>
        </div>
    );
}