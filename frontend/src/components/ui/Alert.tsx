"use client";

import type { ReactNode } from "react";

export function Alert({
    tone = "info",
    title,
    children,
    onDismiss,
}: {
    tone?: "info" | "success" | "warning" | "error";
    title?: string;
    children: ReactNode;
    onDismiss?: () => void;
}) {
    return (
        <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
            <div className="alert-content">
                {title && <strong>{title}</strong>}
                <div>{children}</div>
            </div>
            {onDismiss && (
                <button type="button" className="alert-dismiss" onClick={onDismiss} aria-label="Fermer">
                    ×
                </button>
            )}
        </div>
    );
}

export function Spinner({ label = "Chargement" }: { label?: string }) {
    return (
        <div className="spinner-block" role="status" aria-live="polite">
            <span className="spinner" aria-hidden />
            <span>{label}…</span>
        </div>
    );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="skeleton-list" aria-hidden>
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="skeleton-row" />
            ))}
        </div>
    );
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="empty-state">
            <strong>{title}</strong>
            {description && <p>{description}</p>}
            {action}
        </div>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <Alert tone="error" title="Une erreur est survenue">
            <p>{message}</p>
            {onRetry && (
                <button type="button" className="text-action" onClick={onRetry}>
                    Réessayer
                </button>
            )}
        </Alert>
    );
}