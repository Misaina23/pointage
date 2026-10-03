"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/ui";
import { initials } from "@/lib/formatters";
import type { Employee } from "@/types/user";

export function EmployeeAvatar({
    employee,
    size = "md",
}: {
    employee: Pick<Employee, "first_name" | "last_name"> & Partial<Pick<Employee, "photo_url">>;
    size?: "sm" | "md" | "lg";
}) {
    return (
        <span className={`employee-avatar size-${size}`} aria-hidden>
            {employee.photo_url ? (
                <Image
                    src={employee.photo_url}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                />
            ) : (
                initials(`${employee.first_name} ${employee.last_name}`)
            )}
        </span>
    );
}

export function EmployeeStatus({ employee }: { employee: Employee }) {
    return <StatusBadge status={employee.status} label={employee.status_label} />;
}

export function EmployeeCard({
    employee,
    onSelect,
}: {
    employee: Employee;
    onSelect?: (employee: Employee) => void;
}) {
    return (
        <button
            type="button"
            className="request-card"
            onClick={onSelect ? () => onSelect(employee) : undefined}
        >
            <span className="request-card-head">
                <EmployeeAvatar employee={employee} />
                <span className="request-main">
                    <span className="request-title-line">{employee.full_name}</span>
                    <span className="request-meta">
                        {employee.employee_number}
                        {employee.position_title ? ` · ${employee.position_title}` : ""}
                    </span>
                </span>
                <EmployeeStatus employee={employee} />
            </span>
            <span className="request-description">
                {employee.department?.name ?? employee.direction?.name ?? "Sans affectation"}
            </span>
        </button>
    );
}