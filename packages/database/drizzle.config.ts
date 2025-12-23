import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is missing. Set DATABASE_URL (e.g. "postgresql://postgres:postgres@host:5432/streamystats").',
  );
}

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
