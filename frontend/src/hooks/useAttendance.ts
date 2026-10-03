"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAttendanceToday, listAttendanceEvents } from "@/services/api/attendance";
import { todayIso } from "@/lib/dates";
import { useAsyncData } from "./useAsyncData";
import type { AttendanceEvent, AttendanceToday } from "@/types/attendance";

async function loadAllEventsForDate(date: string, eventType: "entry" | "exit" | "", signal: AbortSignal) {
    const allEvents: AttendanceEvent[] = [];
    let page = 1;
    let lastPage = 1;

    do {
        const result = await listAttendanceEvents(
            {
                from: `${date}T00:00:00`,
                to: `${date}T23:59:59`,
                event_type: eventType || undefined,
                per_page: 200,
                page,
            },
            signal,
        );

        allEvents.push(...result.data);
        lastPage = result.meta?.last_page ?? page;
        page += 1;
    } while (page <= lastPage);

    return allEvents;
}

export function useAttendance(
    date?: string,
    resetAtMidnight = false,
    includeEvents = true,
    fetchCompleteEvents = false,
) {
    const [selectedDate, setSelectedDate] = useState(date ?? todayIso());
    const [eventType, setEventType] = useState<"entry" | "exit" | "">("");

    useEffect(() => {
        if (!resetAtMidnight) {
            return;
        }

        let timeoutId: number;
        const scheduleMidnightUpdate = () => {
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

            timeoutId = window.setTimeout(() => {
                setSelectedDate(todayIso());
                scheduleMidnightUpdate();
            }, midnight.getTime() - now.getTime() + 50);
        };
        const refreshVisibleDate = () => {
            if (document.visibilityState === "visible") {
                setSelectedDate(todayIso());
                window.clearTimeout(timeoutId);
                scheduleMidnightUpdate();
            }
        };

        scheduleMidnightUpdate();
        document.addEventListener("visibilitychange", refreshVisibleDate);

        return () => {
            window.clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", refreshVisibleDate);
        };
    }, [resetAtMidnight]);

    const today = useAsyncData<AttendanceToday>(
        (signal) => getAttendanceToday(selectedDate, signal),
        [selectedDate],
    );

    const events = useAsyncData<AttendanceEvent[]>(
        (signal) => {
            if (!includeEvents) {
                return Promise.resolve([]);
            }

            if (fetchCompleteEvents) {
                return loadAllEventsForDate(selectedDate, eventType, signal);
            }

            return listAttendanceEvents(
                {
                    from: `${selectedDate}T00:00:00`,
                    to: `${selectedDate}T23:59:59`,
                    event_type: eventType || undefined,
                    per_page: 100,
                },
                signal,
            ).then((page) => page.data);
        },
        [selectedDate, eventType, includeEvents, fetchCompleteEvents],
    );

    const reloadAll = useCallback(() => {
        today.reload();
        events.reload();
    }, [today, events]);

    return useMemo(
        () => ({
            date: selectedDate,
            setDate: setSelectedDate,
            eventType,
            setEventType,
            today: today.data,
            todayLoading: today.loading,
            todayError: today.error,
            events: events.data ?? [],
            eventsLoading: events.loading,
            eventsError: events.error,
            reload: reloadAll,
        }),
        [selectedDate, eventType, today, events, reloadAll],
    );
}