"use client";

import { AreaShell, item } from "@/components/layout";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Responsable",
            items: [
                item("/responsable", "Tableau de bord", "dashboard", true),
                item("/responsable/equipe", "Mon équipe", "employees"),
                item("/responsable/validations", "Validations", "approvals"),
            ],
        },
        {
            label: "Suivi",
            items: [
                item("/responsable/absences", "Absences", "absences"),
                item("/responsable/planning", "Planning", "planning"),
                item("/responsable/rapports", "Rapports", "reports"),
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
        item("/responsable", "Accueil", "dashboard", true),
        item("/responsable/validations", "Validations", "approvals"),
        item("/personnel/conges", "Congés", "leaves"),
        item("/personnel/permissions", "Permissions", "permissions"),
        item("/personnel/absences", "Absences", "absences"),
    ];

    return (
        <AreaShell
            allowedRoles={["responsable"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Espace responsable", href: "/responsable" }]}
        >
            {children}
        </AreaShell>
    );
}