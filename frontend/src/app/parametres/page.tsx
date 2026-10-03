"use client";

import { Card } from "@/components/ui";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { APP_NAME, APP_ORGANIZATION } from "@/lib/constants";
import { roleLabel } from "@/lib/roles";
import { formatDateTime } from "@/lib/formatters";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const online = useOnlineStatus();

    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Système</p>
                    <h1>Paramètres</h1>
                    <p className="page-subtitle">
                        Préférences d&apos;affichage, session et informations de connexion.
                    </p>
                </div>
            </header>

            <div className="settings-grid">
                <Card title="Apparence">
                    <div className="form-stack">
                        <label className="field-label">
                            Thème
                            <select
                                className="form-control"
                                value={theme}
                                onChange={(event) =>
                                    setTheme(event.target.value as "light" | "dark" | "system")
                                }
                            >
                                <option value="light">Clair</option>
                                <option value="dark">Sombre</option>
                                <option value="system">Système</option>
                            </select>
                        </label>
                        <p className="footnote">
                            Thème appliqué actuellement : {resolvedTheme === "dark" ? "sombre" : "clair"}.
                        </p>
                    </div>
                </Card>

                <Card title="Session">
                    <dl className="profile-details">
                        <div>
                            <dt>Utilisateur</dt>
                            <dd>{user?.name ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>Adresse email</dt>
                            <dd>{user?.email ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>Rôle</dt>
                            <dd>{roleLabel(user?.roles[0])}</dd>
                        </div>
                        <div>
                            <dt>Matricule</dt>
                            <dd>{user?.employee?.employee_number ?? "—"}</dd>
                        </div>
                    </dl>
                    <div className="camera-actions">
                        <button type="button" className="button-secondary" onClick={() => void logout()}>
                            Se déconnecter
                        </button>
                    </div>
                </Card>

                <Card title="Connexion" subtitle="État de la connexion">
                    <dl className="profile-details">
                        <div>
                            <dt>Application</dt>
                            <dd>
                                {APP_NAME} · {APP_ORGANIZATION}
                            </dd>
                        </div>
                        <div>
                            <dt>État</dt>
                            <dd>
                                <span
                                    className={`status-pill status-${online ? "positive" : "pending"}`}
                                >
                                    {online ? "En ligne" : "Hors ligne"}
                                </span>
                            </dd>
                        </div>
                    </dl>
                    <p className="footnote">
                        Les scans hors ligne sont mis en file d&apos;attente locale puis synchronisés
                        automatiquement au retour du réseau.
                    </p>
                </Card>

                <Card title="Sécurité">
                    <div className="quick-actions">
                        <span className="quick-row">
                            <span className="quick-action-icon" aria-hidden>
                                1
                            </span>
                            <span>Jeton Sanctum stocké localement sur cet appareil.</span>
                        </span>
                        <span className="quick-row">
                            <span className="quick-action-icon" aria-hidden>
                                2
                            </span>
                            <span>Déconnexion pour révoquer immédiatement le jeton courant.</span>
                        </span>
                        <span className="quick-row">
                            <span className="quick-action-icon" aria-hidden>
                                3
                            </span>
                            <span>Journal d&apos;audit conservé côté serveur.</span>
                        </span>
                    </div>
                    <p className="footnote">Dernière activité : {formatDateTime(new Date())}</p>
                </Card>
            </div>
        </>
    );
}