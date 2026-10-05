"use client";

import Image from "next/image";
import { formatLongDate } from "@/lib/formatters";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { NavItem } from "./nav";
import { MobileNav } from "./MobileNav";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

type TopbarProps = {
    children?: React.ReactNode;
    mobileItems?: NavItem[];
    sections?: { label: string; items: NavItem[] }[];
};

export function Topbar({ children, mobileItems, sections }: TopbarProps) {
    const online = useOnlineStatus();

    return (
        <header className="topbar">
            <div className="topbar-start">
                {sections && mobileItems && (
                    <MobileNav items={mobileItems} sections={sections} />
                )}
                <div className="brand-lockup">
                    <span className="brand-logo-wrap">
                        <Image
                            className="brand-logo"
                            src="/mesupres-logo.png"
                            alt="Ministère de l'Enseignement Supérieur et de la Recherche Scientifique"
                            width={372}
                            height={240}
                            unoptimized
                            priority
                        />
                    </span>
                </div>
            </div>
            <div className="topbar-actions">
                {children}
                <span className="country-label">
                    <span className="flag" aria-hidden>
                        <span className="flag-white" />
                        <span className="flag-right">
                            <span className="flag-red" />
                            <span className="flag-green" />
                        </span>
                    </span>
                    Madagascar
                </span>
                <span
                    className={`connection-pill ${online ? "connected" : "demo"}`}
                    title={online ? "Connecté à l'API" : "Mode hors ligne"}
                >
                    <span className="connection-dot" aria-hidden />
                    {online ? "En ligne" : "Hors ligne"}
                </span>
                <span className="header-date">{formatLongDate(new Date())}</span>
                <NotificationBell />
                <UserMenu />
            </div>
        </header>
    );
}