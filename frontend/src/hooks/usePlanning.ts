"use client";

import { useCallback, useState } from "react";
import {
    createPlanningEvent,
    deletePlanningEvent,
    listPlanning,
    updatePlanningEvent,
} from "@/services/api/planning";
import { useAsyncData } from "./useAsyncData";
import { endOfMonth, startOfMonth, todayIso } from "@/lib/dates";
import type { PlanningEvent, PlanningFilters, StorePlanningPayload, UpdatePlanningPayload } from "@/types/planning";

export function usePlanning(initialFilters?: Partial<PlanningFilters>) {
    const [filters, setFilters] = useState<PlanningFilters>({
        from: startOfMonth(),
        to: endOfMonth(),
        ...initialFilters,
    });
    const [submitting, setSubmitting] = useState(false);

    const state = useAsyncData<PlanningEvent[]>(
        (signal) => listPlanning(filters, signal).then((response) => response.data),
        [filters.from, filters.to, filters.event_type, filters.department_id],
    );

    const patch = useCallback((next: Partial<PlanningFilters>) => {
        setFilters((current) => ({ ...current, ...next }));
    }, []);

    const create = useCallback(
        async (payload: StorePlanningPayload) => {
            setSubmitting(true);

            try {
                const created = await createPlanningEvent(payload);
                state.reload();

                return created;
            } finally {
                setSubmitting(false);
            }
        },
        [state],
    );

    const update = useCallback(
        async (id: number, payload: UpdatePlanningPayload) => {
            setSubmitting(true);

            try {
                const updated = await updatePlanningEvent(id, payload);
                state.reload();

                return updated;
            } finally {
                setSubmitting(false);
            }
        },
        [state],
    );

    const remove = useCallback(
        async (id: number) => {
            await deletePlanningEvent(id);
            state.reload();
        },
        [state],
    );

    return {
        events: state.data ?? [],
        loading: state.loading,
        error: state.error,
        filters,
        patch,
        submitting,
        reload: state.reload,
        create,
        update,
        remove,
        today: todayIso(),
    };
}