import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

import fs from "node:fs";
import path from "node:path";

function loadWorkspaceEnv() {
  const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(currentDir, "../../.env"),
    path.resolve(currentDir, "../../../.env"),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile?.(envPath);
        return;
      } catch {}
    }
  }
}

loadWorkspaceEnv();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please create a .env file with DATABASE_URL=postgresql://user:password@localhost:5432/your_database or export DATABASE_URL.",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
