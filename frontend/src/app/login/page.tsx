"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarRange, ShieldCheck } from "lucide-react";
import { useAuth, useAuthActions } from "@/hooks";
import { homePathFor } from "@/lib/roles";
import { validateLogin } from "@/lib/validators";
import type { ValidationErrors } from "@/lib/validators";

export default function LoginPage() {
    const router = useRouter();
    const { status, roles } = useAuth();
    const { login, submitting, error } = useAuthActions();
    const [values, setValues] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (status === "authenticated") {
            router.replace(homePathFor(roles));
        }
    }, [status, roles, router]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const validation = validateLogin(values);
        setErrors(validation);
        if (Object.keys(validation).length > 0) {
            return;
        }
        const session = await login(values.email, values.password);
        if (session) {
            router.replace(homePathFor(session.roles ?? []));
        }
    };

    return (
        <div id="login-screen">
            <section className="login-left">
                <div className="blob" style={{ width: 320, height: 320, top: -100, right: -80 }} />
                <div className="blob" style={{ width: 220, height: 220, bottom: 80, left: "28%", animationDelay: "-5s" }} />
                <div className="login-brand">
                    <Image
                        className="ministry-logo ministry-logo-light"
                        src="/mesupres-logo-blanc.png"
                        alt="Ministère de l'Enseignement Supérieur et de la Recherche Scientifique"
                        width={150}
                        height={97}
                        unoptimized
                        priority
                    />
                    <span className="flag" aria-hidden>
                        <span className="flag-white" />
                        <span className="flag-right">
                            <span className="flag-red" />
                            <span className="flag-green" />
                        </span>
                    </span>
                </div>
                <div>
                    <h2>Le temps de travail,<br />enfin maîtrisé.</h2>
                    <p>
                        Pointage, congés, permissions et planning réunis dans une seule plateforme.
                        Rapide, traçable et adapté au MESupReS.
                    </p>
                    <ul className="login-highlights">
                        <li>
                            <BadgeCheck size={16} aria-hidden />
                            Badges, pointages et justificatifs
                        </li>
                        <li>
                            <CalendarRange size={16} aria-hidden />
                            Congés et permissions workflow
                        </li>
                        <li>
                            <ShieldCheck size={16} aria-hidden />
                            Rôles et permissions séparés
                        </li>
                    </ul>
                </div>
                <p className="login-footer">
                    République de Madagascar · Service disponible sur mobile et bureau
                </p>
            </section>

            <section className="login-right">
                <div className="login-box">
                    <button type="button" className="btn o s login-back" onClick={() => router.replace("/")}>
                        ← Accueil
                    </button>
                    <p className="login-kicker">Accès sécurisé</p>
                    <h2>Connexion</h2>
                    <p className="login-subtitle">Saisissez vos identifiants professionnels pour accéder à votre espace.</p>
                    <form className="form-stack" onSubmit={submit} noValidate>
                        <div className="form-group">
                            <label htmlFor="email">Adresse email</label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                value={values.email}
                                autoComplete="username"
                                aria-invalid={!!errors.email}
                                onChange={(event) =>
                                    setValues((current) => ({ ...current, email: event.target.value }))
                                }
                            />
                            {errors.email && <small className="err-msg">{errors.email}</small>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Mot de passe</label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                value={values.password}
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                onChange={(event) =>
                                    setValues((current) => ({ ...current, password: event.target.value }))
                                }
                            />
                            {errors.password && <small className="err-msg">{errors.password}</small>}
                        </div>
                        <div className="login-actions">
                            <button type="submit" className="btn" disabled={submitting}>
                                {submitting ? "Connexion…" : "Se connecter"}
                            </button>
                            <button type="button" className="btn o s">
                                Mot de passe oublié
                            </button>
                        </div>
                        {error && <p className="err-msg">{error}</p>}
                    </form>
                    <p className="login-meta">
                        Utilisez les identifiants professionnels fournis par votre administrateur.
                    </p>
                </div>
            </section>
        </div>
    );
}
