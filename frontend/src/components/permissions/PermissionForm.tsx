"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { FileUpload, Input, Select, Textarea } from "@/components/forms";
import { hasErrors, validatePermissionRequest } from "@/lib/validators";
import { todayIso } from "@/lib/dates";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { PermissionType, StorePermissionPayload } from "@/types/permission";
import type { ValidationErrors } from "@/lib/validators";

export function PermissionForm({
    permissionTypes,
    submitting,
    onCreate,
    onCancel,
}: {
    permissionTypes: PermissionType[];
    submitting?: boolean;
    onCreate: (payload: StorePermissionPayload) => Promise<void>;
    onCancel?: () => void;
}) {
    const { notify } = useNotifications();
    const [values, setValues] = useState({
        permission_type_id: "",
        permission_date: todayIso(),
        starts_at: "08:00",
        ends_at: "17:00",
        reason: "",
    });
    const [attachment, setAttachment] = useState<File | null>(null);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const selectedType = permissionTypes.find(
        (type) => String(type.id) === values.permission_type_id,
    );

    const submit = async () => {
        const validation = validatePermissionRequest({
            permission_type_id: values.permission_type_id
                ? Number(values.permission_type_id)
                : undefined,
            permission_date: values.permission_date,
            starts_at: values.starts_at,
            ends_at: values.ends_at,
            reason: values.reason,
        });

        setErrors(validation);

        if (hasErrors(validation)) {
            return;
        }

        if (selectedType?.requires_attachment && !attachment) {
            setErrors({ attachment: "Une pièce jointe est exigée pour ce type." });

            return;
        }

        try {
            await onCreate({
                permission_type_id: Number(values.permission_type_id),
                permission_date: values.permission_date,
                starts_at: values.starts_at,
                ends_at: values.ends_at,
                reason: values.reason.trim(),
                attachment,
            });

            notify("Demande de permission déposée.", "success");
            setValues({
                permission_type_id: "",
                permission_date: todayIso(),
                starts_at: "08:00",
                ends_at: "17:00",
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
                label="Type de permission"
                required
                value={values.permission_type_id}
                placeholder="Sélectionner un type"
                error={errors.permission_type_id}
                options={permissionTypes.map((type) => ({ value: String(type.id), label: type.name }))}
                onChange={(event) =>
                    setValues((current) => ({ ...current, permission_type_id: event.target.value }))
                }
            />
            <Input
                label="Date"
                type="date"
                required
                value={values.permission_date}
                error={errors.permission_date}
                onChange={(event) =>
                    setValues((current) => ({ ...current, permission_date: event.target.value }))
                }
            />
            <div className="form-two-columns">
                <Input
                    label="De"
                    type="time"
                    required
                    value={values.starts_at}
                    onChange={(event) =>
                        setValues((current) => ({ ...current, starts_at: event.target.value }))
                    }
                />
                <Input
                    label="À"
                    type="time"
                    required
                    value={values.ends_at}
                    error={errors.ends_at}
                    onChange={(event) =>
                        setValues((current) => ({ ...current, ends_at: event.target.value }))
                    }
                />
            </div>
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