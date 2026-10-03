"use client";

import { useEffect, useRef } from "react";

export function useScrollReveal(options?: { threshold?: number; rootMargin?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: options?.threshold ?? 0.1,
                rootMargin: options?.rootMargin ?? "0px",
            },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [options?.threshold, options?.rootMargin]);

    return ref;
}
