import { Router } from "express";

import { courseSlugSchema } from "@nezx/shared";

import { assertFound } from "../../lib/api-error.js";
import { getCourseBySlug, getSitePayload, listCourses } from "./site.service.js";

export const siteRouter = Router();

siteRouter.get("/site", async (_req, res) => {
  const payload = await getSitePayload();
  // Content changes rarely and is safe to cache at the edge for a minute.
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(payload);
});

siteRouter.get("/courses", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ items: await listCourses() });
});

siteRouter.get("/courses/:slug", async (req, res) => {
  const { slug } = courseSlugSchema.parse(req.params);
  const course = assertFound(await getCourseBySlug(slug), "That course does not exist.");
  res.json(course);
});
