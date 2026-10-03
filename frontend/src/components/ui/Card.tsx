"use client";

import type { ReactNode } from "react";

type CardProps = {
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
    children: ReactNode;
};

export function Card({ title, subtitle, actions, className = "", children }: CardProps) {
    return (
        <section className={`panel ${className}`}>
            {(title || actions) && (
                <div className="panel-heading">
                    <div>
                        {title && <h2>{title}</h2>}
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    {actions}
                </div>
            )}
            {children}
        </section>
    );
}

export function CardGrid({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`dashboard-grid ${className}`}>{children}</div>;
}