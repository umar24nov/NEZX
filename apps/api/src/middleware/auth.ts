import type { NextFunction, Request, Response } from "express";

import { env } from "../env.js";
import { ApiError } from "../lib/api-error.js";
import { getSessionFromHeaders } from "../lib/auth.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = await getSessionFromHeaders(req.headers);

  if (!session?.user) {
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }

  const isAdmin =
    session.user.role === "admin" ||
    env.adminEmails.includes(session.user.email.toLowerCase());

  if (!isAdmin) {
    throw new ApiError(403, "FORBIDDEN", "This account does not have owner access.");
  }

  res.locals.admin = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };

  next();
}

/** Attaches the session when present, but never blocks the request. */
export async function optionalSession(req: Request, _res: Response, next: NextFunction) {
  const session = await getSessionFromHeaders(req.headers);
  if (session?.user) {
    (_res.locals as Record<string, unknown>).session = session;
  }
  next();
}
