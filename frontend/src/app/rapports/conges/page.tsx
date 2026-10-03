"use client";

import { useState } from "react";
import { Card, SegmentedControl } from "@/components/ui";
import { LeaveReport, ReportFilters } from "@/components/reports";
import { LeaveTable } from "@/components/leaves";
import { useReports } from "@/hooks";
import { useLeaves } from "@/hooks/useLeaves";
import { REQUEST_STATUSES } from "@/lib/constants";
import { formatDays, formatNumber } from "@/lib/formatters";
import type { RequestState } from "@/types/approval";

export default function LeaveReportPage() {
    const reports = useReports();
    const leaves = useLeaves();
    const [view, setView] = useState<"charts" | "table">("charts");

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Rapports</p>
                    <h1>Rapport des congés</h1>
                    <p className="page-subtitle">
                        Demandes de congé et volumes consommés.
                    </p>
                </div>
                <div className="heading-tools">
                    <SegmentedControl
                        items={[
                            { id: "charts", label: "Synthèse" },
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
                <>
                    <div className="content-grid" style={{ marginTop: 18 }}>
                        <LeaveReport daily={reports.daily} monthly={reports.monthly} />
                        <Card title="Volumes">
                            <div className="request-list">
                                <div className="quick-row">
                                    <span className="request-main">
                                        <span className="request-title-line">Congés (mois)</span>
                                    </span>
                                    <span className="chart-value">
                                        {formatNumber(reports.monthly?.leave_count ?? 0)}
                                    </span>
                                </div>
                                <div className="quick-row">
                                    <span className="request-main">
                                        <span className="request-title-line">Permissions (mois)</span>
                                    </span>
                                    <span className="chart-value">
                                        {formatNumber(reports.monthly?.permission_count ?? 0)}
                                    </span>
                                </div>
                                <div className="quick-row">
                                    <span className="request-main">
                                        <span className="request-title-line">Absences (mois)</span>
                                    </span>
                                    <span className="chart-value">
                                        {formatNumber(reports.monthly?.absence_records ?? 0)}
                                    </span>
                                </div>
                                <div className="quick-row">
                                    <span className="request-main">
                                        <span className="request-title-line">Volume total</span>
                                    </span>
                                    <span className="chart-value">
                                        {formatDays(
                                            (reports.monthly?.leave_count ?? 0) +
                                                (reports.monthly?.permission_count ?? 0) +
                                                (reports.monthly?.absence_records ?? 0),
                                        )}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            ) : (
                <Card title="Demandes">
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
                                              ? "Approuvées"
                                              : status === "rejected"
                                                ? "Refusées"
                                                : "Annulées",
                                })),
                            ]}
                            active={leaves.status}
                            onChange={(id) => leaves.setStatus(id as RequestState | "")}
                        />
                    </div>
                    {leaves.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <LeaveTable leaves={leaves.leaves} />
                    )}
                </Card>
            )}
        </>
    );
}