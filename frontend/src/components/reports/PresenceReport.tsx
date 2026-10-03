"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui";
import { StatCard, StatGrid } from "@/components/dashboard";
import { formatMinutes, formatNumber } from "@/lib/formatters";
import type { DailyReport, DepartmentReport, MonthlyReport } from "@/types/report";

export function PresenceReport({ report }: { report: DailyReport | null }) {
    if (!report) {
        return null;
    }

    return (
        <Card title="Rapport de présence" subtitle={report.date}>
            <StatGrid>
                <StatCard label="Agents" value={report.employees} />
                <StatCard label="Présents" value={report.present} tone="green" />
                <StatCard label="Absents" value={report.absent} tone="red" />
            </StatGrid>
        </Card>
    );
}

export function LateReport({
    monthly,
    departments,
}: {
    monthly: MonthlyReport | null;
    departments: DepartmentReport | null;
}) {
    const max = useMemo(
        () => Math.max(...(departments?.late ?? []).map((row) => row.late_minutes), 1),
        [departments],
    );

    return (
        <div className="content-grid">
            <Card title="Retards du mois" subtitle={monthly?.month}>
                <StatGrid>
                    <StatCard
                        icon={undefined as never}
                        label="Journées en retard"
                        value={monthly?.late_count ?? 0}
                        tone="yellow"
                    />
                    <StatCard
                        icon={undefined as never}
                        label="Retard cumulé"
                        value={formatMinutes(monthly?.late_minutes ?? 0)}
                        tone="red"
                    />
                    <StatCard
                        icon={undefined as never}
                        label="Moyenne"
                        value={formatMinutes(monthly?.average_late_minutes ?? 0)}
                    />
                </StatGrid>
                {monthly && monthly.top_late.length > 0 && (
                    <div className="report-bars" style={{ marginTop: 16 }}>
                        {monthly.top_late.slice(0, 6).map((row) => (
                            <div key={row.employee_id} className="report-row">
                                <span className="report-link">{row.name}</span>
                                <span className="report-track">
                                    <span
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                (row.late_minutes /
                                                    Math.max(...monthly.top_late.map((item) => item.late_minutes), 1)) *
                                                    100,
                                            )}%`,
                                        }}
                                    />
                                </span>
                                <span className="chart-value">{formatNumber(row.late_count)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            <Card title="Retards par département">
                {!departments || departments.late.length === 0 ? (
                    <p className="empty-history">Aucun retard enregistré.</p>
                ) : (
                    <div className="report-bars">
                        {departments.late.map((row) => (
                            <div key={row.department} className="report-row">
                                <span className="report-link">{row.department}</span>
                                <span className="report-track">
                                    <span style={{ width: `${(row.late_minutes / max) * 100}%` }} />
                                </span>
                                <span className="chart-value">{formatNumber(row.occurrences)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

export function AbsenceReport({
    daily,
    departments,
}: {
    daily: DailyReport | null;
    departments: DepartmentReport | null;
}) {
    return (
        <Card title="Rapport d'absences">
            <StatGrid>
                <StatCard label="Absents (jour)" value={daily?.absent ?? 0} tone="red" />
                <StatCard
                    icon={undefined as never}
                    label="Absences (mois)"
                    value={formatNumber(daily?.absences ?? 0)}
                    tone="yellow"
                />
                <StatCard
                    icon={undefined as never}
                    label="Départements concernés"
                    value={departments?.absences.length ?? 0}
                />
            </StatGrid>
            {departments && departments.absences.length > 0 && (
                <div className="report-bars" style={{ marginTop: 16 }}>
                    {departments.absences.map((row) => (
                        <div key={row.department} className="report-row">
                            <span className="report-link">{row.department}</span>
                            <span className="report-track absent">
                                <span
                                    style={{
                                        width: `${(row.records / Math.max(...departments.absences.map((item) => item.records), 1)) * 100}%`,
                                    }}
                                />
                            </span>
                            <span className="chart-value">{formatNumber(row.records)}</span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

export function LeaveReport({ daily, monthly }: { daily: DailyReport | null; monthly: MonthlyReport | null }) {
    return (
        <Card title="Rapport des congés">
            <StatGrid>
                <StatCard label="Congés (jour)" value={daily?.leaves ?? 0} tone="green" />
                <StatCard label="Congés (mois)" value={monthly?.leave_count ?? 0} />
                <StatCard
                    icon={undefined as never}
                    label="Permissions (mois)"
                    value={monthly?.permission_count ?? 0}
                    tone="blue"
                />
            </StatGrid>
        </Card>
    );
}

export function HoursReport({ monthly }: { monthly: MonthlyReport | null }) {
    return (
        <Card title="Rapport des heures" subtitle={monthly?.month}>
            <StatGrid>
                <StatCard
                    icon={undefined as never}
                    label="Heures travaillées"
                    value={formatMinutes(monthly?.worked_minutes ?? 0)}
                    tone="green"
                />
                <StatCard
                    icon={undefined as never}
                    label="Heures supplémentaires"
                    value={formatMinutes(monthly?.overtime_minutes ?? 0)}
                    tone="yellow"
                />
                <StatCard
                    icon={undefined as never}
                    label="Agents actifs"
                    value={formatNumber(monthly?.employees ?? 0)}
                    tone="blue"
                />
            </StatGrid>
        </Card>
    );
}