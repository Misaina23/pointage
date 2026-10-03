"use client";

import { AreaShell, item } from "@/components/layout";
import { useAuth } from "@/hooks";
import { SecurityAreaLayout } from "@/components/layout/SecurityAreaLayout";

export default function PersonnelLayout({ children }: { children: React.ReactNode }) {
    const { roles } = useAuth();
    const hasSecuritySpace = roles.includes("securite");
    if (hasSecuritySpace) {
        return <SecurityAreaLayout>{children}</SecurityAreaLayout>;
    }

    const sections = [
        {
            label: "Mon espace",
            items: [
                item("/personnel", "Vue d'ensemble", "profile", true),
                item("/personnel/profil", "Mon profil", "employee"),
                item("/personnel/pointage", "Mon pointage", "attendance"),
                item("/personnel/planning", "Planning", "planning"),
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
        {
            label: "Suivi",
            items: [
                item("/personnel/notifications", "Notifications", "notifications"),
                item("/personnel/documents", "Documents", "settings"),
            ],
        },
    ];

    const mobileItems = [
        item("/personnel", "Accueil", "profile", true),
        item("/personnel/pointage", "Pointage", "attendance"),
        item("/personnel/conges", "Congés", "leaves"),
        item("/personnel/planning", "Planning", "planning"),
        item("/personnel/notifications", "Alertes", "notifications"),
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
            breadcrumb={[{ label: "Espace personnel", href: "/personnel" }]}
        >
            {children}
        </AreaShell>
    );
}