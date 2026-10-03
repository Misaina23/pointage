"use client";

import { type ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

type ScrollRevealProps = {
    children: ReactNode;
    className?: string;
    threshold?: number;
    rootMargin?: string;
};

export function ScrollReveal({ children, className = "", threshold, rootMargin }: ScrollRevealProps) {
    const ref = useScrollReveal({ threshold, rootMargin });

    return (
        <div ref={ref} className={`rv ${className}`}>
            {children}
        </div>
    );
}
