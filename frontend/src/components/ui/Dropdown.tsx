"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type DropdownProps = {
    trigger: ReactNode;
    children: ReactNode;
    className?: string;
    align?: "left" | "right";
};

export function Dropdown({ trigger, children, className = "", align = "right" }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onOutsideClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener("mousedown", onOutsideClick);
        }
        return () => document.removeEventListener("mousedown", onOutsideClick);
    }, [open]);

    return (
        <div ref={ref} className={`relative inline-flex ${className}`}>
            <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex">
                {trigger}
            </button>
            {open && (
                <div
                    className={`absolute top-[calc(100%+8px)] z-40 min-w-[200px] rounded-2xl border border-[var(--line)] bg-[var(--card)] p-1.5 shadow-[var(--sh-lg)] ${align === "right" ? "right-0" : "left-0"}`}
                    role="menu"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

type DropdownItemProps = {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    href?: string;
};

export function DropdownItem({ children, onClick, className = "", href }: DropdownItemProps) {
    const base = "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--ink)] transition-colors";
    const hover = "hover:bg-[var(--pri2)] hover:text-[var(--pri)]";

    if (href) {
        return (
            <a href={href} className={`${base} ${hover} ${className}`} role="menuitem">
                {children}
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={`${base} ${hover} ${className}`} role="menuitem">
            {children}
        </button>
    );
}
