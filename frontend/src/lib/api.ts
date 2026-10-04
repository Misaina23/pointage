import { API_BASE_URL, TOKEN_KEY } from "./constants";

export class ApiError extends Error {
    readonly status: number;

    readonly errors: Record<string, string[]>;

    constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }

    /** Libellés de validation Laravel aplatis pour les formulaires. */
    fieldErrors(): Record<string, string> {
        return Object.fromEntries(
            Object.entries(this.errors).map(([field, messages]) => [field, messages[0] ?? ""]),
        );
    }
}

export type QueryValue = string | number | boolean | null | undefined;

export type Query = Record<string, QueryValue>;

export type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    query?: Query;
    formData?: FormData;
    signal?: AbortSignal;
    skipAuth?: boolean;
};

export function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `pointa_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function clearToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    document.cookie = "pointa_token=; path=/; max-age=0; samesite=lax";
}

export function buildUrl(path: string, query?: Query): string {
    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    if (!query) {
        return url;
    }

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (value !== null && value !== undefined && value !== "") {
            params.set(key, String(value));
        }
    }

    const search = params.toString();

    return search.length > 0 ? `${url}?${search}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
    const text = await response.text();

    if (text.length === 0) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, formData, signal, skipAuth = false } = options;

    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (!skipAuth) {
        const token = getToken();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    let payload: BodyInit | undefined;

    if (formData) {
        payload = formData;
    } else if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }

    let response: Response;

    try {
        response = await fetch(buildUrl(path, query), {
            method,
            headers,
            body: payload,
            signal,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }

        throw new ApiError(0, "Serveur injoignable. Vérifiez la connexion réseau.");
    }

    const parsed = response.status === 204 ? null : await parseBody(response);

    if (!response.ok) {
        const message =
            (parsed as { message?: string } | null)?.message ?? `Erreur ${response.status}`;

        throw new ApiError(
            response.status,
            message,
            (parsed as { errors?: Record<string, string[]> } | null)?.errors ?? {},
        );
    }

    return parsed as T;
}

export function isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 401 || error.status === 403);
}