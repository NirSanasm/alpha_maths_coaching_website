import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { verifyAdminPassword, createAdminSessionToken, getAdminCookieOptions } from "@/lib/auth";
import { getClientIp, checkAdminLoginRateLimit, recordAdminLoginAttempt } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const allowed = await checkAdminLoginRateLimit(clientIp, 5, 15);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const isValid = verifyAdminPassword(parsed.data.password);
    if (!isValid) {
      await recordAdminLoginAttempt(clientIp);
      return NextResponse.json(
        { error: "Incorrect administrative password." },
        { status: 401 }
      );
    }

    // Create signed JWT session
    const token = await createAdminSessionToken();
    const cookieOpts = getAdminCookieOptions();

    const response = NextResponse.json({ success: true, message: "Logged in successfully" });
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Authentication system error" }, { status: 500 });
  }
}
