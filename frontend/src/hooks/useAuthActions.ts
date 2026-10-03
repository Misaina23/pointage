"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import type { SessionUser } from "@/types/auth";

type LoginState = {
    submitting: boolean;
    error: string | null;
};

export function useAuthActions(): LoginState & {
    login: (email: string, password: string) => Promise<SessionUser | null>;
    clearError: () => void;
} {
    const { login } = useAuth();
    const [state, setState] = useState<LoginState>({ submitting: false, error: null });

    const clearError = useCallback(() => setState({ submitting: false, error: null }), []);

    const handleLogin = useCallback(
        async (email: string, password: string) => {
            setState({ submitting: true, error: null });

            try {
                return await login({ email: email.trim(), password });
            } catch (caught) {
                const message =
                    caught instanceof ApiError ? caught.message : "Connexion impossible.";

                setState({ submitting: false, error: message });

                return null;
            }
        },
        [login],
    );

    return { ...state, login: handleLogin, clearError };
}