import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login"];
const PUBLIC_PATTERNS = [
    "/manifest.webmanifest",
    "/icons/",
    "/sw.js",
    "/_next/",
    "/mesupres-logo",
    "/pointa.svg",
];

function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) {
        return true;
    }
    return PUBLIC_PATTERNS.some((pattern) => pathname.startsWith(pattern));
}

export function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("pointa_token")?.value;

    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|sanctum|trpc).*)"],
};
