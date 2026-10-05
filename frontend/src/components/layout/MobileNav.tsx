"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isActivePath } from "./nav";
import type { NavItem } from "./nav";

type MobileNavProps = {
    items: NavItem[];
    sections: { label: string; items: NavItem[] }[];
};

export function MobileNav({ items, sections }: MobileNavProps) {
    const pathname = usePathname();
    const [openForPath, setOpenForPath] = useState<string | null>(null);
    const menuOpen = openForPath === pathname;
    const quickItems = items.slice(0, 5);

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenForPath(null);
            }
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [menuOpen]);

    return (
        <>
            <button
                type="button"
                className={`mobile-menu-button${menuOpen ? " is-open" : ""}`}
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu-drawer"
                onClick={() => setOpenForPath(menuOpen ? null : pathname)}
            >
                <span />
                <span />
                <span />
            </button>
            {menuOpen && (
                <div className="mobile-menu-layer">
                    <button
                        type="button"
                        className="mobile-menu-backdrop"
                        aria-label="Fermer le menu"
                        onClick={() => setOpenForPath(null)}
                    />
                    <aside id="mobile-menu-drawer" className="mobile-menu-drawer">
                        <nav aria-label="Navigation mobile complète">
                            {sections.map((section) => (
                                <div className="mobile-menu-section" key={section.label}>
                                    <p className="side-label">{section.label}</p>
                                    <ul className="nav-list">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActivePath(
                                                pathname,
                                                item.href,
                                                item.exact,
                                            );

                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        className={`nav-link ${active ? "active" : ""}`}
                                                        aria-current={active ? "page" : undefined}
                                                        onClick={() => setOpenForPath(null)}
                                                    >
                                                        <span className="nav-icon">
                                                            <Icon size={17} aria-hidden />
                                                        </span>
                                                        <span className="mobile-menu-label">
                                                            {item.label}
                                                        </span>
                                                        {typeof item.badge === "number" &&
                                                            item.badge > 0 && (
                                                                <span className="nav-count">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}
            <nav
                className="mobile-nav"
                aria-label="Raccourcis mobiles"
                style={{
                    gridTemplateColumns: `repeat(${quickItems.length}, minmax(0, 1fr))`,
                }}
            >
                {quickItems.map((item) => {
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
        </>
    );
}