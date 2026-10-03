"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "pointa.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
    if (typeof window === "undefined") {
        return "light";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    return stored === "dark" || stored === "system" ? stored : "light";
}

function readSystemDark(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(readStoredTheme);
    const [systemDark, setSystemDark] = useState(readSystemDark);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);

        media.addEventListener("change", listener);

        return () => media.removeEventListener("change", listener);
    }, []);

    const resolvedTheme: "light" | "dark" =
        theme === "system" ? (systemDark ? "dark" : "light") : theme;

    useEffect(() => {
        document.documentElement.dataset.theme = resolvedTheme;
    }, [resolvedTheme]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme,
            resolvedTheme,
            setTheme: (next: Theme) => {
                setThemeState(next);
                window.localStorage.setItem(STORAGE_KEY, next);
            },
        }),
        [theme, resolvedTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme doit être utilisé dans un ThemeProvider.");
    }

    return context;
}