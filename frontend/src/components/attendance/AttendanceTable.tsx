"use client";

import { DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { formatMinutes } from "@/lib/formatters";
import { AttendanceStatus, LateBadge } from "./AttendanceStatus";
import type { Attendance } from "@/types/attendance";
import type { Employee } from "@/types/user";

type Row = {
    attendance: Attendance;
    employee?: Pick<Employee, "first_name" | "last_name" | "full_name" | "employee_number"> | null;
};

function formatAttendanceTime(value: string | null): string {
    return value ? value.slice(0, 5) : "—";
}

export function AttendanceTable({
    rows,
    showEmployee = true,
}: {
    rows: Row[];
    showEmployee?: boolean;
}) {
    const columns: Column<Row>[] = [
        ...(showEmployee
            ? [
                  {
                      key: "employee",
                      header: "Employé",
                      render: (row: Row) =>
                          row.employee ? (
                              <div className="table-person">
                                  <span className="employee-avatar" aria-hidden>
                                      {row.employee.first_name.charAt(0)}
                                      {row.employee.last_name.charAt(0)}
                                  </span>
                                  <span>
                                      <strong>{row.employee.full_name}</strong>
                                      <small>{row.employee.employee_number}</small>
                                  </span>
                              </div>
                          ) : (
                              `#${row.attendance.employee_id}`
                          ),
                  } satisfies Column<Row>,
              ]
            : []),
        {
            key: "entry",
            header: "Arrivée",
            render: (row: Row) => formatAttendanceTime(row.attendance.first_entry),
        },
        {
            key: "exit",
            header: "Départ",
            render: (row: Row) => formatAttendanceTime(row.attendance.last_exit),
        },
        {
            key: "break",
            header: "Pause",
            render: (row: Row) => {
                const start = row.attendance.break_starts_at;
                const end = row.attendance.break_ends_at;

                return start && end ? `${start}–${end}` : "—";
            },
        },
        {
            key: "worked",
            header: "Travaillé",
            align: "right",
            render: (row: Row) =>
                row.attendance.first_entry === null &&
                row.attendance.last_exit === null &&
                row.attendance.worked_minutes === 0
                    ? "—"
                    : formatMinutes(row.attendance.worked_minutes),
        },
        {
            key: "status",
            header: "Statut",
            render: (row: Row) => (
                <span className="table-actions">
                    <AttendanceStatus status={row.attendance.status} />
                    {row.attendance.status === "late" && (
                        <LateBadge minutes={row.attendance.late_minutes} />
                    )}
                </span>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.attendance.id}
            emptyLabel="Aucune présence pour cette période."
        />
    );
}