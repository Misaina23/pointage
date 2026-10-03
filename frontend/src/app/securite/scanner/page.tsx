"use client";

import { useState } from "react";
import { QRScanner } from "@/components/scanner";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listDevices } from "@/services/api/devices";
import type { DeviceList } from "@/types/device";

export default function ScannerPage() {
    const devices = useAsyncData<DeviceList>((signal) => listDevices({ status: "active" }, signal), []);
    const [deviceCode, setDeviceCode] = useState<string>("");
    const active = devices.data?.data ?? [];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Contrôle d&apos;accès</p>
                    <h1>Scanner un badge</h1>
                    <p className="page-subtitle">
                        Lisez le QR du badge ou saisissez le code pour pointer l&apos;agent.
                    </p>
                </div>
            </header>

            <div className="filter-row">
                <label className="field-label">
                    Terminal
                    <select
                        className="form-control"
                        value={deviceCode}
                        onChange={(event) => setDeviceCode(event.target.value)}
                    >
                        <option value="">Non défini</option>
                        {active.map((device) => (
                            <option key={device.id} value={device.device_code}>
                                {device.name} — {device.location ?? "sans emplacement"}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <QRScanner deviceCode={deviceCode || null} />
        </>
    );
}