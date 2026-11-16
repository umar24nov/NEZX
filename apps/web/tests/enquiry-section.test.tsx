import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SITE } from "@nezx/shared";

import { EnquirySection } from "@/components/site/enquiry-section";
import { useEnquiryStore } from "@/stores/enquiry-store";

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <EnquirySection courses={DEFAULT_SITE.courses} config={DEFAULT_SITE.config} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useEnquiryStore.setState({ preferredCourseSlug: null });
});

describe("EnquirySection", () => {
  it("shows validation errors and never calls the API for an empty form", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderForm();
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid phone number.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preselects a course chosen from a course card", async () => {
    useEnquiryStore.setState({ preferredCourseSlug: "amazon-global-selling" });
    renderForm();

    const courseSelect = screen.getByLabelText(/course you are interested in/i);
    await waitFor(() => expect(courseSelect).toHaveValue("amazon-global-selling"));
    expect(useEnquiryStore.getState().preferredCourseSlug).toBeNull();
  });

  it("submits the enquiry and offers a prefilled WhatsApp fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: async () => ({
        ok: true,
        id: "enquiry-1",
        createdAt: new Date().toISOString(),
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderForm();

    await user.type(screen.getByLabelText(/full name/i), "Asha Verma");
    await user.type(screen.getByLabelText(/phone \/ whatsapp/i), "9876543210");
    await user.type(screen.getByLabelText(/email/i), "asha@example.com");
    await user.click(screen.getByRole("radio", { name: "Offline (Roorkee)" }));
    await user.type(
      screen.getByLabelText(/message/i),
      "I want to sell brass bowls.",
    );

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByText("Enquiry received")).toBeInTheDocument();
    expect(screen.getByText(/we will contact you on \+919876543210/i)).toBeInTheDocument();

    const whatsapp = screen.getByRole("link", { name: /send on whatsapp/i });
    const decoded = decodeURIComponent(whatsapp.getAttribute("href") ?? "");
    expect(decoded).toContain("wa.me/916396301025");
    expect(decoded).toContain("Name: Asha Verma");
    expect(decoded).toContain("Phone: +919876543210");
    expect(decoded).toContain("Course: Etsy Selling");
    expect(decoded).toContain("Mode: Offline (Roorkee)");
    expect(decoded).toContain("I want to sell brass bowls.");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/enquiries",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
