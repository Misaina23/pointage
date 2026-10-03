"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { FileUpload, Input, Select, Textarea } from "@/components/forms";
import { suggestedLeaveDays, hasErrors, validateLeaveRequest } from "@/lib/validators";
import { todayIso } from "@/lib/dates";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { formatDays } from "@/lib/formatters";
import type { LeaveType, StoreLeavePayload } from "@/types/leave";
import type { ValidationErrors } from "@/lib/validators";

export function LeaveForm({
    leaveTypes,
    submitting,
    onCreate,
    onCancel,
}: {
    leaveTypes: LeaveType[];
    submitting?: boolean;
    onCreate: (payload: StoreLeavePayload) => Promise<void>;
    onCancel?: () => void;
}) {
    const { notify } = useNotifications();
    const [values, setValues] = useState({
        leave_type_id: "",
        starts_on: todayIso(),
        ends_on: todayIso(),
        reason: "",
    });
    const [attachment, setAttachment] = useState<File | null>(null);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const selectedType = leaveTypes.find(
        (type) => String(type.id) === values.leave_type_id,
    );
    const days = suggestedLeaveDays(values.starts_on, values.ends_on);

    const submit = async () => {
        const validation = validateLeaveRequest({
            leave_type_id: values.leave_type_id ? Number(values.leave_type_id) : undefined,
            starts_on: values.starts_on,
            ends_on: values.ends_on,
            reason: values.reason,
        });

        setErrors(validation);

        if (hasErrors(validation)) {
            return;
        }

        if (selectedType?.requires_attachment && !attachment) {
            setErrors({ attachment: "Une pièce jointe est exigée pour ce type de congé." });

            return;
        }

        try {
            await onCreate({
                leave_type_id: Number(values.leave_type_id),
                starts_on: values.starts_on,
                ends_on: values.ends_on,
                reason: values.reason.trim(),
                attachment,
            });

            notify("Demande de congé déposée.", "success");
            setValues({
                leave_type_id: "",
                starts_on: todayIso(),
                ends_on: todayIso(),
                reason: "",
            });
            setAttachment(null);
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Envoi impossible.", "error");
        }
    };

    return (
        <div className="form-stack">
            <Select
                label="Type de congé"
                required
                value={values.leave_type_id}
                placeholder="Sélectionner un type"
                error={errors.leave_type_id}
                options={leaveTypes.map((type) => ({ value: String(type.id), label: type.name }))}
                onChange={(event) =>
                    setValues((current) => ({ ...current, leave_type_id: event.target.value }))
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
                    required
                    value={values.ends_on}
                    error={errors.ends_on}
                    onChange={(event) =>
                        setValues((current) => ({ ...current, ends_on: event.target.value }))
                    }
                />
            </div>
            <p className="form-note">Durée calculée : {formatDays(days)} ouvré(s).</p>
            <Textarea
                label="Motif"
                required
                rows={3}
                value={values.reason}
                error={errors.reason}
                onChange={(event) =>
                    setValues((current) => ({ ...current, reason: event.target.value }))
                }
            />
            <FileUpload
                label="Pièce jointe"
                required={selectedType?.requires_attachment}
                error={errors.attachment}
                hint="PDF, JPG ou PNG — 4 Mo maximum."
                onChange={setAttachment}
            />
            <div className="camera-actions">
                <Button onClick={submit} loading={submitting}>
                    Déposer la demande
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