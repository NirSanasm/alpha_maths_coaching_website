import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ama_admin_session";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function applySecurityHeaders(headers: Headers) {
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  applySecurityHeaders(response.headers);

  // Check if route is protected
  const isAdminLogin = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin") && !isAdminLogin;
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";
  const isPhotoRoute = pathname.startsWith("/api/photo");

  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  if (isAdminPage || isAdminApi || isPhotoRoute) {
    const authorized = await isAuthorized(request);

    if (!authorized) {
      if (isAdminApi || isPhotoRoute) {
        const unauthRes = NextResponse.json(
          { error: "Unauthorized access. Admin session required." },
          { status: 401 }
        );
        applySecurityHeaders(unauthRes.headers);
        return unauthRes;
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      applySecurityHeaders(redirectRes.headers);
      return redirectRes;
    }
  }

  // If already authenticated and visiting login page, redirect to admin dashboard
  if (isAdminLogin) {
    const authorized = await isAuthorized(request);
    if (authorized) {
      const redirectRes = NextResponse.redirect(new URL("/admin", request.url));
      applySecurityHeaders(redirectRes.headers);
      return redirectRes;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/photo/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
