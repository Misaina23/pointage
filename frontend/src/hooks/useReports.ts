"use client";

import { useCallback, useState } from "react";
import {
    getDailyReport,
    getDepartmentReport,
    getMonthlyReport,
    getOrganizationDashboard,
    getPersonalDashboard,
} from "@/services/api/reports";
import { endOfMonth, startOfMonth, todayIso, toIsoMonth } from "@/lib/dates";
import { useAsyncData } from "./useAsyncData";
import type {
    DailyReport,
    DepartmentReport,
    MonthlyReport,
    OrganizationDashboard,
    PersonalDashboard,
} from "@/types/report";

export function useReports() {
    const [date, setDate] = useState(todayIso());
    const [month, setMonth] = useState(toIsoMonth(new Date()));
    const [range, setRange] = useState({ from: startOfMonth(), to: endOfMonth() });
    const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);

    const daily = useAsyncData<DailyReport>(
        (signal) => getDailyReport({ date, department_id: departmentId }, signal),
        [date, departmentId],
    );

    const monthly = useAsyncData<MonthlyReport>(
        (signal) => getMonthlyReport({ month, department_id: departmentId }, signal),
        [month, departmentId],
    );

    const departments = useAsyncData<DepartmentReport>(
        (signal) => getDepartmentReport({ ...range }, signal),
        [range.from, range.to],
    );

    const organization = useAsyncData<OrganizationDashboard>(
        (signal) => getOrganizationDashboard(departmentId, signal),
        [departmentId],
    );

    const personal = useAsyncData<PersonalDashboard>(
        (signal) => getPersonalDashboard(signal),
        [],
    );

    const reloadAll = useCallback(() => {
        daily.reload();
        monthly.reload();
        departments.reload();
        organization.reload();
        personal.reload();
    }, [daily, monthly, departments, organization, personal]);

    return {
        date,
        setDate,
        month,
        setMonth,
        range,
        setRange,
        departmentId,
        setDepartmentId,
        daily: daily.data,
        dailyLoading: daily.loading,
        monthly: monthly.data,
        monthlyLoading: monthly.loading,
        departments: departments.data,
        departmentsLoading: departments.loading,
        organization: organization.data,
        organizationLoading: organization.loading,
        personal: personal.data,
        personalLoading: personal.loading,
        reload: reloadAll,
    };
}