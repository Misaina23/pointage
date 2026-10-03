"use client";

import { Card } from "@/components/ui";
import { AttendanceTable, EntryCard } from "@/components/attendance";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAttendance } from "@/hooks/useAttendance";

export default function EntriesPage() {
    const attendance = useAttendance(undefined, true, true, true);

    const entries = attendance.events.filter((event) => event.event_type === "entry");

    const attendanceRows = (attendance.today?.attendances.data ?? []).map((row) => ({
        attendance: row,
        employee: row.employee ?? null,
    }));

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Outils de l&apos;équipe</p>
                    <h1>Arrivées du jour</h1>
                    <p className="page-subtitle">
                        Arrivées enregistrées le {attendance.date}. Cette liste se met à jour automatiquement chaque jour.
                    </p>
                </div>
            </header>

            <StatGrid>
                <StatCard label="Entrées" value={attendance.today?.summary.entries ?? 0} />
                <StatCard label="Présents" value={attendance.today?.summary.present ?? 0} tone="green" />
                <StatCard
                    label="Retards"
                    value={attendance.today?.summary.late ?? 0}
                    tone="yellow"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Pointages de la journée">
                    <AttendanceTable rows={attendanceRows} />
                </Card>
                <Card title="Liste des arrivées">
                    {attendance.eventsError ? (
                        <p className="form-error" role="alert">
                            Impossible de charger les arrivées : {attendance.eventsError}
                        </p>
                    ) : attendance.eventsLoading ? (
                        <p className="empty-history">Chargement des arrivées…</p>
                    ) : (
                        <EntryCard events={entries} />
                    )}
                </Card>
            </div>
        </>
    );
}