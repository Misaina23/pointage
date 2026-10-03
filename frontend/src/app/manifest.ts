import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "PointageMisaina · MESupReS",
        short_name: "PointageMisaina",
        description: "Gestion du personnel et des présences du MESupReS.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0b6e4f",
        lang: "fr-MG",
        orientation: "portrait",
        icons: [
            { src: "/icons/maskable-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
            { src: "/pointa.svg", sizes: "any", type: "image/svg+xml" },
        ],
    };
}