"use client";

import { AreaShell, item } from "@/components/layout";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    const sections = [
        {
            label: "Rapports",
            items: [
                item("/rapports", "Vue d'ensemble", "reports", true),
                item("/rapports/presence", "Présences", "presence"),
                item("/rapports/retards", "Retards", "attendance"),
                item("/rapports/absences", "Absences", "absences"),
                item("/rapports/conges", "Congés", "leaves"),
                item("/rapports/heures", "Heures", "attendance"),
                item("/rapports/export", "Export", "settings"),
            ],
        },
    ];

    const mobileItems = [
        item("/rapports", "Rapports", "reports", true),
        item("/rapports/presence", "Présence", "presence"),
        item("/rapports/retards", "Retards", "attendance"),
        item("/rapports/absences", "Absences", "absences"),
        item("/rapports/export", "Export", "settings"),
    ];

    return (
        <AreaShell
            allowedRoles={["administrateur", "rh", "direction"]}
            sections={sections}
            mobileItems={mobileItems}
            breadcrumb={[{ label: "Rapports", href: "/rapports" }]}
        >
            {children}
        </AreaShell>
    );
}