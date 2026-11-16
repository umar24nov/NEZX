import { createAuthClient } from "better-auth/react";

import { API_ORIGIN } from "./api";

export const authClient = createAuthClient({
  baseURL: API_ORIGIN,
  fetchOptions: {
    credentials: "include",
  },
});

export interface OwnerSessionUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
}

export function sessionRole(user: unknown): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role : undefined;
}
