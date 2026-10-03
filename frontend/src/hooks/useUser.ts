"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { fetchCurrentUser } from "@/services/api/auth";
import type { SessionUser } from "@/types/auth";

export function useUser(): {
    user: SessionUser | null;
    loading: boolean;
    reload: () => Promise<SessionUser | null>;
} {
    const { user, status, refresh } = useAuth();

    return {
        user,
        loading: status === "loading",
        reload: refresh ?? fetchCurrentUser,
    };
}