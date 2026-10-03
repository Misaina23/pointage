import { workingDaysBetween } from "./dates";

export type ValidationErrors = Record<string, string>;

export function required(value: string | null | undefined, label: string): string | null {
    return value && value.trim().length > 0 ? null : `${label} est obligatoire.`;
}

export function email(value: string, label = "Adresse email"): string | null {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : `${label} invalide.`;
}

export function minLength(value: string, length: number, label: string): string | null {
    return value.trim().length >= length ? null : `${label} doit contenir au moins ${length} caractères.`;
}

export function dateOrder(start: string, end: string): string | null {
    if (!start || !end) {
        return null;
    }

    return start <= end ? null : "La date de fin doit suivre la date de début.";
}

export function futureOrToday(date: string, label = "La date"): string | null {
    const today = new Date().toISOString().slice(0, 10);

    return !date || date >= today ? null : `${label} doit être aujourd'hui ou ultérieure.`;
}

export function validateLogin(values: { email: string; password: string }): ValidationErrors {
    const errors: ValidationErrors = {};

    const emailError = email(values.email, "Adresse email");
    if (emailError) {
        errors.email = emailError;
    }

    if (values.password.length < 6) {
        errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    return errors;
}

export function validateLeaveRequest(values: {
    leave_type_id?: number;
    starts_on: string;
    ends_on: string;
    reason: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!values.leave_type_id) {
        errors.leave_type_id = "Le type de congé est obligatoire.";
    }

    const startError = required(values.starts_on, "La date de début");
    if (startError) {
        errors.starts_on = startError;
    }

    const orderError = dateOrder(values.starts_on, values.ends_on);
    if (orderError) {
        errors.ends_on = orderError;
    }

    const reasonError = minLength(values.reason, 5, "Le motif");
    if (reasonError) {
        errors.reason = reasonError;
    }

    return errors;
}

export function validatePermissionRequest(values: {
    permission_type_id?: number;
    permission_date: string;
    starts_at: string;
    ends_at: string;
    reason: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!values.permission_type_id) {
        errors.permission_type_id = "Le type de permission est obligatoire.";
    }

    const dateError = required(values.permission_date, "La date");
    if (dateError) {
        errors.permission_date = dateError;
    }

    const orderError = dateOrder(values.starts_at, values.ends_at);
    if (orderError) {
        errors.ends_at = orderError;
    }

    const reasonError = minLength(values.reason, 5, "Le motif");
    if (reasonError) {
        errors.reason = reasonError;
    }

    return errors;
}

export function validateAbsence(values: {
    absence_type_id?: number;
    starts_on: string;
    ends_on?: string | null;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!values.absence_type_id) {
        errors.absence_type_id = "Le type d'absence est obligatoire.";
    }

    const startError = required(values.starts_on, "La date de début");
    if (startError) {
        errors.starts_on = startError;
    }

    if (values.starts_on && values.ends_on) {
        const orderError = dateOrder(values.starts_on, values.ends_on);
        if (orderError) {
            errors.ends_on = orderError;
        }
    }

    return errors;
}

export function validateEmployee(values: {
    employee_number: string;
    first_name: string;
    last_name: string;
    email?: string;
    direction_id?: string;
    department_id?: string;
    manager_id?: string;
    is_top_level?: boolean;
}): ValidationErrors {
    const errors: ValidationErrors = {};

    const numberError = required(values.employee_number, "Le matricule");
    if (numberError) {
        errors.employee_number = numberError;
    }

    const firstNameError = required(values.first_name, "Le prénom");
    if (firstNameError) {
        errors.first_name = firstNameError;
    }

    const lastNameError = required(values.last_name, "Le nom");
    if (lastNameError) {
        errors.last_name = lastNameError;
    }

    if (values.email) {
        const emailError = email(values.email);
        if (emailError) {
            errors.email = emailError;
        }
    }

    if (!values.direction_id && !values.department_id) {
        errors.organizational_unit_id = "Choisissez une direction ou un département.";
    }

    if (!values.manager_id && !values.is_top_level) {
        errors.manager_id = "Sélectionnez un responsable direct ou indiquez le premier niveau hiérarchique.";
    }

    return errors;
}

export function validatePlanningEvent(values: {
    title: string;
    starts_at: string;
    participant_ids: number[];
}): ValidationErrors {
    const errors: ValidationErrors = {};

    const titleError = required(values.title, "L'intitulé");
    if (titleError) {
        errors.title = titleError;
    }

    const startError = required(values.starts_at, "La date de début");
    if (startError) {
        errors.starts_at = startError;
    }

    if (values.participant_ids.length === 0) {
        errors.participant_ids = "Sélectionnez au moins un participant.";
    }

    return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
}

export function suggestedLeaveDays(startsOn: string, endsOn: string): number {
    return workingDaysBetween(startsOn, endsOn);
}