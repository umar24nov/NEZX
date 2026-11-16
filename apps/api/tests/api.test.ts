import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  siteConfig: { findUnique: vi.fn() },
  course: { findMany: vi.fn(), findFirst: vi.fn() },
  module: { findMany: vi.fn() },
  journeyStep: { findMany: vi.fn() },
  audience: { findMany: vi.fn() },
  mediaAsset: { findMany: vi.fn() },
  enquiry: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  $disconnect: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  getSessionFromHeaders: vi.fn(),
}));

vi.mock("better-auth/node", () => ({
  toNodeHandler: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  fromNodeHeaders: (headers: unknown) => headers,
}));

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../src/lib/auth.js", () => ({
  auth: {},
  getSessionFromHeaders: authMock.getSessionFromHeaders,
}));

import { DEFAULT_SITE, isValidPhone, normalizePhone } from "@nezx/shared";
import { createApp } from "../src/app.js";

const app = createApp();

const enquiryRow = (overrides: Record<string, unknown> = {}) => ({
  id: "enq_test",
  name: "Asha Verma",
  phone: "+916396301025",
  email: null,
  courseSlug: null,
  courseLabel: "Not sure yet",
  mode: "ONLINE",
  message: null,
  status: "NEW",
  adminNote: null,
  source: "website",
  ipHash: null,
  userAgent: null,
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  authMock.getSessionFromHeaders.mockResolvedValue(null);

  prismaMock.siteConfig.findUnique.mockResolvedValue(null);
  prismaMock.course.findMany.mockResolvedValue([]);
  prismaMock.course.findFirst.mockResolvedValue(null);
  prismaMock.module.findMany.mockResolvedValue([]);
  prismaMock.journeyStep.findMany.mockResolvedValue([]);
  prismaMock.audience.findMany.mockResolvedValue([]);
  prismaMock.mediaAsset.findMany.mockResolvedValue([]);
  prismaMock.enquiry.count.mockResolvedValue(0);
  prismaMock.enquiry.groupBy.mockResolvedValue([]);
  prismaMock.enquiry.findMany.mockResolvedValue([]);
});

describe("phone helpers", () => {
  it("accepts Indian and international formats", () => {
    expect(isValidPhone("63963 01025")).toBe(true);
    expect(isValidPhone("+91 63963 01025")).toBe(true);
    expect(isValidPhone("639630102")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
  });

  it("normalises to E.164", () => {
    expect(normalizePhone("63963 01025")).toBe("+916396301025");
    expect(normalizePhone("+91 63963 01025")).toBe("+916396301025");
    expect(normalizePhone("0 63963 01025")).toBe("+916396301025");
  });
});

describe("GET /api", () => {
  it("reports health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("serves bundled content when the database is unavailable", async () => {
    prismaMock.course.findMany.mockRejectedValue(new Error("connection refused"));
    prismaMock.module.findMany.mockRejectedValue(new Error("connection refused"));
    prismaMock.journeyStep.findMany.mockRejectedValue(new Error("connection refused"));
    prismaMock.audience.findMany.mockRejectedValue(new Error("connection refused"));
    prismaMock.mediaAsset.findMany.mockRejectedValue(new Error("connection refused"));
    prismaMock.siteConfig.findUnique.mockRejectedValue(new Error("connection refused"));

    const response = await request(app).get("/api/site");

    expect(response.status).toBe(200);
    expect(response.body.courses).toHaveLength(DEFAULT_SITE.courses.length);
    expect(response.body.config.phone).toBe(DEFAULT_SITE.config.phone);
  });

  it("lists courses", async () => {
    const response = await request(app).get("/api/courses");
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(DEFAULT_SITE.courses.length);
  });
});

describe("POST /api/enquiries", () => {
  it("creates an enquiry and normalises the phone number", async () => {
    prismaMock.enquiry.create.mockResolvedValue(enquiryRow());

    const response = await request(app).post("/api/enquiries").send({
      name: "Asha Verma",
      phone: "63963 01025",
      email: "asha@example.com",
      courseSlug: "unsure",
      mode: "ONLINE",
      message: "I want to start with handmade jewellery.",
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);

    const data = prismaMock.enquiry.create.mock.calls[0]?.[0].data;
    expect(data.phone).toBe("+916396301025");
    expect(data.courseLabel).toBe("Not sure yet");
    expect(data.email).toBe("asha@example.com");
    expect(prismaMock.course.findFirst).not.toHaveBeenCalled();
  });

  it("attaches a known course", async () => {
    prismaMock.course.findFirst.mockResolvedValue({ slug: "etsy-selling", name: "Etsy Selling" });
    prismaMock.enquiry.create.mockResolvedValue(
      enquiryRow({ courseSlug: "etsy-selling", courseLabel: "Etsy Selling" }),
    );

    const response = await request(app).post("/api/enquiries").send({
      name: "Asha Verma",
      phone: "+91 63963 01025",
      courseSlug: "etsy-selling",
      mode: "OFFLINE",
    });

    expect(response.status).toBe(201);
    expect(prismaMock.enquiry.create.mock.calls[0]?.[0].data.courseSlug).toBe("etsy-selling");
    expect(prismaMock.enquiry.create.mock.calls[0]?.[0].data.mode).toBe("OFFLINE");
  });

  it("rejects an unknown course", async () => {
    const response = await request(app).post("/api/enquiries").send({
      name: "Asha Verma",
      phone: "6396301025",
      courseSlug: "does-not-exist",
      mode: "ONLINE",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("UNKNOWN_COURSE");
    expect(prismaMock.enquiry.create).not.toHaveBeenCalled();
  });

  it("silently drops honeypot submissions", async () => {
    const response = await request(app).post("/api/enquiries").send({
      name: "Spam Bot",
      phone: "6396301025",
      courseSlug: "unsure",
      mode: "ONLINE",
      website: "https://spam.example",
    });

    expect(response.status).toBe(202);
    expect(prismaMock.enquiry.create).not.toHaveBeenCalled();
  });

  it("returns field level validation errors", async () => {
    const response = await request(app).post("/api/enquiries").send({
      name: "A",
      phone: "123",
      email: "not-an-email",
      mode: "PIGEON",
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.name).toBeDefined();
    expect(response.body.error.details.phone).toBeDefined();
    expect(response.body.error.details.email).toBeDefined();
  });
});

describe("admin routes", () => {
  it("rejects anonymous requests", async () => {
    const response = await request(app).get("/api/admin/enquiries");
    expect(response.status).toBe(401);
  });

  it("rejects non-owner accounts", async () => {
    authMock.getSessionFromHeaders.mockResolvedValue({
      user: { id: "user_1", email: "student@example.com", role: "user", name: "Student" },
    });

    const response = await request(app).get("/api/admin/enquiries");
    expect(response.status).toBe(403);
  });

  it("returns paginated enquiries for the owner", async () => {
    authMock.getSessionFromHeaders.mockResolvedValue({
      user: { id: "user_1", email: "owner@nezxacademy.com", role: "admin", name: "Owner" },
    });
    prismaMock.enquiry.findMany.mockResolvedValue([enquiryRow()]);
    prismaMock.enquiry.count.mockResolvedValue(1);

    const response = await request(app).get("/api/admin/enquiries?status=NEW&page=1&pageSize=10");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
    expect(response.body.totalPages).toBe(1);
  });
});
