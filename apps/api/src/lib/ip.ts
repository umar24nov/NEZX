import { createHash } from "node:crypto";

import { env } from "../env.js";

/** Hash visitor IPs before storing them, so the inbox stays privacy friendly. */
export function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256")
    .update(`${env.BETTER_AUTH_SECRET}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}
