"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatMinutes, formatTime } from "@/lib/formatters";

export function Horloge() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="horloge" aria-live="off">
            <Clock size={16} aria-hidden />
            <span className="horloge-time">{formatTime(now)}</span>
        </div>
    );
}

export function ClockCard({
    label,
    value,
    hint,
    tone,
}: {
    label: string;
    value: string | null;
    hint?: string;
    tone?: "entry" | "exit";
}) {
    return (
        <div className={`stat-card clock-card ${tone ?? ""}`}>
            <span className="stat-icon">
                <Clock size={18} aria-hidden />
            </span>
            <span className="stat-copy">
                <span className="stat-label">{label}</span>
                <span className="stat-number">{value ?? "—"}</span>
                {hint && <span className="stat-note">{hint}</span>}
            </span>
        </div>
    );
}

export function WorkedTime({ minutes }: { minutes: number }) {
    return <span className="worked-time">{formatMinutes(minutes)}</span>;
}