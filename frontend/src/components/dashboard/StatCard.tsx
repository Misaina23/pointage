"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";

type StatCardProps = {
    label: string;
    value: string | number;
    note?: string;
    icon?: LucideIcon;
    tone?: "green" | "blue" | "yellow" | "red";
};

export function StatCard({ label, value, note, icon: Icon, tone = "green" }: StatCardProps) {
    return (
        <div className="stat-card">
            {Icon && (
                <span className={`stat-icon stat-${tone}`}>
                    <Icon size={18} aria-hidden />
                </span>
            )}
            <span className="stat-copy">
                <span className="stat-number">{value}</span>
                <span className="stat-label">{label}</span>
                {note && <span className="stat-note">{note}</span>}
            </span>
        </div>
    );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
    return <div className="stats-grid">{children}</div>;
}

export { Card };