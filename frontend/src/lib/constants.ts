export const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:8000/api/v1"
);

export const APP_NAME = "PointageMisaina";
export const APP_ORGANIZATION = "MESupReS";
export const APP_TAGLINE = "Plateforme de gestion du personnel et des temps de travail";

export const TOKEN_KEY = "pointa.token";
export const TOKEN_COOKIE = "pointa_token";

export const DEFAULT_PAGE_SIZE = 25;
export const TABLE_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 100;

export const SCAN_HISTORY_KEY = "pointa.scan-history";
export const SCAN_QUEUE_KEY = "pointa.scan-queue";

export const REQUEST_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;

export const ATTENDANCE_STATUSES = [
    "present",
    "late",
    "absent",
    "on_leave",
    "on_permission",
    "remote",
    "holiday",
    "rest_day",
    "incomplete",
] as const;

export const PLANNING_EVENT_TYPES = [
    "meeting",
    "training",
    "leave",
    "mission",
    "other",
] as const;

export const SCHEDULE_TYPES = ["fixed", "flexible", "shift", "rest"] as const;

export const EMPLOYMENT_TYPES = [
    "titulaire",
    "contractuel",
    "stagiaire",
    "journalier",
    "consultant",
] as const;

export const EMPLOYEE_STATUSES = ["active", "inactive", "suspended", "retired"] as const;

export const STORAGE_SCAN_CAPACITY = 100;