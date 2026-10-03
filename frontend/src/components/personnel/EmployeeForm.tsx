"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Modal } from "@/components/ui";
import { FileUpload, Input, Select, Textarea } from "@/components/forms";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createEmployee, listEmployees, updateEmployee } from "@/services/api/employees";
import { listDepartments } from "@/services/api/departments";
import { listDirections } from "@/services/api/directions";
import { hasErrors, validateEmployee } from "@/lib/validators";
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "@/lib/constants";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { Department, Direction } from "@/types/organization";
import type { ValidationErrors } from "@/lib/validators";
import type { Employee, EmployeeStatusValue, Paginated, StoreEmployeePayload } from "@/types/user";

const EMPTY = {
    employee_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    hire_date: "",
    employment_type: "titulaire",
    status: "active",
    organization_type: "",
    direction_id: "",
    department_id: "",
    position_title: "",
    manager_id: "",
    is_top_level: "false",
};

function initialValues(employee: Employee | null) {
    return employee
        ? {
              ...EMPTY,
              employee_number: employee.employee_number,
              first_name: employee.first_name,
              last_name: employee.last_name,
              email: employee.email ?? "",
              phone: employee.phone ?? "",
              hire_date: employee.hire_date ?? "",
              employment_type: employee.employment_type ?? "titulaire",
              status: employee.status,
              organization_type: employee.department ? "department" : employee.direction ? "direction" : "",
              direction_id: employee.direction ? String(employee.direction.id) : "",
              department_id: employee.department ? String(employee.department.id) : "",
              position_title: employee.position_title ?? "",
              manager_id: employee.manager ? String(employee.manager.id) : "",
              is_top_level: employee.manager ? "false" : "true",
          }
        : { ...EMPTY };
}

export function EmployeeForm({
    open,
    onClose,
    onSaved,
    employee = null,
}: {
    open: boolean;
    onClose: () => void;
    onSaved?: () => void;
    employee?: Employee | null;
}) {
    const { notify } = useNotifications();
    const [values, setValues] = useState(() => initialValues(employee));
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(employee?.photo_url ?? null);
    const [managerSearch, setManagerSearch] = useState(employee?.manager?.full_name ?? "");
    const [managerSearchQuery, setManagerSearchQuery] = useState("");
    const photoObjectUrl = useRef<string | null>(null);

    useEffect(
        () => () => {
            if (photoObjectUrl.current) {
                URL.revokeObjectURL(photoObjectUrl.current);
            }
        },
        [],
    );

    const departments = useAsyncData<Department[]>(
        (signal) => (open ? listDepartments(undefined, signal) : Promise.resolve([])),
        [open],
    );
    const directions = useAsyncData<Direction[]>(
        (signal) => (open ? listDirections(undefined, signal) : Promise.resolve([])),
        [open],
    );
    const managerCandidates = useAsyncData<Paginated<Employee>>(
        (signal) =>
            open && managerSearchQuery.length >= 2
                ? listEmployees({ search: managerSearchQuery, status: "active", per_page: 8 }, signal)
                : Promise.resolve({ data: [] }),
        [open, managerSearchQuery],
    );
    const update = (key: keyof typeof EMPTY, value: string) =>
        setValues((current) => ({ ...current, [key]: value }));

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setManagerSearchQuery(managerSearch.trim());
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [managerSearch]);

    const submit = async () => {
        const validation = validateEmployee({
            ...values,
            direction_id: values.organization_type === "direction" ? values.direction_id : "",
            department_id: values.organization_type === "department" ? values.department_id : "",
            manager_id: values.manager_id,
            is_top_level: values.is_top_level === "true",
        });
        setErrors(validation);

        if (hasErrors(validation)) {
            return;
        }

        setSubmitting(true);

        try {
            const payload: StoreEmployeePayload = {
                employee_number: values.employee_number.trim(),
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
                email: values.email.trim() || null,
                phone: values.phone.trim() || null,
                hire_date: values.hire_date || null,
                employment_type: values.employment_type,
                status: values.status as EmployeeStatusValue,
                direction_id:
                    values.organization_type === "direction" && values.direction_id
                        ? Number(values.direction_id)
                        : null,
                department_id:
                    values.organization_type === "department" && values.department_id
                        ? Number(values.department_id)
                        : null,
                position_title: values.position_title.trim() || null,
                manager_id: values.manager_id ? Number(values.manager_id) : null,
                is_top_level: values.is_top_level === "true",
            };

            if (employee) {
                await updateEmployee(employee.id, payload, photoFile);
                notify("Dossier employé mis à jour.", "success");
            } else {
                await createEmployee(payload, photoFile);
                notify("Employé enregistré.", "success");
            }

            onSaved?.();
            onClose();
        } catch (caught) {
            notify(
                caught instanceof Error ? caught.message : "Création impossible.",
                "error",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            title={employee ? "Modifier l'employé" : "Nouvel employé"}
            subtitle="Les champs marqués d'un astérisque sont obligatoires."
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Annuler
                    </Button>
                    <Button onClick={submit} loading={submitting}>
                        Enregistrer
                    </Button>
                </>
            }
        >
            <div className="form-two-columns">
                <Input
                    label="Matricule"
                    required
                    value={values.employee_number}
                    error={errors.employee_number}
                    onChange={(event) => update("employee_number", event.target.value)}
                />
                <Input
                    label="Prénom"
                    required
                    value={values.first_name}
                    error={errors.first_name}
                    onChange={(event) => update("first_name", event.target.value)}
                />
                <Input
                    label="Nom"
                    required
                    value={values.last_name}
                    error={errors.last_name}
                    onChange={(event) => update("last_name", event.target.value)}
                />
                <Input
                    label="Adresse email"
                    type="email"
                    value={values.email}
                    error={errors.email}
                    onChange={(event) => update("email", event.target.value)}
                />
                <Input
                    label="Téléphone"
                    value={values.phone}
                    onChange={(event) => update("phone", event.target.value)}
                />
                <FileUpload
                    label="Photo du personnel"
                    accept="image/jpeg,image/png,image/webp"
                    hint="JPEG, PNG ou WebP — 5 Mo maximum."
                    onChange={(file) => {
                        if (photoObjectUrl.current) {
                            URL.revokeObjectURL(photoObjectUrl.current);
                        }

                        photoObjectUrl.current = file ? URL.createObjectURL(file) : null;
                        setPhotoFile(file);
                        setPhotoPreview(photoObjectUrl.current ?? employee?.photo_url ?? null);
                    }}
                />
                {photoPreview && (
                    <div className="employee-photo-preview">
                        <Image
                            src={photoPreview}
                            alt="Aperçu de la photo du personnel"
                            width={100}
                            height={100}
                            unoptimized
                        />
                    </div>
                )}
                <Input
                    label="Date de recrutement"
                    type="date"
                    value={values.hire_date}
                    onChange={(event) => update("hire_date", event.target.value)}
                />
                <Select
                    label="Type de contrat"
                    value={values.employment_type}
                    placeholder="Sélectionner"
                    options={EMPLOYMENT_TYPES.map((type) => ({ value: type, label: type }))}
                    onChange={(event) => update("employment_type", event.target.value)}
                />
                <Select
                    label="Statut"
                    value={values.status}
                    placeholder="Sélectionner"
                    options={EMPLOYEE_STATUSES.map((status) => ({ value: status, label: status }))}
                    onChange={(event) => update("status", event.target.value)}
                />
                <Select
                    label="Type de rattachement"
                    value={values.organization_type}
                    placeholder="Choisir direction ou département"
                    error={errors.organizational_unit_id}
                    options={[
                        { value: "direction", label: "Direction" },
                        { value: "department", label: "Département" },
                    ]}
                    onChange={(event) => {
                        update("organization_type", event.target.value);
                        update("direction_id", "");
                        update("department_id", "");
                    }}
                />
                {values.organization_type === "direction" && (
                    <Select
                        label="Direction"
                        required
                        value={values.direction_id}
                        placeholder="Sélectionner une direction"
                        options={(directions.data ?? []).map((direction) => ({
                            value: String(direction.id),
                            label: `${direction.name} (${direction.code})`,
                        }))}
                        onChange={(event) => update("direction_id", event.target.value)}
                    />
                )}
                {values.organization_type === "department" && (
                    <Select
                        label="Département"
                        required
                        value={values.department_id}
                        placeholder="Sélectionner un département"
                        options={(departments.data ?? []).map((department) => ({
                            value: String(department.id),
                            label: department.name,
                        }))}
                        onChange={(event) => {
                            update("department_id", event.target.value);
                        }}
                    />
                )}
                <Input
                    label="Poste"
                    value={values.position_title}
                    onChange={(event) => update("position_title", event.target.value)}
                />
                <div className="form-stack">
                    <Input
                        label="Responsable direct"
                        required={values.is_top_level !== "true"}
                        value={managerSearch}
                        error={errors.manager_id}
                        hint="Recherchez par nom ou matricule, puis choisissez le responsable. Les employés sans supérieur hiérarchique peuvent être déclarés au premier niveau."
                        autoComplete="off"
                        onChange={(event) => {
                            setManagerSearch(event.target.value);
                            update("manager_id", "");
                            update("is_top_level", "false");
                        }}
                    />
                    <label className="quick-row">
                        <input
                            type="checkbox"
                            checked={values.is_top_level === "true"}
                            onChange={(event) => {
                                update("is_top_level", event.target.checked ? "true" : "false");
                                if (event.target.checked) {
                                    update("manager_id", "");
                                    setManagerSearch("");
                                }
                            }}
                        />
                        Aucun responsable direct (premier niveau hiérarchique)
                    </label>
                    {managerSearch.trim().length >= 2 && !values.manager_id && (
                        <div className="request-list" role="listbox" aria-label="Résultats des responsables">
                            {managerCandidates.loading ? (
                                <p className="empty-history">Recherche…</p>
                            ) : managerCandidates.error ? (
                                <p className="form-error">{managerCandidates.error}</p>
                            ) : (
                                <>
                                    {(managerCandidates.data?.data ?? [])
                                        .filter((candidate) => candidate.id !== employee?.id)
                                        .map((candidate) => (
                                            <button
                                                key={candidate.id}
                                                type="button"
                                                className="request-card"
                                                role="option"
                                                aria-selected={false}
                                                onClick={() => {
                                                    update("manager_id", String(candidate.id));
                                                    setManagerSearch(
                                                        `${candidate.full_name} · ${candidate.employee_number}`,
                                                    );
                                                }}
                                            >
                                                <span className="request-title-line">{candidate.full_name}</span>
                                                <span className="request-meta">
                                                    {candidate.employee_number} ·{" "}
                                                    {candidate.department?.name ?? candidate.direction?.name ?? "Sans affectation"}
                                                </span>
                                            </button>
                                        ))}
                                    {!managerCandidates.loading &&
                                        (managerCandidates.data?.data ?? []).filter(
                                            (candidate) => candidate.id !== employee?.id,
                                        ).length === 0 && (
                                            <p className="empty-history">Aucun employé correspondant.</p>
                                        )}
                                </>
                            )}
                        </div>
                    )}
                </div>
                <Textarea
                    label="Remarques"
                    rows={2}
                    onChange={() => undefined}
                    aria-label="Remarques"
                />
            </div>
        </Modal>
    );
}