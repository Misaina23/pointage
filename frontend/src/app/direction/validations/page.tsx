"use client";

import { useState } from "react";
import { Card, ConfirmDialog } from "@/components/ui";
import { formatDateTime, titleCase } from "@/lib/formatters";
import { listApprovals, decideApproval } from "@/services/api/reports";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { ApprovalsList } from "@/types/approval";

export default function ValidationsPage() {
    const { notify } = useNotifications();
    const approvals = useAsyncData<ApprovalsList>((signal) => listApprovals(signal), []);
    const [decision, setDecision] = useState<{ id: number; value: "approved" | "rejected" } | null>(
        null,
    );
    const [comment, setComment] = useState("");
    const [busy, setBusy] = useState(false);

    const decide = async () => {
        if (!decision) {
            return;
        }

        setBusy(true);

        try {
            const result = await decideApproval(decision.id, {
                decision: decision.value,
                comment: comment.trim() || null,
            });

            notify(result.message, "success");
            approvals.reload();
            setDecision(null);
            setComment("");
        } catch (caught) {
            notify(caught instanceof Error ? caught.message : "Décision impossible.", "error");
        } finally {
            setBusy(false);
        }
    };

    const pending = approvals.data?.data ?? [];

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Direction</p>
                    <h1>Validations</h1>
                    <p className="page-subtitle">
                        Demandes en attente de décision à votre niveau d&apos;approbation.
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
                    <p className="empty-history">Aucune demande en attente.</p>
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
                                            {approval.request ? titleCase(approval.request.type) : "Demande"} ·
                                            étape {approval.current_step}
                                            {approval.current_step_detail
                                                ? ` · ${approval.current_step_detail.name}`
                                                : ""}
                                        </span>
                                    </span>
                                    <span className="request-status-area">
                                        <span className="status-pill status-pending">En attente</span>
                                    </span>
                                </span>
                                <span className="request-description">
                                    {approval.employee?.department ?? "Sans département"} · déposé le{" "}
                                    {formatDateTime(approval.submitted_at)}
                                </span>
                                <span className="request-meta">
                                    {approval.workflow?.name ?? "Circuit par défaut"} ·{" "}
                                    {approval.request?.summary
                                        ? Object.entries(approval.request.summary)
                                              .filter(([, value]) => value !== null)
                                              .map(([key, value]) => `${key}: ${String(value)}`)
                                              .join(" · ")
                                        : ""}
                                </span>
                                {approval.history.length > 0 && (
                                    <span className="request-meta">
                                        Historique :{" "}
                                        {approval.history
                                            .map(
                                                (entry) =>
                                                    `${entry.actor ?? "système"} ${
                                                        entry.decision === "approved"
                                                            ? "a approuvé"
                                                            : "a refusé"
                                                    }`,
                                            )
                                            .join(", ")}
                                    </span>
                                )}
                                <div className="request-decisions">
                                    <button
                                        type="button"
                                        className="compact-button"
                                        onClick={() => setDecision({ id: approval.id, value: "approved" })}
                                    >
                                        Approuver
                                    </button>
                                    <button
                                        type="button"
                                        className="compact-button"
                                        onClick={() => setDecision({ id: approval.id, value: "rejected" })}
                                    >
                                        Refuser
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </Card>

            <ConfirmDialog
                open={decision !== null}
                title={decision?.value === "approved" ? "Approuver la demande" : "Refuser la demande"}
                message={
                    decision?.value === "approved"
                        ? "La demande passe à l'étape suivante du circuit ou est validée."
                        : "La demande sera définitivement rejetée."
                }
                confirmLabel={decision?.value === "approved" ? "Approuver" : "Refuser"}
                tone={decision?.value === "approved" ? "primary" : "danger"}
                loading={busy}
                onCancel={() => {
                    setDecision(null);
                    setComment("");
                }}
                onConfirm={decide}
            />

            {decision && (
                <div className="settings-grid" style={{ marginTop: 18 }}>
                    <Card title="Commentaire de décision" subtitle="Conservé dans l'historique">
                        <textarea
                            className="form-control textarea-control"
                            rows={3}
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder="Motif de la décision"
                        />
                    </Card>
                </div>
            )}
        </>
    );
}