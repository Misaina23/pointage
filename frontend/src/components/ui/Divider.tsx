"use client";

import type { ReactNode } from "react";

type DividerProps = {
    className?: string;
    orientation?: "horizontal" | "vertical";
    children?: ReactNode;
};

export function Divider({ className = "", orientation = "horizontal", children }: DividerProps) {
    if (children) {
        return (
            <div
                className={`flex items-center gap-3 text-[var(--mut)] text-xs font-semibold ${className}`}
                role="separator"
            >
                <span className="h-px flex-1 bg-[var(--line)]" />
                {children}
                <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
        );
    }

    if (orientation === "vertical") {
        return <span className={`block h-full w-px bg-[var(--line)] ${className}`} role="separator" aria-orientation="vertical" />;
    }

    return <hr className={`border-0 border-t border-[var(--line)] ${className}`} role="separator" />;
}
