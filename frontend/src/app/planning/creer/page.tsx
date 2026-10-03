"use client";

import { useRouter } from "next/navigation";
import { PlanningForm } from "@/components/planning";
import { usePlanning } from "@/hooks/usePlanning";
import { useNotifications } from "@/components/providers/NotificationProvider";

export default function CreatePlanningPage() {
    const router = useRouter();
    const { notify } = useNotifications();
    const planning = usePlanning();

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Planning</p>
                    <h1>Créer un événement</h1>
                    <p className="page-subtitle">
                        Réunion, formation, mission ou événement de planning.
                    </p>
                </div>
            </header>

            <PlanningForm
                submitting={planning.submitting}
                onSubmit={async (payload) => {
                    try {
                        await planning.create(payload);
                        notify("Événement créé.", "success");
                        router.push("/planning");
                    } catch (caught) {
                        notify(
                            caught instanceof Error ? caught.message : "Création impossible.",
                            "error",
                        );
                        throw caught;
                    }
                }}
                onCancel={() => router.back()}
            />
        </>
    );
}