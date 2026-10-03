"use client";

import { AreaShell, item } from "@/components/layout";

export default function PlanningLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Organisation",
            items: [
                item("/planning", "Planning général", "planning", true),
                item("/planning/creer", "Créer un événement", "approvals"),
            ],
        },
        {
            label: "Mon espace",
            items: [
                item("/personnel/planning", "Mon planning", "profile"),
                item("/personnel", "Dossier", "employee"),
            ],
        },
    ];

    const mobileItems = [
        item("/planning", "Planning", "planning", true),
        item("/planning/creer", "Créer", "approvals"),
        item("/personnel", "Dossier", "employee"),
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
            breadcrumb={[{ label: "Planning", href: "/planning" }]}
        >
            {children}
        </AreaShell>
    );
}