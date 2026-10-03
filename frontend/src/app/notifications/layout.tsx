"use client";

import { AreaShell, item } from "@/components/layout";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Communication",
            items: [
                item("/notifications", "Toutes", "notifications", true),
                item("/personnel", "Mon espace", "profile"),
                item("/planning", "Planning", "planning"),
            ],
        },
    ];

    const mobileItems = [
        item("/notifications", "Alertes", "notifications", true),
        item("/personnel", "Dossier", "profile"),
        item("/planning", "Planning", "planning"),
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
            breadcrumb={[{ label: "Notifications", href: "/notifications" }]}
        >
            {children}
        </AreaShell>
    );
}