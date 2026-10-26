import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

export const COOKIE_NAME = "ama_admin_session";
const SESSION_DURATION_SECONDS = 12 * 60 * 60; // 12 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set and at least 16 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const actualPassword = process.env.ADMIN_PASSWORD;
  if (!actualPassword) {
    console.error("ADMIN_PASSWORD is not configured");
    return false;
  }

  // Use SHA-256 digests so both buffers are guaranteed equal length (32 bytes)
  // preventing timing attacks on password length
  const inputHash = crypto.createHash("sha256").update(inputPassword).digest();
  const actualHash = crypto.createHash("sha256").update(actualPassword).digest();

  return crypto.timingSafeEqual(inputHash, actualHash);
}

export async function createAdminSessionToken(): Promise<string> {
  const secretKey = getSecretKey();
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function getAdminSessionFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) {
    return false;
  }
  return await verifyAdminSessionToken(sessionCookie.value);
}

export function getAdminCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
