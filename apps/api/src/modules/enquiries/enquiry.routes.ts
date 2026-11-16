import { Router } from "express";
import { enquiryApiSchema } from "@nezx/shared";

import { ApiError } from "../../lib/api-error.js";
import { hashIp } from "../../lib/ip.js";
import { logger } from "../../lib/logger.js";
import { verifyTurnstile } from "../../lib/turnstile.js";
import { enquiryRateLimit } from "../../middleware/rate-limit.js";
import { createEnquiry } from "./enquiry.service.js";

export const enquiryRouter = Router();

enquiryRouter.post("/enquiries", enquiryRateLimit, async (req, res) => {
  const input = enquiryApiSchema.parse(req.body);

  // Honeypot: pretend success, store nothing.
  if (input.website) {
    logger.debug("Honeypot triggered on enquiry form");
    res.status(202).json({ ok: true });
    return;
  }

  const turnstile = await verifyTurnstile(input.turnstileToken, req.ip);
  if (!turnstile.ok) {
    throw new ApiError(
      400,
      "VERIFICATION_FAILED",
      "Please complete the verification and try again.",
    );
  }

  const enquiry = await createEnquiry(input, {
    ipHash: hashIp(req.ip),
    userAgent: req.get("user-agent")?.slice(0, 300),
  });

  logger.info("New enquiry received", {
    id: enquiry.id,
    course: enquiry.courseLabel,
    mode: enquiry.mode,
  });

  res.status(201).json({
    ok: true,
    id: enquiry.id,
    createdAt: enquiry.createdAt,
  });
});
