"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: ReactNode;
    fullWidth?: boolean;
};

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    fullWidth = false,
    className = "",
    children,
    disabled,
    type = "button",
    ...rest
}: ButtonProps) {
    const classes = [
        "button-primary",
        variant === "secondary" ? "button-secondary" : "",
        variant === "ghost" ? "button-ghost" : "",
        variant === "danger" ? "button-danger" : "",
        size === "sm" ? "button-sm" : "",
        size === "lg" ? "button-lg" : "",
        fullWidth ? "w-full justify-center" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? <span className="spinner" aria-hidden /> : icon}
            {children}
        </button>
    );
}