import { neon } from "@neondatabase/serverless";

// Neon serverless SQL client
// Uses pooled connection for serverless/edge queries
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

export const sql = neon(connectionString);
