import type { Meeting, MeetingFormPayload, StorePlanningPayload } from "./planning";

export type { Meeting, MeetingFormPayload };

export type MeetingFilters = {
    from?: string;
    to?: string;
};

export type MeetingList = {
    data: Meeting[];
};

export type StoreMeetingPayload = StorePlanningPayload;