import { env } from "../env.js";
import { logger } from "./logger.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token. When no secret is configured (local
 * development, tests) verification is skipped and a warning is logged once.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string | undefined,
): Promise<{ ok: boolean; reason?: string }> {
  if (!env.turnstileEnabled) return { ok: true };

  if (!token) return { ok: false, reason: "missing-input-response" };

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY as string,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      logger.warn("Turnstile verification returned a non-2xx response", {
        status: response.status,
      });
      return { ok: false, reason: "verification-unavailable" };
    }

    const data = (await response.json()) as TurnstileResponse;
    if (!data.success) {
      logger.warn("Turnstile rejected a submission", { codes: data["error-codes"] });
    }
    return { ok: data.success, reason: data["error-codes"]?.join(",") };
  } catch (error) {
    logger.error("Turnstile verification failed", { error: String(error) });
    return { ok: false, reason: "verification-error" };
  }
}
