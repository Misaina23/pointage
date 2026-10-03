"use client";

import { useCallback, useState } from "react";
import { createPermission, deletePermission, listPermissions } from "@/services/api/permissions";
import { useAsyncData } from "./useAsyncData";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { RequestState } from "@/types/approval";
import type { PermissionRequest, StorePermissionPayload } from "@/types/permission";

export function usePermissions() {
    const [status, setStatus] = useState<RequestState | "">("");
    const [submitting, setSubmitting] = useState(false);

    const state = useAsyncData<PermissionRequest[]>(
        (signal) =>
            listPermissions(
                { status: status || undefined, per_page: DEFAULT_PAGE_SIZE },
                signal,
            ).then((page) => page.data),
        [status],
    );

    const create = useCallback(
        async (payload: StorePermissionPayload): Promise<PermissionRequest> => {
            setSubmitting(true);

            try {
                const created = await createPermission(payload);
                state.reload();

                return created;
            } finally {
                setSubmitting(false);
            }
        },
        [state],
    );

    const remove = useCallback(
        async (id: number) => {
            await deletePermission(id);
            state.reload();
        },
        [state],
    );

    return {
        permissions: state.data ?? [],
        loading: state.loading,
        error: state.error,
        status,
        setStatus,
        submitting,
        reload: state.reload,
        create,
        remove,
    };
}