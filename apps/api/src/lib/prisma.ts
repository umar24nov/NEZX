import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { __nezxPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__nezxPrisma ??
  new PrismaClient({
    adapter,
    log: env.isProd ? ["error"] : ["warn", "error"],
  });

if (!env.isProd) {
  globalForPrisma.__nezxPrisma = prisma;
}
