"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { login as loginRequest, logout as logoutRequest, fetchCurrentUser } from "@/services/api/auth";
import { clearAuth, readAuthSession, saveAuth, storeAuthToken } from "@/services/storage/authStorage";
import { TOKEN_KEY } from "@/lib/constants";
import { homePathFor } from "@/lib/roles";
import type { LoginPayload, RoleSlug, SessionUser } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
    status: AuthStatus;
    user: SessionUser | null;
    roles: RoleSlug[];
    login: (payload: LoginPayload) => Promise<SessionUser>;
    logout: () => Promise<void>;
    refresh: () => Promise<SessionUser | null>;
    hasRole: (role: RoleSlug) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUser] = useState<SessionUser | null>(null);

    const applySession = useCallback((session: SessionUser | null) => {
        setUser(session);
        setStatus(session ? "authenticated" : "anonymous");
    }, []);

    const loadSession = useCallback(async (): Promise<SessionUser | null> => {
        const cached = readAuthSession();

        if (!cached) {
            clearAuth();

            return null;
        }

        try {
            return await fetchCurrentUser();
        } catch {
            clearAuth();

            return null;
        }
    }, []);

    const refresh = useCallback(async () => {
        setStatus("loading");
        const session = await loadSession();

        applySession(session);

        return session;
    }, [applySession, loadSession]);

    useEffect(() => {
        let active = true;

        void loadSession().then((session) => {
            if (active) {
                applySession(session);
            }
        });

        return () => {
            active = false;
        };
    }, [loadSession, applySession]);

    useEffect(() => {
        const revalidateSession = () => {
            void refresh();
        };
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                revalidateSession();
            }
        };
        const handleStorage = (event: StorageEvent) => {
            if (event.key === TOKEN_KEY || event.key === "pointa.session") {
                revalidateSession();
            }
        };

        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("storage", handleStorage);
        };
    }, [refresh]);

    const login = useCallback(
        async (payload: LoginPayload): Promise<SessionUser> => {
            const response = await loginRequest(payload);
            storeAuthToken(response.token);
            const session = await fetchCurrentUser();
            saveAuth(response.token, session);
            applySession(session);
            router.refresh();

            return session;
        },
        [applySession, router],
    );

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } finally {
            clearAuth();
            applySession(null);
            router.replace("/login");
            router.refresh();
        }
    }, [applySession, router]);

    const hasRole = useCallback(
        (role: RoleSlug) => (user?.roles ?? []).includes(role),
        [user],
    );

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            roles: user?.roles ?? [],
            login,
            logout,
            refresh,
            hasRole,
        }),
        [status, user, login, logout, refresh, hasRole],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth doit être utilisé dans un AuthProvider.");
    }

    return context;
}

export function useHomePath(): string {
    const { roles } = useAuth();

    return homePathFor(roles);
}