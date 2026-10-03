"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

function AnimatedHeroCards() {
    const [mobileLayout, setMobileLayout] = useState(false);
    const [rotation, setRotation] = useState(0);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const media = window.matchMedia("(max-width: 760px)");
        const updateLayout = () => setMobileLayout(media.matches);

        updateLayout();
        media.addEventListener("change", updateLayout);

        return () => media.removeEventListener("change", updateLayout);
    }, []);

    useEffect(() => {
        if (!mobileLayout || reduceMotion) {
            return;
        }

        const timer = window.setInterval(() => {
            setRotation((current) => (current + 1) % 3);
        }, 5000);

        return () => window.clearInterval(timer);
    }, [mobileLayout, reduceMotion]);

    const cards = [
        {
            id: "today",
            content: (
                <>
                    <span className="fc-title">
                        <span className="dot-live" /> Aujourd&apos;hui
                    </span>
                    <div className="fc-value">08:03</div>
                    <span className="tag ok" style={{ marginTop: 8 }}>À l&apos;heure</span>
                </>
            ),
        },
        {
            id: "leave",
            content: (
                <div className="fc-row">
                    <span className="avatar-circle" style={{ background: "var(--okb)", color: "var(--ok)" }}>
                        <svg className="i i-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <div>
                        <b style={{ fontSize: 14 }}>Congé annuel</b>
                        <div className="mut-xs">5 → 9 oct. · Accepté</div>
                    </div>
                </div>
            ),
        },
        {
            id: "approval",
            content: (
                <div className="fc-row">
                    <span className="avatar-circle">
                        <svg className="i i-sm" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" /></svg>
                    </span>
                    <div>
                        <b style={{ fontSize: 14 }}>Avis du chef</b>
                        <div className="mut-xs">Favorable · RH notifiée</div>
                    </div>
                </div>
            ),
        },
    ];
    const orderedCards = cards.map((_, index) => cards[(index + rotation) % cards.length]);

    return (
        <div className="hero-visual" aria-hidden>
            {orderedCards.map((card) => (
                <motion.div
                    className="float-card"
                    key={card.id}
                    layout={mobileLayout ? "position" : false}
                    transition={{
                        layout: {
                            duration: reduceMotion ? 0 : 1.4,
                            ease: [0.2, 0.7, 0.2, 1],
                        },
                    }}
                >
                    {card.content}
                </motion.div>
            ))}
        </div>
    );
}

function HeroSimulator() {
    const [arrival, setArrival] = useState("08:00");
    const [departure, setDeparture] = useState("17:00");
    const [schedule, setSchedule] = useState("08:00");

    const toMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const arrived = toMinutes(arrival);
    const left = toMinutes(departure);
    const start = toMinutes(schedule);

    let tone: "ok" | "w" = "ok";
    let label = "Présent";

    if (left <= arrived) {
        tone = "w";
        label = "Incomplet";
    } else {
        const late = Math.max(0, arrived - start);
        if (late > 15) {
            tone = "w";
            label = `Retard ${late} min`;
        } else if (late > 0) {
            tone = "w";
            label = `Retard léger ${late} min`;
        } else {
            tone = "ok";
            label = "À l'heure";
        }
    }

    return (
        <div className="simulator">
            <label>
                <span>Début</span>
                <input type="time" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
            </label>
            <label>
                <span>Arrivée</span>
                <input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} />
            </label>
            <label>
                <span>Sortie</span>
                <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} />
            </label>
            <label>
                <span>Tolérance (min)</span>
                <input type="number" value="10" readOnly />
            </label>
            <span className={`sim-tag ${tone}`}>{label}</span>
        </div>
    );
}

const faqs = [
    {
        q: "Comment un retard est-il calculé ?",
        a: "L'administration fixe l'heure de début et la tolérance. Au-delà de la tolérance, le retard est compté en minutes depuis l'heure de début officielle.",
    },
    {
        q: "Qui peut scanner un badge ?",
        a: "Uniquement le personnel de sécurité, depuis son espace dédié. Chaque scan est horodaté et associé à l'agent connecté.",
    },
    {
        q: "Quand une demande est-elle acceptée ?",
        a: "Quand le chef a donné un avis favorable et que les RH ont validé. Dans tous les autres cas, elle est refusée et notifiée à l'employé.",
    },
    {
        q: "Qui définit les horaires de travail ?",
        a: "L'administrateur, depuis la page Horaires. Le changement s'applique immédiatement aux calculs de retard et aux pointages suivants.",
    },
];

export default function Home() {
    const [scrolled, setScrolled] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div id="landing">
            <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
                <div className="navbar-inner container">
                    <Link href="/" className="logo">
                        <Image
                            className="ministry-logo"
                            src="/mesupres-logo.png"
                            alt="Ministère de l'Enseignement Supérieur et de la Recherche Scientifique"
                            width={120}
                            height={78}
                            unoptimized
                            priority
                        />
                    </Link>
                    <span className="flag landing-mobile-flag" aria-hidden>
                        <span className="flag-white" />
                        <span className="flag-right">
                            <span className="flag-red" />
                            <span className="flag-green" />
                        </span>
                    </span>
                    <button
                        type="button"
                        className="landing-menu-toggle"
                        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                        aria-expanded={menuOpen}
                        aria-controls="landing-navigation"
                        onClick={() => setMenuOpen((isOpen) => !isOpen)}
                    >
                        {menuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
                    </button>
                    <nav
                        id="landing-navigation"
                        className={`landing-nav ${menuOpen ? "open" : ""}`}
                        aria-label="Navigation principale"
                    >
                        <a href="#landing" onClick={() => setMenuOpen(false)}>Accueil</a>
                        <a href="#how" onClick={() => setMenuOpen(false)}>Fonctionnement</a>
                        <a href="#rules" onClick={() => setMenuOpen(false)}>Règles</a>
                        <a href="#about" onClick={() => setMenuOpen(false)}>À propos</a>
                        <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
                        <Link href="/login" className="btn s" onClick={() => setMenuOpen(false)}>
                            Se connecter
                        </Link>
                    </nav>
                </div>
            </header>

            <section className="hero">
                <div className="container hero-grid">
                    <div>
                        <span className="eyebrow">MESupReS</span>
                        <h1>
                            Le temps de travail, <br />
                            <em>enfin maîtrisé.</em>
                        </h1>
                        <p className="lead">
                            Pointage par badge QR, congés validés par le chef puis les RH,
                            notifications en temps réel. Une seule plateforme pour toute l&apos;administration.
                        </p>
                        <div className="hero-actions">
                            <Link href="/login" className="btn">
                                Se connecter
                            </Link>
                            <a href="#how" className="btn o">
                                Comment ça marche
                            </a>
                        </div>
                        <HeroSimulator />
                    </div>
                    <AnimatedHeroCards />
                </div>

                <div className="container">
                    <div className="trust-bar">
                        <div className="trust-item">
                            <span className="trust-icon">
                                <svg className="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                            </span>
                            Retards automatiques
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">
                                <svg className="i" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2.2.6 3.5 2.4 3.5 5.2" /></svg>
                            </span>
                            Validation à deux niveaux
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">
                                <svg className="i" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" /></svg>
                            </span>
                            Notifications en direct
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">
                                <svg className="i" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17" /></svg>
                            </span>
                            Historique complet
                        </div>
                    </div>
                </div>
            </section>

            <section className="section" id="how">
                <div className="container">
                    <ScrollReveal>
                        <span className="eyebrow">Simple et transparent</span>
                        <h2 className="section-title">Comment ça marche</h2>
                        <p className="section-sub">
                            Trois étapes suffisent pour gérer le temps de travail de toute une équipe,
                            de manière simple et sécurisée.
                        </p>
                    </ScrollReveal>
                    <ScrollReveal className="steps-grid">
                        <div className="step-card">
                            <div className="step-num">01</div>
                            <h3>Pointez</h3>
                            <p>L&apos;agent de sécurité scanne le badge QR. Le système compare avec l&apos;horaire et indique automatiquement si l&apos;employé est à l&apos;heure ou en retard.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">02</div>
                            <h3>Demandez</h3>
                            <p>Congé, permission ou absence : le personnel dépose sa demande depuis son téléphone ou son ordinateur en quelques clics.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">03</div>
                            <h3>Validez</h3>
                            <p>Le chef donne son avis, les RH décident. La demande n&apos;est acceptée que si les deux disent oui, sinon elle est refusée.</p>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="section-sm" id="rules" style={{ background: "#f8fafb" }}>
                <div className="container">
                    <ScrollReveal>
                        <span className="eyebrow">Règles claires</span>
                        <h2 className="section-title">Ce que PointageMisaina gère,<br />et ce qu&apos;il refuse</h2>
                        <p className="section-sub">
                            Un cadre précis pour garantir la fiabilité et la sécurité des données de pointage.
                        </p>
                    </ScrollReveal>
                    <ScrollReveal>
                        <div className="marquee-wrap">
                            <div className="marquee-track">
                                {["Retards", "Heures travaillées", "Absences", "Congés", "Permissions", "Notifications", "Historique"].map((item) => (
                                    <span key={item} className="pill yes">
                                        <svg className="i" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                                        {item}
                                    </span>
                                ))}
                            </div>
                            <div className="marquee-track rev" aria-hidden>
                                {["Congé sans avis du chef", "Décision RH sans avis", "Horaire modifié par le personnel", "Scan par un non-agent", "Demande sans motif"].map((item) => (
                                    <span key={item} className="pill no">
                                        <svg className="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="section" id="about">
                <div className="container about-grid">
                    <ScrollReveal>
                        <div>
                            <span className="eyebrow">À propos</span>
                            <h2 className="section-title">Gagner du temps,<br />garder le contrôle</h2>
                            <p className="section-sub" style={{ marginBottom: 0 }}>
                                PointageMisaina remplace les cahiers et les tableurs par une seule plateforme :
                                horaires définis par l&apos;administration, pointage par badge QR,
                                demandes suivies de bout en bout.
                            </p>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal>
                        <div className="about-cards">
                            <div className="card h">
                                <span className="trust-icon" style={{ marginBottom: 14 }}>
                                    <svg className="i" viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
                                </span>
                                <h4>Économisez du temps</h4>
                                <p>Plus de calcul manuel des retards.</p>
                            </div>
                            <div className="card h">
                                <span className="trust-icon" style={{ marginBottom: 14 }}>
                                    <svg className="i" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6z" /></svg>
                                </span>
                                <h4>Tout est tracé</h4>
                                <p>Chaque avis et décision sont datés.</p>
                            </div>
                            <div className="card h">
                                <span className="trust-icon" style={{ marginBottom: 14 }}>
                                    <svg className="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></svg>
                                </span>
                                <h4>Partout</h4>
                                <p>Ordinateur, tablette ou téléphone.</p>
                            </div>
                            <div className="card h">
                                <span className="trust-icon" style={{ marginBottom: 14 }}>
                                    <svg className="i" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12.5h.01M3 10h18" /></svg>
                                </span>
                                <h4>Sécurisé</h4>
                                <p>Chaque rôle voit son espace dédié.</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="section" id="faq" style={{ background: "#f8fafb" }}>
                <div className="container">
                    <ScrollReveal>
                        <span className="eyebrow">Foire aux questions</span>
                        <h2 className="section-title">Vous avez des questions ?</h2>
                        <p className="section-sub">
                            Retrouvez les réponses aux questions les plus fréquentes concernant
                            l&apos;utilisation de PointageMisaina et la sécurité des données.
                        </p>
                    </ScrollReveal>
                    <ScrollReveal>
                        <div className="faq-list">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className={`faq-item ${openFaq === index ? "open" : ""}`}
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                >
                                    <p className="faq-q">{faq.q}</p>
                                    <p className="faq-a">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="cta-section">
                <div className="container">
                    <ScrollReveal>
                        <h2>Prêt à simplifier la gestion<br />du personnel ?</h2>
                        <p>Connectez-vous à votre espace PointageMisaina et commencez dès aujourd&apos;hui.</p>
                        <Link href="/login" className="btn white">Se connecter</Link>
                    </ScrollReveal>
                </div>
            </section>

            <footer>
                <div className="container">
                    <div>
                        <div className="logo" style={{ color: "#fff", marginBottom: 16 }}>
                            <Image
                                className="ministry-logo ministry-logo-light"
                                src="/mesupres-logo-blanc.png"
                                alt="Ministère de l'Enseignement Supérieur et de la Recherche Scientifique"
                                width={150}
                                height={97}
                                unoptimized
                            />
                        </div>
                        <p style={{ color: "#8fa0b0", fontSize: 14, lineHeight: 1.7, maxWidth: 320 }}>
                            Ministère de l&apos;Enseignement Supérieur<br />
                            et de la Recherche Scientifique
                        </p>
                    </div>
                    <div>
                        <h5>Produit</h5>
                        <ul>
                            <li><a href="#how">Fonctionnement</a></li>
                            <li><a href="#rules">Règles</a></li>
                            <li><a href="#about">À propos</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5>Support</h5>
                        <ul>
                            <li><a href="#faq">FAQ</a></li>
                            <li><a href="#">Contact</a></li>
                            <li><a href="#">Documentation</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5>Légal</h5>
                        <ul>
                            <li><a href="#">Mentions légales</a></li>
                            <li><a href="#">Confidentialité</a></li>
                        </ul>
                    </div>
                    <div className="footer-bottom">
                        <span>
                            <span className="flag" aria-hidden style={{ marginRight: 8 }}>
                                <span className="flag-white" />
                                <span className="flag-right">
                                    <span className="flag-red" />
                                    <span className="flag-green" />
                                </span>
                            </span>
                        </span>
                        <span>© 2026 PointageMisaina. Tous droits réservés.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
