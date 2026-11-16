import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../env.js";
import { ApiError } from "../lib/api-error.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No route matches ${req.method} ${req.originalUrl}.`,
    },
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) return;

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.length ? issue.path.join(".") : "_form";
      (details[key] ??= []).push(issue.message);
    }

    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Some fields need your attention.",
        details,
      },
    });
    return;
  }

  logger.error("Unhandled API error", {
    method: req.method,
    path: req.originalUrl,
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong on our side. Please try again.",
    },
  });
}

/** Express identifies JSON body parse errors by their `type` property. */
export function jsonBodyErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    error instanceof SyntaxError &&
    "type" in error &&
    (error as { type?: string }).type === "entity.parse.failed"
  ) {
    res.status(400).json({
      error: { code: "INVALID_JSON", message: "The request body is not valid JSON." },
    });
    return;
  }
  next(error);
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (env.isTest) return next();

  const started = performance.now();
  res.on("finish", () => {
    const duration = Math.round(performance.now() - started);
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
}
