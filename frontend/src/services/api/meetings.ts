import { createPlanningEvent, listPlanning } from "./planning";
import type { Meeting, MeetingFilters, StoreMeetingPayload } from "@/types/meeting";
import { toIsoDateTime } from "@/lib/dates";

export async function listMeetings(
    filters: MeetingFilters = {},
    signal?: AbortSignal,
): Promise<{ data: Meeting[] }> {
    const response = await listPlanning({ from: filters.from, to: filters.to, event_type: "meeting" }, signal);

    return { data: response.data as Meeting[] };
}

export function createMeeting(payload: StoreMeetingPayload): Promise<Meeting> {
    return createPlanningEvent({
        ...payload,
        event_type: "meeting",
        starts_at: payload.starts_at || toIsoDateTime(new Date()),
    }).then((event) => event as Meeting);
}