import compression from "compression";
import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";

import { env } from "./env.js";
import { auth } from "./lib/auth.js";
import { adminEnquiryRouter } from "./modules/admin/enquiry-admin.routes.js";
import { adminMediaRouter } from "./modules/media/media.routes.js";
import { enquiryRouter } from "./modules/enquiries/enquiry.routes.js";
import { siteRouter } from "./modules/site/site.routes.js";
import {
  errorHandler,
  jsonBodyErrorHandler,
  notFoundHandler,
  requestLogger,
} from "./middleware/error.js";
import { apiRateLimit } from "./middleware/rate-limit.js";

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (env.webOrigins.includes(origin)) return callback(null, true);
    if (!env.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86_400,
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY > 0 ? env.TRUST_PROXY : false);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: env.isProd ? undefined : false,
    }),
  );
  app.use(cors(corsOptions));

  // Better Auth must see the raw request body, so it is mounted before the
  // JSON parser. Express 5 requires named wildcards.
  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(express.json({ limit: "64kb" }));
  app.use(jsonBodyErrorHandler);
  app.use(compression());
  app.use(requestLogger);

  app.get("/", (_req, res) => {
    res.json({
      name: "NEZX Academy API",
      version: "1.0.0",
      health: "/api/health",
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiRateLimit);
  app.use("/api", siteRouter);
  app.use("/api", enquiryRouter);
  app.use("/api", adminEnquiryRouter);
  app.use("/api", adminMediaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
