import { getCsrfCookie } from "@/lib/api";
import { apiRequest, get, post } from "./client";
import { clearAuth } from "@/services/storage/authStorage";
import type { LoginPayload, LoginResponse, SessionUser } from "@/types/auth";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    await getCsrfCookie();

    return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: {
            ...payload,
            device_name: payload.device_name ?? "PointageMisaina PWA",
        },
        skipAuth: true,
    });
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<SessionUser> {
    return get<SessionUser>("/user", undefined, signal);
}

export async function logout(): Promise<void> {
    try {
        await post<void>("/auth/logout");
    } finally {
        clearAuth();
    }
}