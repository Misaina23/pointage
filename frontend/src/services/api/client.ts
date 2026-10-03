import { apiRequest } from "@/lib/api";
import type { Query, RequestOptions } from "@/lib/api";

export { ApiError, apiRequest } from "@/lib/api";
export type { Query, RequestOptions };

export async function get<T>(path: string, query?: Query, signal?: AbortSignal): Promise<T> {
    return apiRequest<T>(path, { method: "GET", query, signal });
}

export async function post<T>(path: string, body?: unknown, query?: Query): Promise<T> {
    return apiRequest<T>(path, { method: "POST", body, query });
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
    return apiRequest<T>(path, { method: "PATCH", body });
}

export async function remove<T>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: "DELETE" });
}

export async function upload<T>(path: string, formData: FormData): Promise<T> {
    const options: RequestOptions = { method: "POST", formData };

    return apiRequest<T>(path, options);
}