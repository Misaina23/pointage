"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath } from "./nav";
import type { NavItem } from "./nav";

export function Sidebar({ sections }: { sections: { label: string; items: NavItem[] }[] }) {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <nav aria-label="Navigation principale">
                {sections.map((section) => (
                    <div key={section.label} style={{ marginBottom: 22 }}>
                        <p className="side-label">{section.label}</p>
                        <ul className="nav-list">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActivePath(pathname, item.href, item.exact);

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`nav-link ${active ? "active" : ""}`}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            <span className="nav-icon">
                                                <Icon size={17} aria-hidden />
                                            </span>
                                            <span style={{ flex: 1 }}>{item.label}</span>
                                            {typeof item.badge === "number" && item.badge > 0 && (
                                                <span className="nav-count">{item.badge}</span>
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
    );
}