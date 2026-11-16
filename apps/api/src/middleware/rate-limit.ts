import { rateLimit } from "express-rate-limit";

const json = (code: string, message: string) => ({
  error: { code, message },
});

/** Public form submissions: generous for humans, tight for scripts. */
export const enquiryRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(json("RATE_LIMITED", "Too many enquiries from this connection. Try again later."));
  },
});

/** Backstop for everything else under /api. */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(json("RATE_LIMITED", "Too many requests. Please slow down."));
  },
});
