"use client";

import { formatDate, formatTime } from "@/lib/formatters";
import { useScanner } from "@/hooks/useScanner";
import { Button, ResultBanner } from "@/components/ui";
import { ScanQueueErrors } from "./ScanResult";
import type { EventType } from "@/types/attendance";

export function ScannerPanel({ deviceCode }: { deviceCode?: string | null }) {
    const scanner = useScanner(deviceCode);

    return (
        <div className="scanner-panel">
            <div className="scanner-entry">
                <label className="manual-label" htmlFor="badge-public-id">
                    Numéro ou identifiant de badge
                </label>
                <div className="manual-controls">
                    <input
                        id="badge-public-id"
                        className="manual-input"
                        placeholder="Numéro de badge ou UUID"
                        autoComplete="off"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                void scanner.submit(
                                    (event.target as HTMLInputElement).value,
                                    "entry",
                                );
                            }
                        }}
                    />
                    <Button
                        loading={scanner.submitting}
                        onClick={(event) => {
                            const input = document.getElementById(
                                "badge-public-id",
                            ) as HTMLInputElement | null;
                            void scanner.submit(input?.value ?? "", "entry");
                            event.preventDefault();
                        }}
                    >
                        Pointer
                    </Button>
                </div>
                <p className="example-code">
                    <strong>Mode :</strong> le type est déduit du dernier pointage de l&apos;employé.
                </p>
            </div>
            <ScanModeToggle
                onChange={(mode) => {
                    const input = document.getElementById("badge-public-id") as HTMLInputElement | null;
                    void scanner.submit(input?.value ?? "", mode);
                }}
                submitting={scanner.submitting}
            />
            {scanner.message && (
                <ResultBanner tone={scanner.message.tone}>{scanner.message.text}</ResultBanner>
            )}
            <ScanQueueErrors
                queue={scanner.queue}
                online={scanner.online}
                syncing={scanner.syncingQueue}
                onRetry={() => void scanner.retryQueue()}
                onDiscard={(id) => void scanner.discardQueuedScan(id)}
            />
            {!scanner.online && (
                <ResultBanner tone="success">
                    Mode hors ligne : les scans sont mis en file d&apos;attente et synchronisés
                    automatiquement.
                </ResultBanner>
            )}
        </div>
    );
}

function ScanModeToggle({
    onChange,
    submitting,
}: {
    onChange: (type: EventType) => void;
    submitting: boolean;
}) {
    return (
        <div className="camera-actions">
            <Button variant="secondary" disabled={submitting} onClick={() => onChange("entry")}>
                Entrée
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={() => onChange("exit")}>
                Sortie
            </Button>
        </div>
    );
}

export function ScanHistoryPanel() {
    const scanner = useScanner();

    return (
        <div className="panel">
            <div className="panel-heading">
                <div>
                    <h2>Historique des scans</h2>
                    <p>
                        {scanner.history.length} scan(s) · {scanner.queue.length} en attente
                    </p>
                </div>
                <button type="button" className="text-action" onClick={scanner.resetHistory}>
                    Vider
                </button>
            </div>
            {scanner.history.length === 0 ? (
                <p className="empty-history">Aucun scan enregistré sur cet appareil.</p>
            ) : (
                <div className="history-list">
                    {scanner.history.slice(0, 15).map((scan) => (
                        <div key={scan.id} className="history-row">
                            <span className="history-avatar" aria-hidden>
                                {scan.event_type === "entry" ? "E" : "S"}
                            </span>
                            <span>
                                <span className="history-name">
                                    {scan.employee_name ?? scan.badge_public_id.slice(0, 8)}
                                </span>
                                <span className="history-code">
                                    {scan.device_code ?? "Terminal inconnu"} ·{" "}
                                    {formatDate(scan.occurred_at)}
                                </span>
                            </span>
                            <span className={`history-status ${scan.synced ? "valid" : "denied"}`}>
                                {formatTime(scan.occurred_at)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}