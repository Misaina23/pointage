"use client";

import { Card, SegmentedControl } from "@/components/ui";
import { AttendanceTable, ExitCard } from "@/components/attendance";
import { StatCard, StatGrid } from "@/components/dashboard";
import { useAttendance } from "@/hooks/useAttendance";
import { useState } from "react";

export default function ExitsPage() {
    const attendance = useAttendance(undefined, true);
    const [filter, setFilter] = useState<"all" | "missing">("all");

    const rows = (attendance.today?.attendances.data ?? [])
        .map((row) => ({
            attendance: row,
            employee: row.employee ?? null,
        }))
        .filter((row) => (filter === "missing" ? !row.attendance.last_exit : true));

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Journaux</p>
                    <h1>Sorties</h1>
                    <p className="page-subtitle">
                        Pointages de sortie et agents encore présents.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "all", label: "Tous" },
                            { id: "missing", label: "Sans sortie" },
                        ]}
                        active={filter}
                        onChange={(id) => setFilter(id as "all" | "missing")}
                    />
                </div>
            </header>

            <StatGrid>
                <StatCard label="Sorties" value={attendance.today?.summary.exits ?? 0} tone="blue" />
                <StatCard
                    label="Encore présents"
                    value={rows.filter((row) => !row.attendance.last_exit).length}
                    tone="yellow"
                />
                <StatCard
                    label="Absents"
                    value={attendance.today?.summary.absent ?? 0}
                    tone="red"
                />
            </StatGrid>

            <div className="content-grid" style={{ marginTop: 18 }}>
                <Card title="Pointages de sortie">
                    <AttendanceTable rows={rows} />
                </Card>
                <Card title="Flux temps réel">
                    <ExitCard events={attendance.events} />
                </Card>
            </div>
        </>
    );
}