"use client";

import { AttendanceHistoryPage } from "@/components/attendance";

export default function HrAttendancePage() {
    return (
        <AttendanceHistoryPage
            eyebrow="Pilotage RH"
            title="Historique des présences"
            subtitle="Filtrez les présences et pointages par date, exportez les résultats et recalculez une journée."
            canRecompute
        />
    );
}
