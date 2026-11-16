import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SITE } from "@nezx/shared";

import { HomeRoute } from "@/pages/home-page";

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
        <HomeRoute />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("renders the landing page content from the bundled fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        json: async () => DEFAULT_SITE,
      }),
    );

    renderHome();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /turn your skills/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Etsy Selling" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "E-commerce basics" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tell us what you want to sell." }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Enquire now" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /owner inbox/i }).length).toBeGreaterThan(0);
  });

  it("keeps the page usable when the site API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderHome();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /turn your skills/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Amazon.in Selling" })).toBeInTheDocument();
  });
});
