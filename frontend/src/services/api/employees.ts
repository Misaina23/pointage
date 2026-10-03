import { get, patch, post, remove, upload } from "./client";
import type {
    Employee,
    EmployeeFilters,
    Paginated,
    StoreEmployeePayload,
    UpdateEmployeePayload,
} from "@/types/user";

function employeeFormData(
    payload: StoreEmployeePayload | UpdateEmployeePayload,
    photo: File,
): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    }

    formData.append("photo", photo);

    return formData;
}

export function listEmployees(
    filters: EmployeeFilters = {},
    signal?: AbortSignal,
): Promise<Paginated<Employee>> {
    return get<Paginated<Employee>>("/employees", { ...filters }, signal);
}

export function getEmployee(id: number, signal?: AbortSignal): Promise<Employee> {
    return get<Employee>(`/employees/${id}`, undefined, signal);
}

export function createEmployee(payload: StoreEmployeePayload, photo?: File | null): Promise<Employee> {
    if (photo) {
        return upload<Employee>("/employees", employeeFormData(payload, photo));
    }

    return post<Employee>("/employees", payload);
}

export function updateEmployee(
    id: number,
    payload: UpdateEmployeePayload,
    photo?: File | null,
): Promise<Employee> {
    if (photo) {
        const formData = employeeFormData(payload, photo);
        formData.append("_method", "PATCH");

        return upload<Employee>(`/employees/${id}`, formData);
    }

    return patch<Employee>(`/employees/${id}`, payload);
}

export function deactivateEmployee(id: number): Promise<void> {
    return remove<void>(`/employees/${id}`);
}