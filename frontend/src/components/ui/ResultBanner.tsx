"use client";

import type { ReactNode } from "react";

export function ResultBanner({
    tone = "success",
    children,
}: {
    tone?: "success" | "error" | "info";
    children: ReactNode;
}) {
    return (
        <p className={`result-banner ${tone === "info" ? "" : tone}`} role="status">
            {children}
        </p>
    );
}

export function StatusMessage({
    tone = "success",
    children,
}: {
    tone?: "success" | "error" | "info";
    children: ReactNode;
}) {
    return <ResultBanner tone={tone}>{children}</ResultBanner>;
}