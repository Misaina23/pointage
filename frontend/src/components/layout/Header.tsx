"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { homePathFor } from "@/lib/roles";
import { Breadcrumb } from "./Breadcrumb";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Spinner } from "@/components/ui";
import type { RoleSlug } from "@/types/auth";
import type { NavItem } from "./nav";

type AreaShellProps = {
    sections: { label: string; items: NavItem[] }[];
    mobileItems: NavItem[];
    breadcrumb?: { href?: string; label: string }[];
    children: React.ReactNode;
    allowedRoles?: readonly RoleSlug[];
};

function humanizeSegment(segment: string): string {
    return segment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function deriveBreadcrumb(pathname: string): { href?: string; label: string }[] {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => ({
        href: `/${segments.slice(0, index + 1).join("/")}`,
        label: humanizeSegment(segment),
    }));
}

export function AreaShell({
    sections,
    mobileItems,
    breadcrumb,
    children,
    allowedRoles,
}: AreaShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { status, roles } = useAuth();
    const hasAccess = !allowedRoles || allowedRoles.some((role) => roles.includes(role));
    const homePath = homePathFor(roles);

    const trail = breadcrumb ?? deriveBreadcrumb(pathname);

    useEffect(() => {
        if (status === "anonymous") {
            router.replace("/login");
        } else if (status === "authenticated" && !hasAccess) {
            router.replace(homePath);
        }
    }, [hasAccess, homePath, status, router]);

    if (status === "loading" || (status === "authenticated" && !hasAccess)) {
        return (
            <div className="app-shell">
                <Topbar />
                <main className="main-content" aria-live="polite">
                    <Spinner
                        label={
                            status === "loading"
                                ? "Chargement de la session"
                                : "Redirection vers votre espace"
                        }
                    />
                </main>
            </div>
        );
    }

    if (status === "anonymous") {
        return null;
    }

    return (
        <div className="app-shell">
            <Topbar>
                <a className="login-button" href={homePath} onClick={(event) => {
                    event.preventDefault();
                    router.push(homePath);
                }}>
                    Mon espace
                </a>
            </Topbar>
            <div className="workspace">
                <Sidebar sections={sections} />
                <main className="main-content">
                    <Breadcrumb items={trail} />
                    {children}
                </main>
            </div>
            <MobileNav items={mobileItems} />
        </div>
    );
}