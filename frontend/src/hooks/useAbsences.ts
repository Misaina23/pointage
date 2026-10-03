"use client";

import { useCallback, useState } from "react";
import { createAbsence, deleteAbsence, listAbsences, listReferenceData } from "@/services/api/absences";
import { useAsyncData } from "./useAsyncData";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { RequestState } from "@/types/approval";
import type { ReferenceData, StoreAbsencePayload } from "@/types/absence";

export function useAbsences() {
    const [status, setStatus] = useState<RequestState | "">("");
    const [submitting, setSubmitting] = useState(false);

    const state = useAsyncData<import("@/types/absence").AbsenceRecord[]>(
        (signal) =>
            listAbsences(
                { status: status || undefined, per_page: DEFAULT_PAGE_SIZE },
                signal,
            ).then((page) => page.data),
        [status],
    );

    const reference = useAsyncData<ReferenceData>(
        (signal) => listReferenceData(signal),
        [],
    );

    const create = useCallback(
        async (payload: StoreAbsencePayload) => {
            setSubmitting(true);

            try {
                const created = await createAbsence(payload);
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
            await deleteAbsence(id);
            state.reload();
        },
        [state],
    );

    return {
        absences: state.data ?? [],
        reference: reference.data,
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