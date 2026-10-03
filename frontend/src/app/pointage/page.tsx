"use client";

import { useState } from "react";
import { Clock, LogIn, LogOut, Users } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard";
import { QRScanner } from "@/components/scanner";
import { useAttendance } from "@/hooks/useAttendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listDevices } from "@/services/api/devices";
import { todayIso } from "@/lib/dates";
import type { DeviceList } from "@/types/device";

export default function PointagePage() {
    const attendance = useAttendance(todayIso());
    const devices = useAsyncData<DeviceList>((signal) => listDevices({ status: "active" }, signal), []);
    const [deviceCode, setDeviceCode] = useState<string>("");
    const active = devices.data?.data ?? [];
    const summary = attendance.today?.summary;
    const value = (count: number | undefined) => count ?? (attendance.todayLoading ? "…" : "—");

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pointage</p>
                    <h1>Suivi des présences</h1>
                    <p className="page-subtitle">
                        Consultez les pointages du jour et enregistrez une entrée ou une sortie par badge QR.
                    </p>
                </div>
            </header>

            <StatGrid>
                <StatCard
                    icon={Users}
                    label="Présents"
                    value={value(summary?.present)}
                    note={`${summary?.absent ?? "—"} absent(s)`}
                />
                <StatCard
                    icon={Clock}
                    label="Retards"
                    value={value(summary?.late)}
                    tone="yellow"
                />
                <StatCard
                    icon={LogIn}
                    label="Entrées"
                    value={value(summary?.entries)}
                    tone="blue"
                />
                <StatCard
                    icon={LogOut}
                    label="Sorties"
                    value={value(summary?.exits)}
                    tone="red"
                />
            </StatGrid>

            {attendance.todayError && (
                <p className="page-subtitle" role="alert">
                    Impossible de charger les présences : {attendance.todayError}
                </p>
            )}

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
