"use client";

import { DataTable } from "@/components/ui";
import { Card } from "@/components/ui";
import type { Column } from "@/components/ui";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listEmployees } from "@/services/api/employees";
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/formatters";
import type { Employee, Paginated } from "@/types/user";

export default function AdminContractsPage() {
    const employees = useAsyncData<Paginated<Employee>>(
        (signal) => listEmployees({ per_page: 200 }, signal),
        [],
    );

    const columns: Column<Employee>[] = [
        { key: "number", header: "Matricule", render: (row) => row.employee_number },
        { key: "name", header: "Agent", render: (row) => row.full_name },
        {
            key: "type",
            header: "Type de contrat",
            render: (row) => titleCase(row.employment_type ?? "non défini"),
        },
        {
            key: "hire",
            header: "Date de recrutement",
            render: (row) => formatDate(row.hire_date),
        },
        {
            key: "status",
            header: "Statut",
            render: (row) => (
                <span className={`status-pill status-${row.status === "active" ? "positive" : "neutral"}`}>
                    {row.status_label}
                </span>
            ),
        },
    ];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Organisation</p>
                    <h1>Contrats</h1>
                    <p className="page-subtitle">
                        Types de contrat et statuts présents dans le registre du personnel.
                    </p>
                </div>
            </header>

            <div className="content-grid">
                <Card title="Répartition par type">
                    <div className="request-list">
                        {EMPLOYMENT_TYPES.map((type) => (
                            <div key={type} className="quick-row">
                                <span className="request-main">
                                    <span className="request-title-line">{titleCase(type)}</span>
                                </span>
                                <span className="chart-value">
                                    {
                                        (employees.data?.data ?? []).filter(
                                            (employee) => employee.employment_type === type,
                                        ).length
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card title="Répartition par statut">
                    <div className="request-list">
                        {EMPLOYEE_STATUSES.map((status) => (
                            <div key={status} className="quick-row">
                                <span className="request-main">
                                    <span className="request-title-line">{titleCase(status)}</span>
                                </span>
                                <span className="chart-value">
                                    {
                                        (employees.data?.data ?? []).filter(
                                            (employee) => employee.status === status,
                                        ).length
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card title="Détail des contrats">
                {employees.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : (
                    <DataTable
                        columns={columns}
                        rows={employees.data?.data ?? []}
                        rowKey={(row) => row.id}
                        emptyLabel="Aucun contrat enregistré."
                    />
                )}
            </Card>
        </>
    );
}