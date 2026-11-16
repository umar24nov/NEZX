import { createApp } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./lib/prisma.js";
import { logger } from "./lib/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`NEZX API listening on http://localhost:${env.PORT}`, {
    env: env.NODE_ENV,
    turnstile: env.turnstileEnabled,
    storage: env.r2 ? "r2" : "disabled",
  });
});

server.on("error", (error) => {
  logger.error("HTTP server error", { error: String(error) });
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  });

  // Do not hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
