"use client";

import { AreaShell, item } from "@/components/layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Administration",
            items: [
                item("/admin", "Tableau de bord", "dashboard", true),
                item("/admin/utilisateurs", "Utilisateurs", "employees"),
                item("/admin/roles", "Rôles", "roles"),
                item("/admin/permissions", "Permissions", "permissions"),
            ],
        },
        {
            label: "Organisation",
            items: [
                item("/admin/directions", "Directions", "organization"),
                item("/admin/departements", "Départements", "organization"),
                item("/admin/contrats", "Contrats", "contracts"),
            ],
        },
        {
            label: "Paramétrage",
            items: [
                item("/admin/horaires", "Horaires", "planning"),
                item("/admin/jours-feries", "Jours fériés", "holidays"),
                item("/admin/badges", "Badges", "badges"),
                item("/admin/appareils", "Appareils", "devices"),
                item("/admin/pointages", "Pointages", "attendance"),
                item("/admin/suivi-absences", "Congés et absences", "absences"),
                item("/admin/journal", "Journal", "journal"),
            ],
        },
    ];

    const mobileItems = [
        item("/admin", "Accueil", "dashboard", true),
        item("/admin/utilisateurs", "Utilisateurs", "employees"),
        item("/admin/directions", "Org.", "organization"),
        item("/admin/pointages", "Pointages", "attendance"),
        item("/admin/suivi-absences", "Absences", "absences"),
        item("/admin/badges", "Badges", "badges"),
        item("/admin/journal", "Journal", "journal"),
    ];

    return (
        <AreaShell
            allowedRoles={["administrateur"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Administration", href: "/admin" }]}
        >
            {children}
        </AreaShell>
    );
}