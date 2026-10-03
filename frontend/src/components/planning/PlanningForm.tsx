"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { Input, Select, Textarea } from "@/components/forms";
import { ParticipantSelector } from "./Planning";
import { hasErrors, validatePlanningEvent } from "@/lib/validators";
import { PLANNING_EVENT_TYPES } from "@/lib/constants";
import { toIsoDateTime } from "@/lib/dates";
import { titleCase } from "@/lib/formatters";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { PlanningEventType, StorePlanningPayload } from "@/types/planning";
import type { ValidationErrors } from "@/lib/validators";

export function PlanningForm({
    initial,
    submitting,
    onSubmit,
    onCancel,
    submitLabel = "Créer l'événement",
}: {
    initial?: Partial<StorePlanningPayload>;
    submitting?: boolean;
    onSubmit: (payload: StorePlanningPayload) => Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
}) {
    const { notify } = useNotifications();
    const [values, setValues] = useState<{
        title: string;
        event_type: PlanningEventType;
        description: string;
        starts_at: string;
        ends_at: string;
        location: string;
    }>({
        title: initial?.title ?? "",
        event_type: initial?.event_type ?? "meeting",
        description: initial?.description ?? "",
        starts_at: initial?.starts_at ?? toIsoDateTime(new Date()),
        ends_at: initial?.ends_at ?? "",
        location: initial?.location ?? "",
    });
    const [participants, setParticipants] = useState<number[]>(initial?.participant_ids ?? []);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const submit = async () => {
        const validation = validatePlanningEvent({
            title: values.title,
            starts_at: values.starts_at,
            participant_ids: participants,
        });

        setErrors(validation);

        if (hasErrors(validation)) {
            return;
        }

        try {
            await onSubmit({
                title: values.title.trim(),
                event_type: values.event_type,
                description: values.description.trim() || null,
                starts_at: values.starts_at,
                ends_at: values.ends_at || null,
                location: values.location.trim() || null,
                participant_ids: participants,
            });

            notify("Événement enregistré.", "success");
            setValues({ ...values, title: "", description: "", location: "", ends_at: "" });
            setParticipants([]);
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Enregistrement impossible.", "error");
        }
    };

    return (
        <Card title="Nouvel événement">
            <div className="form-stack">
                <Input
                    label="Intitulé"
                    required
                    value={values.title}
                    error={errors.title}
                    onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                />
                <Select
                    label="Type"
                    value={values.event_type}
                    placeholder="Sélectionner"
                    options={PLANNING_EVENT_TYPES.map((type) => ({
                        value: type,
                        label: titleCase(type),
                    }))}
                    onChange={(event) =>
                        setValues((current) => ({
                            ...current,
                            event_type: event.target.value as PlanningEventType,
                        }))
                    }
                />
                <div className="form-two-columns">
                    <Input
                        label="Début"
                        type="datetime-local"
                        required
                        value={values.starts_at}
                        error={errors.starts_at}
                        onChange={(event) =>
                            setValues((current) => ({ ...current, starts_at: event.target.value }))
                        }
                    />
                    <Input
                        label="Fin"
                        type="datetime-local"
                        value={values.ends_at}
                        onChange={(event) =>
                            setValues((current) => ({ ...current, ends_at: event.target.value }))
                        }
                    />
                </div>
                <Input
                    label="Lieu"
                    value={values.location}
                    onChange={(event) =>
                        setValues((current) => ({ ...current, location: event.target.value }))
                    }
                />
                <Textarea
                    label="Description"
                    rows={3}
                    value={values.description}
                    onChange={(event) =>
                        setValues((current) => ({ ...current, description: event.target.value }))
                    }
                />
                <ParticipantSelector
                    label="Participants"
                    selected={participants}
                    onChange={setParticipants}
                />
                {errors.participant_ids && (
                    <small className="form-error">{errors.participant_ids}</small>
                )}
                <div className="camera-actions">
                    <Button onClick={submit} loading={submitting}>
                        {submitLabel}
                    </Button>
                    {onCancel && (
                        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
                            Annuler
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

export function MeetingForm(props: Omit<React.ComponentProps<typeof PlanningForm>, "event_type">) {
    return <PlanningForm {...props} initial={{ ...props.initial, event_type: "meeting" }} />;
}

export function MeetingCard({ event }: { event: import("@/types/planning").PlanningEvent }) {
    return (
        <Card title={event.title} subtitle={event.location ?? undefined}>
            <p className="request-description">{event.description ?? "Aucune description."}</p>
            <p className="request-meta">
                {event.participants.length} participant(s) · créé par {event.creator ?? "inconnu"}
            </p>
        </Card>
    );
}