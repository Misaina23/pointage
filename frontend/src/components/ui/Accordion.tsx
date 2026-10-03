"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type AccordionItem = {
    id: string;
    title: string;
    content: ReactNode;
};

type AccordionProps = {
    items: AccordionItem[];
    activeId?: string;
    onChange?: (id: string) => void;
    className?: string;
};

export function Accordion({ items, activeId, onChange, className = "" }: AccordionProps) {
    const [internalActiveId, setInternalActiveId] = useState<string | null>(items[0]?.id ?? null);

    const isControlled = activeId !== undefined;
    const currentId = isControlled ? activeId : internalActiveId;
    const isOpen = (id: string) => currentId === id;

    const toggle = (id: string) => {
        const next = currentId === id ? null : id;
        if (!isControlled) {
            setInternalActiveId(next);
        }
        onChange?.(next ?? id);
    };

    return (
        <div className={`grid gap-2 ${className}`}>
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`rounded-2xl border border-[var(--line)] bg-[var(--card)] transition-colors ${isOpen(item.id) ? "border-[var(--pri)]" : ""}`}
                >
                    <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sm text-[var(--ink)]"
                        aria-expanded={isOpen(item.id)}
                    >
                        <span>{item.title}</span>
                        <span
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--pri2)] text-[var(--pri)] text-xs transition-transform"
                            style={{ transform: isOpen(item.id) ? "rotate(45deg)" : "rotate(0deg)" }}
                            aria-hidden
                        >
                            +
                        </span>
                    </button>
                    <div
                        className="overflow-hidden text-sm text-[var(--mut)] transition-all"
                        style={{
                            maxHeight: isOpen(item.id) ? "320px" : "0",
                            marginTop: isOpen(item.id) ? 12 : 0,
                            marginBottom: isOpen(item.id) ? 16 : 0,
                            paddingLeft: 20,
                            paddingRight: 20,
                        }}
                    >
                        {item.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
