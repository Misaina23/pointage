import { fetchCurrentUser } from "./auth";
import type { SessionUser } from "@/types/auth";

/**
 * L'API ne fournit pas encore de resource user : le compte est lu depuis la session
 * locale et validé contre `/user` à chaque restauration de l'application.
 */
export async function getUserProfile(signal?: AbortSignal): Promise<SessionUser> {
    return fetchCurrentUser(signal);
}

export function listRoles(): Promise<{ data: { id: number; slug: string; name: string }[] }> {
    return Promise.resolve({
        data: [
            { id: 1, slug: "administrateur", name: "Administrateur" },
            { id: 2, slug: "rh", name: "Ressources humaines" },
            { id: 3, slug: "direction", name: "Direction" },
            { id: 4, slug: "responsable", name: "Responsable" },
            { id: 5, slug: "securite", name: "Sécurité" },
            { id: 6, slug: "personnel", name: "Personnel" },
        ],
    });
}