"use client";

import { AreaShell, item } from "@/components/layout";

export function SecurityAreaLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Outils de l'équipe",
            items: [
                item("/securite", "Vue d'ensemble", "dashboard", true),
                item("/securite/scanner", "Scanner un badge", "scanner"),
                item("/securite/presence", "Présences du jour", "presence"),
                item("/securite/entrees", "Arrivées du jour", "entries"),
                item("/securite/sorties", "Sorties du jour", "exits"),
            ],
        },
        {
            label: "Mon dossier",
            items: [
                item("/personnel/profil", "Informations personnelles", "profile"),
                item("/personnel/conges", "Mes congés", "leaves"),
                item("/personnel/permissions", "Mes permissions", "permissions"),
            ],
        },
        {
            label: "Organisation",
            items: [item("/securite/planning", "Planning", "planning")],
        },
    ];

    const mobileItems = [
        item("/securite", "Accueil", "dashboard", true),
        item("/securite/scanner", "Scanner", "scanner"),
        item("/securite/entrees", "Arrivées", "entries"),
        item("/securite/presence", "Présence", "presence"),
        item("/personnel/profil", "Mon profil", "profile"),
    ];

    return (
        <AreaShell
            allowedRoles={["securite"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Mon espace sécurité", href: "/securite" }]}
        >
            {children}
        </AreaShell>
    );
}
