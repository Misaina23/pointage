import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
    "/",
    "/login",
    "/manifest.webmanifest",
    "/sw.js",
    "/pointa.svg",
    "/mesupres-logo",
];

const STATIC_FILE = /\.[a-z0-9]{2,5}$/i;

export function proxy(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        STATIC_FILE.test(pathname) ||
        PUBLIC_PATHS.some((path) => pathname.startsWith(path))
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get("pointa_token")?.value;

    if (!token) {
        const loginUrl = new URL("/login", request.url);

        loginUrl.searchParams.set("redirect", pathname);

        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};