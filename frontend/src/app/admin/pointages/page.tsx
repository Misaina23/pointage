"use client";

import { AttendanceHistoryPage } from "@/components/attendance";

export default function AdminPointagesPage() {
    return (
        <AttendanceHistoryPage
            eyebrow="Contrôle des présences"
            title="Historique des pointages"
            subtitle="Consultez les arrivées, départs, pauses et statuts dans un seul tableau, puis exportez ou recalculez la journée."
            canRecompute
        />
    );
}
