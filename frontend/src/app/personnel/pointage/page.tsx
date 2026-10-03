"use client";

import { CalendarDays } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { AttendanceHistory, AttendanceStatus, Horloge } from "@/components/attendance";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getMyAttendance } from "@/services/api/reports";
import { recomputeAttendance } from "@/services/api/attendance";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { addDays, todayIso } from "@/lib/dates";
import { formatMinutes } from "@/lib/formatters";
import type { PersonalAttendance } from "@/types/report";
import type { RecomputeResult } from "@/types/attendance";

export default function MyAttendancePage() {
    const { notify } = useNotifications();
    const date = todayIso();
    const attendance = useAsyncData<PersonalAttendance>(
        (signal) => getMyAttendance(date, signal),
        [date],
    );
    const recomputed = useAsyncData<RecomputeResult | null>(
        () => Promise.resolve(null),
        [],
    );

    const data = attendance.data?.data ?? null;

    const refresh = async () => {
        try {
            await recomputeAttendance({ date });
            attendance.reload();
            notify("Pointage recalculé.", "success");
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Recalcul impossible.", "error");
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Mon espace</p>
                    <h1>Mon pointage</h1>
                    <p className="page-subtitle">
                        Entrées, sorties et temps de travail calculés selon votre horaire.
                    </p>
                </div>
                <span className="live-pill">
                    <Horloge />
                </span>
            </header>

            <StatGrid>
                <StatCard
                    icon={CalendarDays}
                    label="Statut"
                    value={data ? data.status : "—"}
                    note={data ? `${date}` : undefined}
                />
                <StatCard
                    icon={CalendarDays}
                    label="Temps travaillé"
                    value={formatMinutes(data?.worked_minutes ?? 0)}
                    tone="blue"
                />
                <StatCard
                    icon={CalendarDays}
                    label="Retard"
                    value={formatMinutes(data?.late_minutes ?? 0)}
                    tone="red"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card
                    title="Journée"
                    subtitle={data ? `${data.first_entry ?? "—"} → ${data.last_exit ?? "—"}` : undefined}
                    actions={
                        <Button variant="secondary" size="sm" onClick={refresh} loading={recomputed.loading}>
                            Recalculer
                        </Button>
                    }
                >
                    {data && <AttendanceStatus status={data.status} />}
                    <AttendanceHistory attendance={data} />
                </Card>
                <Card title="Jours à venir" subtitle="Les pointages sont recalculés à la demande.">
                    <div className="history-list">
                        {[1, 2, 3].map((offset) => (
                            <div key={offset} className="history-row">
                                <span className="history-avatar" aria-hidden>
                                    {offset}
                                </span>
                                <span>
                                    <span className="history-name">{addDays(date, offset)}</span>
                                    <span className="history-code">À venir</span>
                                </span>
                                <span className="history-status valid">—</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    );
}