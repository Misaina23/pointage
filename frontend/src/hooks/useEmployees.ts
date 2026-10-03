"use client";

import { useCallback, useMemo, useState } from "react";
import { listEmployees } from "@/services/api/employees";
import { useAsyncData } from "./useAsyncData";
import { TABLE_PAGE_SIZE } from "@/lib/constants";
import type { Employee, EmployeeFilters, Paginated } from "@/types/user";

export type EmployeeDirectoryState = {
    data: Paginated<Employee> | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
    employees: Employee[];
    filters: EmployeeFilters;
    search: string;
    setSearch: (value: string) => void;
    patch: (next: Partial<EmployeeFilters>) => void;
    reset: () => void;
    setPage: (page: number) => void;
    total: number;
};

export function useEmployees(initialFilters: EmployeeFilters = {}): EmployeeDirectoryState {
    const [filters, setFilters] = useState<EmployeeFilters>({
        per_page: TABLE_PAGE_SIZE,
        ...initialFilters,
    });
    const [search, setSearch] = useState(initialFilters.search ?? "");

    const state = useAsyncData<Paginated<Employee>>(
        (signal) => listEmployees({ ...filters, search: search || undefined }, signal),
        [filters, search],
    );

    const patch = useCallback((next: Partial<EmployeeFilters>) => {
        setFilters((current) => ({ ...current, ...next, page: 1 }));
    }, []);

    const searchFor = useCallback((value: string) => {
        setSearch(value);
        setFilters((current) => ({ ...current, page: 1 }));
    }, []);

    const reset = useCallback(() => {
        searchFor("");
        setFilters({ per_page: TABLE_PAGE_SIZE });
    }, [searchFor]);

    const setPage = useCallback((page: number) => {
        setFilters((current) => ({ ...current, page }));
    }, []);

    const total = state.data?.meta?.total ?? 0;

    return useMemo(
        () => ({
            ...state,
            employees: state.data?.data ?? [],
            filters,
            search,
            setSearch: searchFor,
            patch,
            reset,
            setPage,
            total,
        }),
        [state, filters, search, searchFor, patch, reset, setPage, total],
    );
}