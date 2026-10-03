"use client";

import { useCallback, useState } from "react";
import { createLeave, deleteLeave, listLeaves } from "@/services/api/leaves";
import { useAsyncData } from "./useAsyncData";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { RequestState } from "@/types/approval";
import type { LeaveRequest, StoreLeavePayload } from "@/types/leave";

export function useLeaves() {
    const [status, setStatus] = useState<RequestState | "">("");
    const [submitting, setSubmitting] = useState(false);

    const state = useAsyncData<LeaveRequest[]>(
        (signal) =>
            listLeaves(
                { status: status || undefined, per_page: DEFAULT_PAGE_SIZE },
                signal,
            ).then((page) => page.data),
        [status],
    );

    const create = useCallback(
        async (payload: StoreLeavePayload): Promise<LeaveRequest | null> => {
            setSubmitting(true);

            try {
                const created = await createLeave(payload);
                state.reload();

                return created;
            } catch (caught) {
                throw caught;
            } finally {
                setSubmitting(false);
            }
        },
        [state],
    );

    const remove = useCallback(
        async (id: number) => {
            await deleteLeave(id);
            state.reload();
        },
        [state],
    );

    return {
        leaves: state.data ?? [],
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