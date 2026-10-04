"use client";

import { useState } from "react";
import { Button, Card, ConfirmDialog } from "@/components/ui";
import { EmployeeForm, EmployeeInfoModal, EmployeeTable } from "@/components/personnel";
import { deactivateEmployee, deleteEmployeePermanently, updateEmployee } from "@/services/api/employees";
import { useEmployees } from "@/hooks/useEmployees";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { EMPLOYEE_STATUSES } from "@/lib/constants";
import { titleCase } from "@/lib/formatters";
import type { Employee } from "@/types/user";

export default function AdminUsersPage() {
    const { notify } = useNotifications();
    const employees = useEmployees();
    const [formOpen, setFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [pending, setPending] = useState<Employee | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
    const [deleting, setDeleting] = useState(false);

    const toggleStatus = async (employee: Employee) => {
        try {
            await updateEmployee(employee.id, {
                status: employee.status === "active" ? "inactive" : "active",
            });

            notify(
                employee.status === "active" ? "Compte désactivé." : "Compte réactivé.",
                "success",
            );
            employees.reload();
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Action impossible.", "error");
        }
    };

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h1>Utilisateurs et employés</h1>
                    <p className="page-subtitle">
                        Créez les dossiers, ajustez les statuts et rattachez l&apos;organisation.
                    </p>
                </div>
                <div className="heading-tools">
                    <Button
                        onClick={() => {
                            setEditingEmployee(null);
                            setFormOpen(true);
                        }}
                    >
                        Nouvel employé
                    </Button>
                </div>
            </header>

            <Card title="Répertoire" subtitle={`${employees.total} agent(s)`}>
                <EmployeeTable
                    employees={employees}
                    hideManagementColumns
                    onView={setViewingEmployee}
                    onEdit={(employee) => {
                        setEditingEmployee(employee);
                        setFormOpen(true);
                    }}
                    onDelete={setDeletingEmployee}
                    onStatusChange={(employee) => {
                        if (employee.status === "active") {
                            setPending(employee);
                        } else {
                            void toggleStatus(employee);
                        }
                    }}
                />
                <p className="footnote">
                    Statuts disponibles : {EMPLOYEE_STATUSES.map(titleCase).join(", ")}.
                </p>
            </Card>

            {formOpen && (
                <EmployeeForm
                    open
                    employee={editingEmployee}
                    onClose={() => {
                        setFormOpen(false);
                        setEditingEmployee(null);
                    }}
                    onSaved={employees.reload}
                />
            )}

            <EmployeeInfoModal
                employee={viewingEmployee}
                onClose={() => setViewingEmployee(null)}
            />

            <ConfirmDialog
                open={pending !== null}
                title="Désactiver l'employé"
                message={`Le dossier de ${pending?.full_name ?? ""} passera au statut inactif.`}
                confirmLabel="Désactiver"
                tone="danger"
                onCancel={() => setPending(null)}
                onConfirm={async () => {
                    if (pending) {
                        try {
                            await deactivateEmployee(pending.id);
                            notify("Dossier désactivé.", "success");
                            employees.reload();
                        } catch (caught) {
                            notify(
                                caught instanceof Error ? caught.message : "Action impossible.",
                                "error",
                            );
                        }
                    }

                    setPending(null);
                }}
            />

            <ConfirmDialog
                open={deletingEmployee !== null}
                title="Supprimer définitivement l'employé"
                message={`Cette action supprimera définitivement le dossier de ${deletingEmployee?.full_name ?? ""} ainsi que son compte associé. Les dossiers ou comptes liés à des historiques (pointages, congés, permissions, absences, badges, demandes, événements ou actions) ne peuvent pas être supprimés ; désactivez-les à la place.`}
                confirmLabel="Supprimer définitivement"
                tone="danger"
                loading={deleting}
                onCancel={() => {
                    if (!deleting) {
                        setDeletingEmployee(null);
                    }
                }}
                onConfirm={async () => {
                    if (!deletingEmployee) {
                        return;
                    }

                    setDeleting(true);
                    try {
                        await deleteEmployeePermanently(deletingEmployee.id);
                        notify("Dossier et compte supprimés définitivement.", "success");
                        setDeletingEmployee(null);
                        employees.reload();
                    } catch (caught) {
                        notify(caught instanceof Error ? caught.message : "Suppression impossible.", "error");
                    } finally {
                        setDeleting(false);
                    }
                }}
            />
        </>
    );
}
