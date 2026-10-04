"use client";

import { AreaShell, item } from "@/components/layout";

export default function HrLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Pilotage RH",
            items: [
                item("/rh", "Tableau de bord", "dashboard", true),
                item("/rh/rapports", "Rapports", "reports"),
                item("/rh/pointages", "Pointages", "attendance"),
                item("/rh/suivi-absences", "Suivi des absences", "absences"),
            ],
        },
        {
            label: "Gestion",
            items: [
                item("/rh/personnel", "Personnel", "employees"),
                item("/rh/planning", "Planning", "planning"),
            ],
        },
        {
            label: "Demandes",
            items: [
                item("/rh/conges", "Congés", "leaves"),
                item("/rh/permissions", "Permissions", "permissions"),
                item("/rh/absences", "Absences", "absences"),
            ],
        },
    ];

    const mobileItems = [
        item("/rh", "Accueil", "dashboard", true),
        item("/rh/personnel", "Personnel", "employees"),
        item("/rh/pointages", "Pointages", "attendance"),
        item("/rh/suivi-absences", "Absences", "absences"),
        item("/rh/rapports", "Rapports", "reports"),
    ];

    return (
        <AreaShell
            allowedRoles={["rh"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Espace RH", href: "/rh" }]}
        >
            {children}
        </AreaShell>
    );
}