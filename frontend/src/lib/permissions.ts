import type { PermissionName, RoleSlug } from "@/types/auth";

export const PERMISSION_LABELS: Record<PermissionName, string> = {
    "employees.view": "Consulter le personnel",
    "employees.manage": "Gérer le personnel",
    "organization.manage": "Gérer la structure organisationnelle",
    "attendance.view": "Consulter les présences",
    "attendance.history": "Consulter l’historique des présences",
    "attendance.scan": "Scanner les badges",
    "schedules.manage": "Gérer les horaires",
    "leave.manage": "Gérer les congés",
    "leave.approve": "Valider les congés",
    "leave.request": "Demander un congé",
    "permission.request": "Demander une permission",
    "absence.request": "Signaler une absence",
    "absences.manage": "Gérer les absences",
    "planning.view": "Consulter le planning",
    "planning.manage": "Gérer le planning",
    "reports.view": "Consulter les rapports",
    "roles.manage": "Gérer les rôles et permissions",
    "audit.view": "Consulter le journal d'audit",
};

export const PERMISSION_GROUPS: { label: string; items: PermissionName[] }[] = [
    {
        label: "Personnel",
        items: ["employees.view", "employees.manage", "organization.manage"],
    },
    {
        label: "Présences",
        items: ["attendance.view", "attendance.history", "attendance.scan", "schedules.manage"],
    },
    {
        label: "Demandes",
        items: [
            "leave.request",
            "leave.manage",
            "leave.approve",
            "permission.request",
            "absence.request",
            "absences.manage",
        ],
    },
    {
        label: "Organisation",
        items: ["planning.view", "planning.manage"],
    },
    {
        label: "Pilotage",
        items: ["reports.view", "roles.manage", "audit.view"],
    },
];

export const ROLE_PERMISSIONS: Record<RoleSlug, PermissionName[]> = {
    administrateur: Object.keys(PERMISSION_LABELS) as PermissionName[],
    rh: [
        "employees.view",
        "employees.manage",
        "organization.manage",
        "attendance.view",
        "attendance.history",
        "schedules.manage",
        "leave.manage",
        "leave.approve",
        "absences.manage",
        "planning.view",
        "planning.manage",
        "reports.view",
    ],
    direction: [
        "employees.view",
        "attendance.view",
        "leave.approve",
        "planning.view",
        "reports.view",
        "leave.request",
        "permission.request",
        "absence.request",
    ],
    responsable: [
        "employees.view",
        "attendance.view",
        "leave.approve",
        "planning.view",
        "leave.request",
        "permission.request",
        "absence.request",
    ],
    securite: [
        "attendance.view",
        "attendance.scan",
        "planning.view",
        "leave.request",
        "permission.request",
        "absence.request",
    ],
    personnel: [
        "attendance.view",
        "leave.request",
        "permission.request",
        "absence.request",
        "planning.view",
    ],
};

export function hasPermission(
    roles: RoleSlug[],
    permission: PermissionName,
): boolean {
    return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
}

export function hasAnyPermission(
    roles: RoleSlug[],
    permissions: PermissionName[],
): boolean {
    return permissions.some((permission) => hasPermission(roles, permission));
}

export function isAdmin(roles: RoleSlug[]): boolean {
    return roles.includes("administrateur");
}