const CACHE_NAME = "pointa-shell-v2";
const SHELL_URLS = [
    "/",
    "/login",
    "/manifest.webmanifest",
    "/pointa.svg",
    "/icons/maskable-icon.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key.startsWith("pointa-") && key !== CACHE_NAME)
                    .map((key) => caches.delete(key)),
            ),
        ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(request).catch(() => {
                if (request.headers.get("accept")?.includes("application/json")) {
                    return Response.json(
                        { message: "Mode hors ligne" },
                        { status: 503 },
                    );
                }

                return Response.error();
            }),
        );
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        void caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
                    }
                    return response;
                })
                .catch(async () => (await caches.match("/")) ?? Response.error()),
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            const networkRequest = fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            });

            return cached ?? networkRequest;
        }),
    );
});
