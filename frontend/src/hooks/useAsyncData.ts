"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

export type AsyncState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
    setData: (value: T | null) => void;
};

type AsyncResult<T> = {
    requestKey: number;
    data: T | null;
    error: string | null;
};

export function useAsyncData<T>(
    loader: (signal: AbortSignal) => Promise<T>,
    deps: readonly unknown[],
): AsyncState<T> {
    const [requestKey, setRequestKey] = useState(0);
    const [result, setResult] = useState<AsyncResult<T>>({
        requestKey: -1,
        data: null,
        error: null,
    });
    const loaderRef = useRef(loader);

    useEffect(() => {
        loaderRef.current = loader;
    });

    useEffect(() => {
        const controller = new AbortController();
        const key = requestKey;

        void loaderRef
            .current(controller.signal)
            .then((value) => {
                if (!controller.signal.aborted) {
                    setResult({ requestKey: key, data: value, error: null });
                }
            })
            .catch((caught: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setResult({
                    requestKey: key,
                    data: null,
                    error:
                        caught instanceof ApiError
                            ? caught.message
                            : "Une erreur est survenue.",
                });
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, requestKey]);

    const reload = useCallback(() => setRequestKey((value) => value + 1), []);
    const setData = useCallback(
        (value: T | null) => setResult((current) => ({ ...current, data: value })),
        [],
    );

    return {
        data: result.data,
        loading: result.requestKey !== requestKey,
        error: result.requestKey === requestKey ? result.error : null,
        reload,
        setData,
    };
}