import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// jsdom does not implement these browser APIs, but the UI relies on them.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: NoopObserver,
});

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: NoopObserver,
});

Object.defineProperty(window, "scrollTo", { writable: true, value: vi.fn() });

Object.defineProperty(Element.prototype, "scrollIntoView", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
  writable: true,
  value: vi.fn(() => false),
});

Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
  writable: true,
  value: vi.fn(),
});
