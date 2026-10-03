"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "./nav";
import type { NavItem } from "./nav";

export function MobileNav({ items }: { items: NavItem[] }) {
    const pathname = usePathname();

    return (
        <nav
            className="mobile-nav"
            aria-label="Navigation mobile"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href, item.exact);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={active ? "active" : ""}
                        aria-current={active ? "page" : undefined}
                    >
                        <Icon size={16} aria-hidden />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}