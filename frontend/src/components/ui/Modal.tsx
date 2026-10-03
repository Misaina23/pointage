"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type ModalProps = {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
    children: ReactNode;
};

export function Modal({
    open,
    title,
    subtitle,
    onClose,
    footer,
    size = "md",
    children,
}: ModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className={`modal modal-${size}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
            >
                <header className="modal-header">
                    <div>
                        <h2>{title}</h2>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
                        ×
                    </button>
                </header>
                <div className="modal-body">{children}</div>
                {footer && <footer className="modal-footer">{footer}</footer>}
            </div>
        </div>
    );
}

export type DrawerProps = ModalProps;

export function Drawer(props: DrawerProps) {
    return <Modal {...props} />;
}

export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
    return (
        <Modal open={open} title="" onClose={onClose} size="sm">
            {children}
        </Modal>
    );
}