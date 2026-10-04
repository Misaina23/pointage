"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { BarcodeScanner, ScannerCamera } from "./ScannerCamera";
import { ScanQueueErrors, ScanResultBanner } from "./ScanResult";
import { ResultBanner, SegmentedControl } from "@/components/ui";
import { useScanner } from "@/hooks/useScanner";
import type { EventType, ScanResult } from "@/types/attendance";

export function QRScanner({ deviceCode }: { deviceCode?: string | null }) {
    const scanner = useScanner(deviceCode);
    const [mode, setMode] = useState<EventType>("entry");
    const [last, setLast] = useState<ScanResult | null>(null);

    const handleDecoded = async (value: string) => {
        const result = await scanner.submit(value, mode);

        if (result) {
            setLast(result);
        }
    };

    return (
        <div className="scanner-layout">
            <Card title="Lecture du badge" subtitle={`Terminal : ${deviceCode ?? "non défini"}`}>
                <div className="scanner-mode-control">
                    <span>Type de pointage</span>
                    <SegmentedControl
                        items={[
                            { id: "entry", label: "Entrée" },
                            { id: "exit", label: "Sortie" },
                        ]}
                        active={mode}
                        onChange={(id) => setMode(id as EventType)}
                    />
                </div>
                <ScannerCamera onDecoded={handleDecoded} />
                <BarcodeScanner onDecoded={handleDecoded} />
            </Card>
            <Card title="Historique" subtitle={`${scanner.history.length} scan(s) sur cet appareil`}>
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    {scanner.message && <ResultBanner tone={scanner.message.tone}>{scanner.message.text}</ResultBanner>}
                    {last && <ScanResultBanner result={last} />}
                    <ScanQueueErrors
                        queue={scanner.queue}
                        online={scanner.online}
                        syncing={scanner.syncingQueue}
                        onRetry={() => void scanner.retryQueue()}
                        onDiscard={(id) => void scanner.discardQueuedScan(id)}
                    />
                </div>
                {scanner.history.length === 0 ? (
                    <p className="empty-history">Aucun scan enregistré.</p>
                ) : (
                    <div className="history-list">
                        {scanner.history.slice(0, 10).map((scan) => (
                            <div key={scan.id} className="history-row">
                                <span className="history-avatar" aria-hidden>
                                    {scan.event_type === "entry" ? "E" : "S"}
                                </span>
                                <span>
                                    <span className="history-name">
                                        {scan.employee_name ?? scan.badge_public_id.slice(0, 8)}
                                    </span>
                                    <span className="history-code">
                                        {scan.device_code ?? "Sans terminal"}
                                    </span>
                                </span>
                                <span className={`history-status ${scan.synced ? "valid" : "denied"}`}>
                                    {scan.synced ? "OK" : "En attente"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

export function ScanHistory() {
    const scanner = useScanner();

    return (
        <Card
            title="Historique de session"
            subtitle={`${scanner.queue.length} scan(s) en attente de synchronisation`}
            actions={
                <button type="button" className="text-action" onClick={scanner.resetHistory}>
                    Vider
                </button>
            }
        >
            {scanner.history.length === 0 ? (
                <p className="empty-history">Aucun scan pour le moment.</p>
            ) : (
                <div className="history-list">
                    {scanner.history.map((scan) => (
                        <div key={scan.id} className="history-row">
                            <span className="history-avatar" aria-hidden>
                                {scan.event_type === "entry" ? "E" : "S"}
                            </span>
                            <span>
                                <span className="history-name">
                                    {scan.employee_name ?? scan.badge_public_id.slice(0, 8)}
                                </span>
                                <span className="history-code">{scan.device_code ?? "Sans terminal"}</span>
                            </span>
                            <span className={`history-status ${scan.synced ? "valid" : "denied"}`}>
                                {scan.synced ? "Sync" : "Queue"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}