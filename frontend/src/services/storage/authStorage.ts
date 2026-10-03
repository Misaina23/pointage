import { clearToken, getToken, setToken } from "@/lib/api";
import type { SessionUser } from "@/types/auth";

const SESSION_KEY = "pointa.session";

export function getAuthToken(): string | null {
    return getToken();
}

export function storeAuthToken(token: string): void {
    setToken(token);
}

export function readAuthSession(): SessionUser | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(SESSION_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as SessionUser;
    } catch {
        return null;
    }
}

export function storeAuthSession(user: SessionUser): void {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function saveAuth(token: string, user: SessionUser): void {
    storeAuthToken(token);
    storeAuthSession(user);
}

export function clearAuth(): void {
    clearToken();

    if (typeof window !== "undefined") {
        window.localStorage.removeItem(SESSION_KEY);
    }
}

export function isAuthenticated(): boolean {
    return getAuthToken() !== null;
}