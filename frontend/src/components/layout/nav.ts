"use client";

import type { LucideIcon } from "lucide-react";

export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
    exact?: boolean;
};

export type NavSection = {
    label: string;
    items: NavItem[];
};

export function isActivePath(pathname: string, href: string, exact = false): boolean {
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}