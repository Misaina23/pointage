import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";
import "./globals.css";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    variable: "--font-montserrat",
    display: "swap",
});

export const metadata: Metadata = {
    title: "PointageMisaina | MESupReS",
    description:
        "Plateforme de gestion du personnel, du temps de travail et des processus RH du MESupReS.",
    applicationName: "PointageMisaina",
    icons: { icon: "/pointa.svg", shortcut: "/pointa.svg" },
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="fr" className={`${poppins.variable} ${montserrat.variable}`}>
            <body className="h-full antialiased">
                <ThemeProvider>
                    <AuthProvider>
                        <NotificationProvider>
                        {children}
                        <ServiceWorkerRegistrar />
                    </NotificationProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}