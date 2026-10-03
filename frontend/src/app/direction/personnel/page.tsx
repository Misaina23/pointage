"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { EmployeeDetails, EmployeeTable } from "@/components/personnel";
import { getEmployeeAttendance } from "@/services/api/attendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks";
import type { Employee } from "@/types/user";
import type { EmployeeAttendanceDetail } from "@/types/attendance";

export default function DirectionPersonnelPage() {
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

    const scope =
        user?.employee?.department_id != null
            ? `Département : ${user.employee.department_id}`
            : "Périmètre complet";

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pilotage</p>
                    <h1>Personnel</h1>
                    <p className="page-subtitle">{scope} — consultation en lecture seule.</p>
                </div>
                <div className="heading-tools">
                    <Button variant="secondary" onClick={() => setSelectedId(null)} disabled={selectedId === null}>
                        Fermer la fiche
                    </Button>
                </div>
            </header>

            <Card title="Répertoire">
                <EmployeeTable
                    employees={employees}
                    onSelect={(employee: Employee) => setSelectedId(employee.id)}
                />
            </Card>

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