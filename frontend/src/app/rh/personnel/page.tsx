"use client";

import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import { EmployeeDetails, EmployeeForm, EmployeeTable } from "@/components/personnel";
import { getEmployeeAttendance } from "@/services/api/attendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/user";
import type { EmployeeAttendanceDetail } from "@/types/attendance";

export default function HrPersonnelPage() {
    const employees = useEmployees();
    const [formOpen, setFormOpen] = useState(false);
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
                    <p className="eyebrow">Gestion</p>
                    <h1>Personnel</h1>
                    <p className="page-subtitle">
                        {employees.total} agent(s) sur le périmètre autorisé.
                    </p>
                </div>
                <div className="heading-tools">
                    <Button onClick={() => setFormOpen(true)}>Nouvel employé</Button>
                </div>
            </header>

            <Card title="Répertoire">
                <EmployeeTable
                    employees={employees}
                    onSelect={(employee: Employee) => setSelectedId(employee.id)}
                />
            </Card>

            {formOpen && (
                <EmployeeForm
                    open
                    onClose={() => setFormOpen(false)}
                    onSaved={employees.reload}
                />
            )}

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