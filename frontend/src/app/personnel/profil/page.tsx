"use client";

import { Card } from "@/components/ui";
import { EmployeeProfileCard } from "@/components/personnel";
import { AttendanceHistory } from "@/components/attendance";
import { Horloge } from "@/components/attendance";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getMyAttendance } from "@/services/api/reports";
import { useAuth } from "@/hooks";
import { listEmployees } from "@/services/api/employees";
import { todayIso } from "@/lib/dates";
import { formatDate } from "@/lib/formatters";
import { CardGrid } from "@/components/ui";
import type { Employee, Paginated } from "@/types/user";
import type { PersonalAttendance } from "@/types/report";

export default function ProfilePage() {
    const { user } = useAuth();
    const attendance = useAsyncData<PersonalAttendance>(
        (signal) => getMyAttendance(todayIso(), signal),
        [],
    );
    const employees = useAsyncData<Paginated<Employee>>(
        (signal) =>
            user?.employee
                ? listEmployees({ search: user.employee.employee_number, per_page: 1 }, signal)
                : Promise.resolve({ data: [] }),
        [user?.employee?.employee_number],
    );

    const employee = employees.data?.data[0] ?? null;

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Mon dossier</p>
                    <h1>Mon profil</h1>
                    <p className="page-subtitle">
                        Informations administratives et activité de la journée en cours.
                    </p>
                </div>
                <span className="live-pill">
                    <Horloge />
                </span>
            </header>

            <CardGrid>
                <Card title="Identité">
                    {employee ? (
                        <EmployeeProfileCard employee={employee} />
                    ) : (
                        <p className="empty-history">
                            {user?.employee
                                ? `Matricule ${user.employee.employee_number}`
                                : "Aucun dossier employé associé à ce compte."}
                        </p>
                    )}
                </Card>
                <Card title="Activité du jour" subtitle={formatDate(new Date())}>
                    {attendance.loading ? (
                        <p className="empty-history">Chargement…</p>
                    ) : (
                        <AttendanceHistory attendance={attendance.data?.data ?? null} />
                    )}
                </Card>
            </CardGrid>
        </>
    );
}