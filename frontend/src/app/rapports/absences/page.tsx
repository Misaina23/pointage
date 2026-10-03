"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { AbsenceReport, ReportChart, ReportFilters } from "@/components/reports";
import { AbsenceTable } from "@/components/absences";
import { useReports } from "@/hooks";
import { useAbsences } from "@/hooks/useAbsences";
import { REQUEST_STATUSES } from "@/lib/constants";
import type { RequestState } from "@/types/approval";

export default function AbsenceReportPage() {
    const reports = useReports();
    const absences = useAbsences();
    const [view, setView] = useState<"charts" | "table">("charts");

    const rows = (reports.departments?.absences ?? []).map((row) => ({
        label: row.department,
        value: row.records,
    }));

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Rapport des absences</h1>
                    <p className="page-subtitle">
                        Absences déclarées et répartition par département.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "charts", label: "Graphiques" },
                            { id: "table", label: "Tableau" },
                        ]}
                        active={view}
                        onChange={(id) => setView(id as "charts" | "table")}
                    />
                </div>
            </header>

            <Card title="Filtres">
                <ReportFilters
                    date={reports.date}
                    month={reports.month}
                    range={reports.range}
                    onDateChange={reports.setDate}
                    onMonthChange={reports.setMonth}
                    onRangeChange={reports.setRange}
                />
            </Card>

            {view === "charts" ? (
                <div className="content-grid" style={{ marginTop: 18 }}>
                    <AbsenceReport daily={reports.daily} departments={reports.departments} />
                    <ReportChart title="Absences par département" rows={rows} />
                </div>
            ) : (
                <Card title="Absences déclarées">
                    <div className="filter-row">
                        <SegmentedControl
                            items={[
                                { id: "", label: "Toutes" },
                                ...REQUEST_STATUSES.map((status) => ({
                                    id: status,
                                    label:
                                        status === "pending"
                                            ? "En attente"
                                            : status === "approved"
                                              ? "Validées"
                                              : status === "rejected"
                                                ? "Refusées"
                                                : "Annulées",
                                })),
                            ]}
                            active={absences.status}
                            onChange={(id) => absences.setStatus(id as RequestState | "")}
                        />
                    </div>
                    {absences.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <AbsenceTable absences={absences.absences} />
                    )}
                </Card>
            )}
        </>
    );
}