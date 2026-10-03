"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, Spinner } from "@/components/ui";
import { PlanningForm } from "@/components/planning";
import { getPlanningEvent } from "@/services/api/planning";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePlanning } from "@/hooks/usePlanning";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { PlanningEvent } from "@/types/planning";

export default function EditPlanningPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { notify } = useNotifications();
    const planning = usePlanning();
    const id = Number(params.id);

    const event = useAsyncData<PlanningEvent | null>(
        (signal) => (Number.isFinite(id) ? getPlanningEvent(id, signal) : Promise.resolve(null)),
        [id],
    );

    if (Number.isNaN(id)) {
        return <p className="empty-history">Identifiant d&apos;événement invalide.</p>;
    }

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Planning</p>
                    <h1>Modifier l&apos;événement</h1>
                    <p className="page-subtitle">Mettez à jour les informations de l&apos;agenda.</p>
                </div>
            </header>

            {event.loading ? (
                <Spinner label="Chargement de l'événement" />
            ) : !event.data ? (
                <Card title="Introuvable">
                    <p className="empty-history">Cet événement n&apos;existe pas ou n&apos;est pas accessible.</p>
                </Card>
            ) : (
                <PlanningForm
                    submitLabel="Enregistrer les modifications"
                    submitting={planning.submitting}
                    initial={{
                        title: event.data.title,
                        event_type: event.data.event_type,
                        description: event.data.description ?? "",
                        starts_at: event.data.starts_at ?? "",
                        ends_at: event.data.ends_at ?? "",
                        location: event.data.location ?? "",
                        participant_ids: event.data.participants.map((participant) => participant.id),
                    }}
                    onSubmit={async (payload) => {
                        try {
                            await planning.update(id, payload);
                            notify("Événement mis à jour.", "success");
                            router.push("/planning");
                        } catch (caught) {
                            notify(
                                caught instanceof Error ? caught.message : "Mise à jour impossible.",
                                "error",
                            );
                            throw caught;
                        }
                    }}
                    onCancel={() => router.back()}
                />
            )}
        </>
    );
}