import type { RoleSlug } from "@/types/auth";

export type RoleMeta = {
    slug: RoleSlug;
    label: string;
    shortLabel: string;
    description: string;
    homePath: string;
};

export const ROLE_ORDER: RoleSlug[] = [
    "administrateur",
    "rh",
    "direction",
    "responsable",
    "securite",
    "personnel",
];

export const ROLES: Record<RoleSlug, RoleMeta> = {
    administrateur: {
        slug: "administrateur",
        label: "Administrateur",
        shortLabel: "Admin",
        description: "Administration complète de la plateforme.",
        homePath: "/admin",
    },
    rh: {
        slug: "rh",
        label: "Ressources humaines",
        shortLabel: "RH",
        description: "Gestion du personnel, des présences et des demandes.",
        homePath: "/rh",
    },
    direction: {
        slug: "direction",
        label: "Direction",
        shortLabel: "Direction",
        description: "Supervision et validation dans le périmètre de direction.",
        homePath: "/direction",
    },
    responsable: {
        slug: "responsable",
        label: "Responsable",
        shortLabel: "Responsable",
        description: "Suivi d'équipe et première étape de validation.",
        homePath: "/responsable",
    },
    securite: {
        slug: "securite",
        label: "Sécurité",
        shortLabel: "Sécurité",
        description: "Contrôle des accès et consultation des présences.",
        homePath: "/securite",
    },
    personnel: {
        slug: "personnel",
        label: "Personnel",
        shortLabel: "Personnel",
        description: "Espace personnel et demandes de l’employé.",
        homePath: "/personnel",
    },
};

export function roleLabel(slug: string | null | undefined): string {
    if (!slug) {
        return "Invité";
    }

    return ROLES[slug as RoleSlug]?.label ?? slug;
}

export function roleShortLabel(slug: string | null | undefined): string {
    if (!slug) {
        return "Invité";
    }

    return ROLES[slug as RoleSlug]?.shortLabel ?? slug;
}

export function primaryRole(roles: RoleSlug[]): RoleSlug | null {
    if (roles.length === 0) {
        return null;
    }

    const sorted = [...roles].sort(
        (a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b),
    );

    return sorted[0];
}

export function homePathFor(roles: RoleSlug[]): string {
    return roles.length === 0 ? "/login" : (ROLES[primaryRole(roles) as RoleSlug]?.homePath ?? "/login");
}

export function initialsFor(name: string | null | undefined): string {
    if (!name) {
        return "—";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}