"use client";

import { ScanHistory } from "@/components/scanner";

export default function PointageJournalPage() {
    return (
        <>
            <header className="page-heading">
                <div>
                    <p className="eyebrow">Pointage</p>
                    <h1>Journal des scans</h1>
                    <p className="page-subtitle">
                        Historique des pointages enregistrés sur cet appareil.
                    </p>
                </div>
            </header>

            <ScanHistory />
        </>
    );
}
