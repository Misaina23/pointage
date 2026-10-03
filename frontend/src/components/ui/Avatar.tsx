"use client";

import type { ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
};

type AvatarProps = {
    children?: ReactNode;
    initials?: string;
    size?: Size;
    className?: string;
};

export function Avatar({ children, initials, size = "md", className = "" }: AvatarProps) {
    const content = children ?? initials ?? "?";
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--pri2)] text-[var(--pri)] font-bold ${SIZE_CLASSES[size]} ${className}`}
            aria-hidden={!!initials}
        >
            {content}
        </span>
    );
}
