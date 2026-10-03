import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Connexion | PointageMisaina",
    robots: { index: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}