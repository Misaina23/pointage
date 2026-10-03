"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    tone = "primary",
    loading = false,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "primary" | "danger";
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <Modal
            open={open}
            title={title}
            onClose={onCancel}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={tone} onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <p className="modal-intro">{message}</p>
        </Modal>
    );
}