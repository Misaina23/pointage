"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({
    items,
}: {
    items: { href?: string; label: string }[];
}) {
    const pathname = usePathname();

    if (items.length === 0) {
        return null;
    }

    return (
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <span key={`${item.label}-${index}`} className="breadcrumb-item">
                        {item.href && !isLast ? (
                            <Link href={item.href}>{item.label}</Link>
                        ) : (
                            <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                        )}
                        {!isLast && <ChevronRight size={12} aria-hidden />}
                    </span>
                );
            })}
            <span className="sr-only">{pathname}</span>
        </nav>
    );
}