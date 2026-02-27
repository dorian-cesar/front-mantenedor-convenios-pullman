import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
        const token = request.cookies.get("token")?.value;

        if (!token) {
            const loginUrl = new URL("/", request.url);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const payloadBase64 = token.split('.')[1];
            const payload = JSON.parse(atob(payloadBase64));

            if (payload.exp) {
                const expiresAt = payload.exp * 1000;
                const now = Date.now();

                if (now >= expiresAt) {
                    // Token expirado
                    const loginUrl = new URL("/", request.url);
                    const response = NextResponse.redirect(loginUrl);
                    response.cookies.delete("token");
                    return response;
                }
            }
        } catch (error) {
            const loginUrl = new URL("/", request.url);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete("token");
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};