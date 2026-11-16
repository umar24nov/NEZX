import { useMutation } from "@tanstack/react-query";

import type { EnquiryFormInput } from "@nezx/shared";

import { apiFetch } from "@/lib/api";

export interface EnquiryPayload extends EnquiryFormInput {
  website?: string;
  turnstileToken?: string;
}

interface EnquiryResponse {
  ok: boolean;
  id: string;
  createdAt: string;
}

export function useCreateEnquiry() {
  return useMutation({
    mutationFn: (payload: EnquiryPayload) =>
      apiFetch<EnquiryResponse>("/api/enquiries", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
