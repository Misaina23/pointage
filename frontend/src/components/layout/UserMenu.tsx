"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { initials } from "@/lib/formatters";
import { primaryRole, roleLabel } from "@/lib/roles";

export function UserMenu() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", onClick);

        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    if (!user) {
        return null;
    }

    const currentRole = primaryRole(user.roles);

    return (
        <div className="user-menu" ref={containerRef}>
            <button
                type="button"
                className="user-chip"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="user-avatar">{initials(user.name)}</span>
                <span className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{roleLabel(currentRole)}</span>
                </span>
            </button>
            {open && (
                <div className="user-dropdown" role="menu">
                    <Link href="/personnel/profil" role="menuitem" onClick={() => setOpen(false)}>
                        <User size={14} aria-hidden /> Profil
                    </Link>
                    <Link href="/parametres" role="menuitem" onClick={() => setOpen(false)}>
                        <Settings size={14} aria-hidden /> Paramètres
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                            setOpen(false);
                            await logout();
                            router.replace("/login");
                        }}
                    >
                        <LogOut size={14} aria-hidden /> Déconnexion
                    </button>
                </div>
            )}
        </div>
    );
}