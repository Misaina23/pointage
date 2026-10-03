"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { formatDateTime, titleCase } from "@/lib/formatters";
import { listApprovals, decideApproval } from "@/services/api/reports";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { ApprovalsList } from "@/types/approval";

export default function ManagerValidationsPage() {
    const { notify } = useNotifications();
    const approvals = useAsyncData<ApprovalsList>((signal) => listApprovals(signal), []);
    const [comment, setComment] = useState<Record<number, string>>({});
    const [busy, setBusy] = useState<number | null>(null);

    const decide = async (id: number, value: "approved" | "rejected") => {
        setBusy(id);

        try {
            const result = await decideApproval(id, {
                decision: value,
                comment: comment[id]?.trim() || null,
            });

            notify(result.message, "success");
            approvals.reload();
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Décision impossible.", "error");
        } finally {
            setBusy(null);
        }
    };

    const pending = approvals.data?.data ?? [];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Responsable</p>
                    <h1>Validations</h1>
                    <p className="page-subtitle">
                        Première étape de validation des demandes de votre équipe.
                    </p>
                </div>
                <span className="live-pill">
                    <span className="live-dot" aria-hidden />
                    {pending.length} en attente
                </span>
            </header>

            <Card title="File d&apos;attente">
                {approvals.loading ? (
                    <p className="empty-history">Chargement…</p>
                ) : pending.length === 0 ? (
                    <p className="empty-history">Aucune demande à traiter.</p>
                ) : (
                    <div className="request-list">
                        {pending.map((approval) => (
                            <article key={approval.id} className="request-card">
                                <span className="request-card-head">
                                    <span className="request-avatar" aria-hidden>
                                        {approval.employee?.employee_number?.slice(-2) ?? "?"}
                                    </span>
                                    <span className="request-main">
                                        <span className="request-title-line">
                                            {approval.employee?.full_name ?? "Employé"}
                                        </span>
                                        <span className="request-meta">
                                            {approval.request
                                                ? titleCase(approval.request.type)
                                                : "Demande"}{" "}
                                            · {formatDateTime(approval.submitted_at)}
                                        </span>
                                    </span>
                                    <span className="status-pill status-pending">En attente</span>
                                </span>
                                <textarea
                                    className="form-control textarea-control"
                                    rows={2}
                                    placeholder="Commentaire (facultatif)"
                                    value={comment[approval.id] ?? ""}
                                    onChange={(event) =>
                                        setComment((current) => ({
                                            ...current,
                                            [approval.id]: event.target.value,
                                        }))
                                    }
                                />
                                <div className="request-decisions">
                                    <button
                                        type="button"
                                        className="compact-button"
                                        disabled={busy === approval.id}
                                        onClick={() => void decide(approval.id, "approved")}
                                    >
                                        Approuver
                                    </button>
                                    <button
                                        type="button"
                                        className="compact-button"
                                        disabled={busy === approval.id}
                                        onClick={() => void decide(approval.id, "rejected")}
                                    >
                                        Refuser
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </Card>
        </>
    );
}