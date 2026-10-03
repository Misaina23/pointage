"use client";

import { useMemo, useState } from "react";
import { Button, DataTable, Pagination } from "@/components/ui";
import type { Column } from "@/components/ui";
import { SearchInput, Select } from "@/components/forms";
import { formatDate } from "@/lib/formatters";
import { listDepartments } from "@/services/api/departments";
import { listDirections } from "@/services/api/directions";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { EmployeeDirectoryState } from "@/hooks/useEmployees";
import { EmployeeAvatar, EmployeeStatus } from "./EmployeeCard";
import type { Department, Direction } from "@/types/organization";
import type { Employee } from "@/types/user";

export function EmployeeTable({
    employees,
    onSelect,
    onEdit,
    onStatusChange,
}: {
    employees: EmployeeDirectoryState;
    onSelect?: (employee: Employee) => void;
    onEdit?: (employee: Employee) => void;
    onStatusChange?: (employee: Employee) => void;
}) {
    const [directionId, setDirectionId] = useState("");

    const directions = useAsyncData<Direction[]>((signal) => listDirections(undefined, signal), []);
    const departments = useAsyncData<Department[]>(
        (signal) => listDepartments(directionId ? Number(directionId) : undefined, signal),
        [directionId],
    );

    const columns = useMemo<Column<Employee>[]>(
        () => [
            {
                key: "name",
                header: "Employé",
                render: (employee) => (
                    <div className="table-person">
                        <EmployeeAvatar employee={employee} size="sm" />
                        <span>
                            <strong>{employee.full_name}</strong>
                            <small>{employee.employee_number}</small>
                        </span>
                    </div>
                ),
            },
            {
                key: "department",
                header: "Direction / département",
                render: (employee) => employee.department?.name ?? employee.direction?.name ?? "—",
            },
            {
                key: "position",
                header: "Poste",
                render: (employee) => employee.position_title ?? "—",
            },
            {
                key: "manager",
                header: "Responsable direct",
                render: (employee) => employee.manager?.full_name ?? "—",
            },
            {
                key: "contact",
                header: "Contact",
                render: (employee) => (
                    <span className="muted-cell">
                        {employee.email ?? "—"}
                        <br />
                        {employee.phone ?? ""}
                    </span>
                ),
            },
            {
                key: "hire",
                header: "Recrutement",
                render: (employee) => formatDate(employee.hire_date),
            },
            {
                key: "status",
                header: "Statut",
                render: (employee) => <EmployeeStatus employee={employee} />,
            },
            ...(onEdit || onStatusChange
                ? [
                      {
                          key: "actions",
                          header: "Actions",
                          render: (employee: Employee) => (
                              <div className="table-actions">
                                  {onEdit && (
                                      <button
                                          type="button"
                                          className="text-action"
                                          onClick={(event) => {
                                              event.stopPropagation();
                                              onEdit(employee);
                                          }}
                                      >
                                          Modifier
                                      </button>
                                  )}
                                  {onStatusChange && (
                                      <button
                                          type="button"
                                          className="text-action"
                                          onClick={(event) => {
                                              event.stopPropagation();
                                              onStatusChange(employee);
                                          }}
                                      >
                                          {employee.status === "active" ? "Désactiver" : "Réactiver"}
                                      </button>
                                  )}
                              </div>
                          ),
                      } satisfies Column<Employee>,
                  ]
                : []),
        ],
        [onEdit, onStatusChange],
    );

    return (
        <>
            <div className="filter-row">
                <SearchInput
                    value={employees.search}
                    onChange={employees.setSearch}
                    placeholder="Nom, prénom ou matricule"
                />
                <Select
                    label="Direction"
                    name="direction"
                    value={directionId}
                    onChange={(event) => {
                        setDirectionId(event.target.value);
                        employees.patch({ department_id: undefined });
                    }}
                    placeholder="Toutes les directions"
                    options={(directions.data ?? []).map((direction) => ({
                        value: String(direction.id),
                        label: direction.name,
                    }))}
                />
                <Select
                    label="Département"
                    name="department"
                    value={employees.filters.department_id ? String(employees.filters.department_id) : ""}
                    onChange={(event) => {
                        employees.patch({
                            department_id: event.target.value ? Number(event.target.value) : undefined,
                        });
                    }}
                    placeholder="Tous les départements"
                    options={(departments.data ?? []).map((department) => ({
                        value: String(department.id),
                        label: department.name,
                    }))}
                />
                <Button variant="secondary" onClick={employees.reset}>
                    Réinitialiser
                </Button>
            </div>
            {employees.loading ? (
                <p className="empty-history">Chargement du personnel…</p>
            ) : employees.error ? (
                <p className="form-error" role="alert">
                    Impossible de charger le personnel : {employees.error}
                </p>
            ) : (
                <DataTable
                    columns={columns}
                    rows={employees.employees}
                    rowKey={(employee) => employee.id}
                    emptyLabel="Aucun employé ne correspond aux filtres."
                    onRowClick={onSelect}
                    pagination={false}
                />
            )}
            <Pagination
                currentPage={employees.data?.meta?.current_page ?? 1}
                lastPage={employees.data?.meta?.last_page ?? 1}
                onChange={employees.setPage}
            />
        </>
    );
}