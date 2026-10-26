import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Missing DATABASE_URL / DATABASE_URL_UNPOOLED");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  console.log("Running migration on Neon Lakebase Postgres...");

  await sql`
    CREATE SEQUENCE IF NOT EXISTS form_number_seq START WITH 1 INCREMENT BY 1;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      form_no VARCHAR(32) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      dob DATE NOT NULL,
      gender VARCHAR(20) NOT NULL,
      father_name VARCHAR(255) NOT NULL,
      guardian_name VARCHAR(255),
      address TEXT NOT NULL,
      current_class VARCHAR(50) NOT NULL,
      school VARCHAR(255) NOT NULL,
      contact_number VARCHAR(20) NOT NULL,
      whatsapp_number VARCHAR(20) NOT NULL,
      course_category VARCHAR(50) NOT NULL,
      photo_key VARCHAR(255),
      photo_mime VARCHAR(50),
      photo_size INT,
      status VARCHAR(20) NOT NULL DEFAULT 'New',
      admin_notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at DESC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_submissions_course_category ON submissions (course_category);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      ip_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_created ON rate_limits (ip_hash, created_at);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_login_rate_limits (
      id SERIAL PRIMARY KEY,
      ip_hash VARCHAR(64) NOT NULL,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_login_rate ON admin_login_rate_limits (ip_hash, attempted_at);
  `;

  console.log("Migration executed successfully!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
