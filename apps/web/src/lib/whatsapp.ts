import type { EnquiryMode } from "@nezx/shared";

interface WhatsAppEnquiry {
  whatsapp: string;
  greeting: string;
  name: string;
  phone: string;
  email?: string;
  courseLabel: string;
  mode: EnquiryMode;
  message?: string;
}

export function buildWhatsAppLink(enquiry: WhatsAppEnquiry): string {
  const lines = [
    enquiry.greeting,
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone}`,
    enquiry.email ? `Email: ${enquiry.email}` : null,
    `Course: ${enquiry.courseLabel}`,
    `Mode: ${enquiry.mode === "ONLINE" ? "Online" : "Offline (Roorkee)"}`,
    enquiry.message ? `Message: ${enquiry.message}` : null,
  ].filter((line): line is string => Boolean(line));

  return `https://wa.me/${enquiry.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}
