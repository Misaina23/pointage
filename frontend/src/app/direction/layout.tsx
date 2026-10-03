"use client";

import { AreaShell, item } from "@/components/layout";

export default function DirectionLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Direction",
            items: [
                item("/direction", "Tableau de bord", "dashboard", true),
                item("/direction/validations", "Validations", "approvals"),
            ],
        },
        {
            label: "Pilotage",
            items: [
                item("/direction/personnel", "Personnel", "employees"),
                item("/direction/planning", "Planning", "planning"),
                item("/direction/rapports", "Rapports", "reports"),
            ],
        },
        {
            label: "Mes demandes",
            items: [
                item("/personnel/conges", "Congés", "leaves"),
                item("/personnel/permissions", "Permissions", "permissions"),
                item("/personnel/absences", "Absences", "absences"),
            ],
        },
    ];

    const mobileItems = [
        item("/direction", "Accueil", "dashboard", true),
        item("/direction/validations", "Validations", "approvals"),
        item("/personnel/conges", "Congés", "leaves"),
        item("/personnel/permissions", "Permissions", "permissions"),
        item("/personnel/absences", "Absences", "absences"),
    ];

    return (
        <AreaShell
            allowedRoles={["direction"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Espace direction", href: "/direction" }]}
        >
            {children}
        </AreaShell>
    );
}