import { get, post, remove, upload } from "./client";
import type {
    AbsenceFilters,
    AbsenceList,
    AbsenceRecord,
    StoreAbsencePayload,
} from "@/types/absence";

export function listAbsences(
    filters: AbsenceFilters = {},
    signal?: AbortSignal,
): Promise<AbsenceList> {
    return get<AbsenceList>("/absences", { ...filters }, signal);
}

export function getAbsence(id: number, signal?: AbortSignal): Promise<AbsenceRecord> {
    return get<AbsenceRecord>(`/absences/${id}`, undefined, signal);
}

export function createAbsence(payload: StoreAbsencePayload): Promise<AbsenceRecord> {
    if (payload.attachment) {
        const formData = new FormData();
        formData.append("absence_type_id", String(payload.absence_type_id));
        formData.append("starts_on", payload.starts_on);
        formData.append("reason", payload.reason ?? "");
        formData.append("attachment", payload.attachment);

        if (payload.ends_on) {
            formData.append("ends_on", payload.ends_on);
        }

        return upload<AbsenceRecord>("/absences", formData);
    }

    return post<AbsenceRecord>("/absences", {
        absence_type_id: payload.absence_type_id,
        starts_on: payload.starts_on,
        ends_on: payload.ends_on ?? null,
        reason: payload.reason ?? null,
    });
}

export function deleteAbsence(id: number): Promise<void> {
    return remove<void>(`/absences/${id}`);
}

export function listReferenceData(signal?: AbortSignal): Promise<import("@/types/absence").ReferenceData> {
    return get<import("@/types/absence").ReferenceData>("/reference-data", undefined, signal);
}