"use client";

import { useEffect, useId, useRef, useState } from "react";
import { QrCode, ScanLine } from "lucide-react";

type ScannerCameraProps = {
    onDecoded: (value: string) => void | Promise<void>;
    active?: boolean;
};

type CameraScanner = {
    isScanning: boolean;
    pause: () => void;
    resume: () => void;
    stop: () => Promise<void>;
};

export function ScannerCamera({ onDecoded, active = true }: ScannerCameraProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scannerRef = useRef<CameraScanner | null>(null);
    const onDecodedRef = useRef(onDecoded);
    const pausedRef = useRef(false);
    const readerId = `qr-reader-${useId().replaceAll(":", "")}`;
    const [error, setError] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [awaitingNextScan, setAwaitingNextScan] = useState(false);

    useEffect(() => {
        onDecodedRef.current = onDecoded;
    }, [onDecoded]);

    useEffect(() => {
        if (!active || !containerRef.current) {
            return;
        }

        let cancelled = false;
        let scanner: CameraScanner | null = null;

        const start = async () => {
            setError(null);

            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                setError("La caméra nécessite une connexion HTTPS. Utilisez la saisie manuelle en attendant.");
                return;
            }

            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                if (cancelled) {
                    return;
                }

                const cameraScanner = new Html5Qrcode(readerId, { verbose: false });
                scanner = cameraScanner;
                scannerRef.current = cameraScanner;

                await cameraScanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (width, height) => {
                            const edge = Math.floor(Math.min(width, height) * 0.68);

                            return { width: edge, height: edge };
                        },
                    },
                    (decoded) => {
                        if (cancelled || pausedRef.current) {
                            return;
                        }

                        pausedRef.current = true;
                        cameraScanner.pause();
                        void Promise.resolve(onDecodedRef.current(decoded))
                            .catch((caught: unknown) => {
                                if (!cancelled) {
                                    setError(caught instanceof Error ? caught.message : "Échec de l'enregistrement du scan.");
                                }
                            })
                            .finally(() => {
                                if (!cancelled) {
                                    setAwaitingNextScan(true);
                                }
                            });
                    },
                    () => undefined,
                );

                if (cancelled) {
                    if (cameraScanner.isScanning) {
                        await cameraScanner.stop();
                    }

                    return;
                }

                setRunning(true);
            } catch (caught) {
                if (!cancelled) {
                    setError(
                        caught instanceof DOMException && caught.name === "NotAllowedError"
                            ? "Autorisez l'accès à la caméra dans les réglages du navigateur, puis rechargez la page."
                            : caught instanceof Error
                                ? caught.message
                                : "Caméra indisponible. Utilisez la saisie manuelle.",
                    );
                }
            }
        };

        void start();

        return () => {
            cancelled = true;
            pausedRef.current = false;
            setRunning(false);
            setAwaitingNextScan(false);

            const activeScanner = scannerRef.current;

            if (activeScanner === scanner) {
                scannerRef.current = null;
            }

            if (activeScanner?.isScanning) {
                void activeScanner.stop().catch(() => undefined);
            }
        };
    }, [active, readerId]);

    const resumeScanning = () => {
        const scanner = scannerRef.current;

        if (!scanner?.isScanning) {
            return;
        }

        scanner.resume();
        pausedRef.current = false;
        setAwaitingNextScan(false);
    };

    return (
        <div className="scanner-stage">
            <div className="camera-view">
                <div className="qr-reader" id={readerId} ref={containerRef} />
                <span className="camera-frame" aria-hidden>
                    <span className="camera-icon">
                        <QrCode size={42} aria-hidden />
                    </span>
                </span>
                {awaitingNextScan ? (
                    <button type="button" className="button-primary camera-next" onClick={resumeScanning}>
                        Scanner le badge suivant
                    </button>
                ) : (
                    <span className="camera-caption">
                        {running ? "Cadrez le badge dans le viseur" : "Caméra en veille"}
                    </span>
                )}
            </div>
            {error && <p className="camera-message">{error}</p>}
            {!error && (
                <p className="camera-message">
                    <ScanLine size={13} aria-hidden /> Le scan QR lit l&apos;identifiant public du badge.
                </p>
            )}
        </div>
    );
}

export function BarcodeScanner({
    onDecoded,
}: {
    onDecoded: (value: string) => void | Promise<void>;
}) {
    return (
        <div className="manual-form">
            <label className="manual-label" htmlFor="badge-manual">
                Saisie manuelle du code badge
            </label>
            <div className="manual-controls">
                <input
                    id="badge-manual"
                    className="manual-input"
                    placeholder="Ex. 0f8f1c2e-..."
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="button-primary"
                    onClick={() => {
                        const input = document.getElementById("badge-manual") as HTMLInputElement | null;

                        if (input?.value) {
                            onDecoded(input.value.trim());
                            input.value = "";
                        }
                    }}
                >
                    Valider
                </button>
            </div>
        </div>
    );
}