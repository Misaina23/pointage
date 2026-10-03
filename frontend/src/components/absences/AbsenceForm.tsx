"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { FileUpload, Input, Select, Textarea } from "@/components/forms";
import { hasErrors, validateAbsence } from "@/lib/validators";
import { todayIso } from "@/lib/dates";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { AbsenceType, StoreAbsencePayload } from "@/types/absence";
import type { ValidationErrors } from "@/lib/validators";

export function AbsenceForm({
    absenceTypes,
    submitting,
    onCreate,
    onCancel,
}: {
    absenceTypes: AbsenceType[];
    submitting?: boolean;
    onCreate: (payload: StoreAbsencePayload) => Promise<void>;
    onCancel?: () => void;
}) {
    const { notify } = useNotifications();
    const [values, setValues] = useState({
        absence_type_id: "",
        starts_on: todayIso(),
        ends_on: "",
        reason: "",
    });
    const [attachment, setAttachment] = useState<File | null>(null);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const selectedType = absenceTypes.find(
        (type) => String(type.id) === values.absence_type_id,
    );

    const submit = async () => {
        const validation = validateAbsence({
            absence_type_id: values.absence_type_id
                ? Number(values.absence_type_id)
                : undefined,
            starts_on: values.starts_on,
            ends_on: values.ends_on || null,
        });

        setErrors(validation);

        if (hasErrors(validation)) {
            return;
        }

        if (selectedType?.requires_attachment && !attachment) {
            setErrors({ attachment: "Une pièce justificative est exigée." });

            return;
        }

        try {
            await onCreate({
                absence_type_id: Number(values.absence_type_id),
                starts_on: values.starts_on,
                ends_on: values.ends_on || null,
                reason: values.reason.trim() || null,
                attachment,
            });

            notify("Absence enregistrée.", "success");
            setValues({
                absence_type_id: "",
                starts_on: todayIso(),
                ends_on: "",
                reason: "",
            });
            setAttachment(null);
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Enregistrement impossible.", "error");
        }
    };

    return (
        <div className="form-stack">
            <Select
                label="Type d'absence"
                required
                value={values.absence_type_id}
                placeholder="Sélectionner un type"
                error={errors.absence_type_id}
                options={absenceTypes.map((type) => ({ value: String(type.id), label: type.name }))}
                onChange={(event) =>
                    setValues((current) => ({ ...current, absence_type_id: event.target.value }))
                }
            />
            <div className="form-two-columns">
                <Input
                    label="Du"
                    type="date"
                    required
                    value={values.starts_on}
                    error={errors.starts_on}
                    onChange={(event) =>
                        setValues((current) => ({ ...current, starts_on: event.target.value }))
                    }
                />
                <Input
                    label="Au"
                    type="date"
                    value={values.ends_on}
                    error={errors.ends_on}
                    hint="Laisser vide pour une absence d'une seule journée."
                    onChange={(event) =>
                        setValues((current) => ({ ...current, ends_on: event.target.value }))
                    }
                />
            </div>
            <Textarea
                label="Motif"
                rows={3}
                value={values.reason}
                onChange={(event) =>
                    setValues((current) => ({ ...current, reason: event.target.value }))
                }
            />
            <FileUpload
                label="Justificatif"
                required={selectedType?.requires_attachment}
                error={errors.attachment}
                hint="PDF, JPG ou PNG — 4 Mo maximum."
                onChange={setAttachment}
            />
            <div className="camera-actions">
                <Button onClick={submit} loading={submitting}>
                    Enregistrer
                </Button>
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel} disabled={submitting}>
                        Annuler
                    </Button>
                )}
            </div>
        </div>
    );
}