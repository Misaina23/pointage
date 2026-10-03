"use client";

import type { ReactNode } from "react";

export type TabItem = {
    id: string;
    label: string;
    count?: number;
};

export function Tabs({
    items,
    active,
    onChange,
}: {
    items: TabItem[];
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <div className="status-tabs" role="tablist">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active === item.id}
                    className={`status-tab ${active === item.id ? "active" : ""}`}
                    onClick={() => onChange(item.id)}
                >
                    {item.label}
                    {typeof item.count === "number" && <span className="nav-count">{item.count}</span>}
                </button>
            ))}
        </div>
    );
}

export function SegmentedControl({
    items,
    active,
    onChange,
}: {
    items: TabItem[];
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <div className="segmented-control" role="group">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    aria-pressed={active === item.id}
                    className={`segment ${active === item.id ? "active" : ""}`}
                    onClick={() => onChange(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
    return (
        <span className="tooltip" data-tooltip={label}>
            {children}
        </span>
    );
}