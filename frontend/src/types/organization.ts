export type Direction = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    departments_count?: number;
    employees_count?: number;
};

export type Department = {
    id: number;
    direction_id: number | null;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    direction?: { id: number; name: string } | null;
    employees_count?: number;
};

export type StoreOrganizationPayload = {
    name: string;
    code: string;
    description?: string | null;
    is_active?: boolean;
};

export type StoreDepartmentPayload = StoreOrganizationPayload & {
    direction_id: number;
};
