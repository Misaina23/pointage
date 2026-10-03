"use client";

import { useState } from "react";
import { Card, Spinner } from "@/components/ui";
import { EmployeeDetails, EmployeeTable } from "@/components/personnel";
import { getEmployeeAttendance } from "@/services/api/attendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks";
import type { Employee } from "@/types/user";
import type { EmployeeAttendanceDetail } from "@/types/attendance";

export default function TeamPage() {
    const { user } = useAuth();
    const employees = useEmployees({
        department_id: user?.employee?.department_id ?? undefined,
    });
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const detail = useAsyncData<EmployeeAttendanceDetail | null>(
        (signal) =>
            selectedId === null
                ? Promise.resolve(null)
                : getEmployeeAttendance(selectedId, undefined, signal),
        [selectedId],
    );

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Responsable</p>
                    <h1>Mon équipe</h1>
                    <p className="page-subtitle">
                        {employees.total} agent(s) dans votre périmètre.
                    </p>
                </div>
            </header>

            <Card title="Agents">
                <EmployeeTable
                    employees={employees}
                    onSelect={(employee: Employee) => setSelectedId(employee.id)}
                />
            </Card>

            {selectedId !== null && detail.loading && <Spinner label="Chargement de la fiche" />}

            {!detail.loading && (
                <EmployeeDetails
                    detail={detail.data}
                    onClose={() => {
                        setSelectedId(null);
                        detail.setData(null);
                    }}
                />
            )}
        </>
    );
}