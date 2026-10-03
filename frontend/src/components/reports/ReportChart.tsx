"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui";
import { formatNumber } from "@/lib/formatters";
import type { DepartmentReport, MonthlyReport } from "@/types/report";

type Row = { label: string; value: number };

export function ReportChart({
    title,
    rows,
}: {
    title: string;
    rows: Row[];
}) {
    const max = useMemo(() => Math.max(...rows.map((row) => row.value), 1), [rows]);

    return (
        <Card title={title}>
            {rows.length === 0 ? (
                <p className="empty-history">Aucune donnée.</p>
            ) : (
                <div className="report-bars">
                    {rows.map((row) => (
                        <div key={row.label} className="report-row">
                            <span className="report-link">{row.label}</span>
                            <span className="report-track">
                                <span style={{ width: `${(row.value / max) * 100}%` }} />
                            </span>
                            <span className="chart-value">{formatNumber(row.value)}</span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

export function ReportFilters({
    date,
    month,
    range,
    onDateChange,
    onMonthChange,
    onRangeChange,
    children,
}: {
    date: string;
    month: string;
    range: { from: string; to: string };
    onDateChange: (value: string) => void;
    onMonthChange: (value: string) => void;
    onRangeChange: (value: { from: string; to: string }) => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="filter-row">
            <label className="field-label">
                Date
                <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(event) => onDateChange(event.target.value)}
                />
            </label>
            <label className="field-label">
                Mois
                <input
                    type="month"
                    className="form-control"
                    value={month}
                    onChange={(event) => onMonthChange(event.target.value)}
                />
            </label>
            <label className="field-label">
                Du
                <input
                    type="date"
                    className="form-control"
                    value={range.from}
                    onChange={(event) => onRangeChange({ ...range, from: event.target.value })}
                />
            </label>
            <label className="field-label">
                Au
                <input
                    type="date"
                    className="form-control"
                    value={range.to}
                    onChange={(event) => onRangeChange({ ...range, to: event.target.value })}
                />
            </label>
            {children}
        </div>
    );
}

export function MonthlySummary({ monthly }: { monthly: MonthlyReport | null }) {
    if (!monthly) {
        return null;
    }

    return (
        <p className="footnote">
            {monthly.employees} agent(s) · {monthly.late_count} journée(s) de retard ·{" "}
            {monthly.absence_count} absence(s) · {monthly.leave_count} congé(s).
        </p>
    );
}

export function DepartmentBreakdown({ departments }: { departments: DepartmentReport | null }) {
    if (!departments) {
        return null;
    }

    return (
        <p className="footnote">
            Période du {departments.from} au {departments.to} ·{" "}
            {departments.late.length} département(s) concernés par des retards.
        </p>
    );
}