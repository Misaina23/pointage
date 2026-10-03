"use client";

import { Card, SegmentedControl } from "@/components/ui";
import { AttendanceTable } from "@/components/attendance";
import { useReports } from "@/hooks";
import { useAttendance } from "@/hooks/useAttendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listEmployees } from "@/services/api/employees";
import { ReportFilters } from "@/components/reports";
import { StatCard, StatGrid } from "@/components/dashboard";
import { todayIso } from "@/lib/dates";
import type { Employee, Paginated } from "@/types/user";

export default function PresenceReportPage() {
    const reports = useReports();
    const attendance = useAttendance(reports.date);
    const employees = useAsyncData<Paginated<Employee>>(
        (signal) => listEmployees({ per_page: 200 }, signal),
        [],
    );

    const rows = (attendance.today?.attendances.data ?? []).map((row) => ({
        attendance: row,
        employee: employees.data?.data.find((item) => item.id === row.employee_id) ?? null,
    }));

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Rapport de présence</h1>
                    <p className="page-subtitle">
                        Situation journalière des agents et heures travaillées.
                    </p>
                </div>
            </header>

            <Card title="Filtres">
                <ReportFilters
                    date={reports.date}
                    month={reports.month}
                    range={reports.range}
                    onDateChange={(value) => {
                        reports.setDate(value);
                        attendance.setDate(value);
                    }}
                    onMonthChange={reports.setMonth}
                    onRangeChange={reports.setRange}
                />
            </Card>

            <StatGrid>
                <StatCard label="Présents" value={reports.daily?.present ?? 0} />
                <StatCard label="Retards" value={reports.daily?.late ?? 0} tone="yellow" />
                <StatCard label="Absents" value={reports.daily?.absent ?? 0} tone="red" />
            </StatGrid>

            <Card title="Détail">
                <div className="filter-row">
                    <SegmentedControl
                        items={[
                            { id: "day", label: "Journée" },
                            { id: "today", label: "Aujourd'hui" },
                        ]}
                        active={reports.date === todayIso() ? "today" : "day"}
                        onChange={(id) => {
                            const value = id === "today" ? todayIso() : reports.date;
                            reports.setDate(value);
                            attendance.setDate(value);
                        }}
                    />
                </div>
                {attendance.todayLoading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <AttendanceTable rows={rows} />
                )}
            </Card>
        </>
    );
}