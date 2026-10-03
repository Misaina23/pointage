"use client";

import { AreaShell, item } from "@/components/layout";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Système",
            items: [item("/parametres", "Paramètres", "settings", true)],
        },
        {
            label: "Raccourcis",
            items: [
                item("/dashboard", "Tableau de bord", "dashboard"),
                item("/notifications", "Notifications", "notifications"),
            ],
        },
    ];

    const mobileItems = [
        item("/parametres", "Paramètres", "settings", true),
        item("/dashboard", "Accueil", "dashboard"),
    ];

    return (
        <AreaShell
            allowedRoles={[
                "administrateur",
                "rh",
                "direction",
                "responsable",
                "securite",
                "personnel",
            ]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Paramètres", href: "/parametres" }]}
        >
            {children}
        </AreaShell>
    );
}