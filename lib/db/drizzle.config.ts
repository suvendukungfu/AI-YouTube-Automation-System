import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

function loadWorkspaceEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
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
  throw new Error("DATABASE_URL must be set. Please define DATABASE_URL in your .env file or environment.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
