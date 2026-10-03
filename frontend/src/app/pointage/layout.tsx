"use client";

import { AreaShell, item } from "@/components/layout";

export default function PointageLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Pointage",
            items: [
                item("/pointage", "Scanner", "scanner", true),
                item("/pointage/regle", "Test de règle", "settings"),
                item("/pointage/journal", "Journal", "journal"),
            ],
        },
    ];

    const mobileItems = [
        item("/pointage", "Scanner", "scanner", true),
        item("/pointage/regle", "Règle", "settings"),
        item("/pointage/journal", "Journal", "journal"),
    ];

    return (
        <AreaShell
            allowedRoles={["administrateur", "securite"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Pointage", href: "/pointage" }]}
        >
            {children}
        </AreaShell>
    );
}
