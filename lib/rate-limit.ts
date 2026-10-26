import crypto from "crypto";
import { sql } from "./db";

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip") || headers.get("cf-connecting-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "_ama_salt_2027").digest("hex");
}

export async function checkAdmissionRateLimit(ip: string, maxPerHour = 5): Promise<boolean> {
  const ipHash = hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM rate_limits
    WHERE ip_hash = ${ipHash} AND created_at > ${oneHourAgo}::timestamptz
  `;

  const count = result[0]?.count ?? 0;
  return count < maxPerHour;
}

export async function recordAdmissionSubmission(ip: string): Promise<void> {
  const ipHash = hashIp(ip);
  await sql`
    INSERT INTO rate_limits (ip_hash) VALUES (${ipHash})
  `;
}

export async function checkAdminLoginRateLimit(ip: string, maxAttempts = 5, windowMinutes = 15): Promise<boolean> {
  const ipHash = hashIp(ip);
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM admin_login_rate_limits
    WHERE ip_hash = ${ipHash} AND attempted_at > ${windowStart}::timestamptz
  `;

  const count = result[0]?.count ?? 0;
  return count < maxAttempts;
}

export async function recordAdminLoginAttempt(ip: string): Promise<void> {
  const ipHash = hashIp(ip);
  await sql`
    INSERT INTO admin_login_rate_limits (ip_hash) VALUES (${ipHash})
  `;
}
