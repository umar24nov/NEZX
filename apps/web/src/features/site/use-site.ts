import { useQuery } from "@tanstack/react-query";
import { DEFAULT_SITE, type SitePayload } from "@nezx/shared";

import { apiFetch } from "@/lib/api";

export const siteQueryKey = ["site"] as const;

export function useSite() {
  return useQuery<SitePayload>({
    queryKey: siteQueryKey,
    queryFn: () => apiFetch<SitePayload>("/api/site"),
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_SITE,
    retry: 1,
  });
}
