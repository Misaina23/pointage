import { clearToken, getToken, setToken as persistToken } from "./api";
import type { SessionUser } from "@/types/auth";

export const SESSION_KEY = "pointa.session";

export function readSession(): SessionUser | null {
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

export function writeSession(user: SessionUser): void {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function saveToken(token: string): void {
    persistToken(token);
}

export function saveAuth(token: string, user: SessionUser): void {
    saveToken(token);
    writeSession(user);
}

export function destroyAuth(): void {
    clearToken();
    window.localStorage.removeItem(SESSION_KEY);
}

export function hasToken(): boolean {
    return getToken() !== null;
}