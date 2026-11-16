import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  /** Comma separated list of allowed browser origins. */
  WEB_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:4000"),
  /** Set to a number (usually 1) when running behind Render / Cloudflare. */
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
  console.error(`Invalid environment configuration:\n${lines.join("\n")}`);
  console.error("\nCopy apps/api/.env.example to apps/api/.env and fill in the values.");
  process.exit(1);
}

const raw = parsed.data;

const webOrigins = raw.WEB_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const r2 =
  raw.R2_ACCOUNT_ID &&
  raw.R2_ACCESS_KEY_ID &&
  raw.R2_SECRET_ACCESS_KEY &&
  raw.R2_BUCKET &&
  raw.R2_PUBLIC_BASE_URL
    ? {
        accountId: raw.R2_ACCOUNT_ID,
        accessKeyId: raw.R2_ACCESS_KEY_ID,
        secretAccessKey: raw.R2_SECRET_ACCESS_KEY,
        bucket: raw.R2_BUCKET,
        publicBaseUrl: raw.R2_PUBLIC_BASE_URL.replace(/\/+$/, ""),
      }
    : null;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
  webOrigins,
  r2,
  turnstileEnabled: Boolean(raw.TURNSTILE_SECRET_KEY),
  adminEmails: raw.ADMIN_EMAIL
    ? raw.ADMIN_EMAIL.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    : [],
};

export type Env = typeof env;
