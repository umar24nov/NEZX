import { DEFAULT_SITE, type MediaDto, type SitePayload } from "@nezx/shared";

import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

const mediaSelect = {
  id: true,
  key: true,
  url: true,
  posterUrl: true,
  type: true,
  alt: true,
  caption: true,
  stat: true,
  sortOrder: true,
} as const;

const courseSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  features: true,
  sortOrder: true,
} as const;

const moduleSelect = {
  id: true,
  slug: true,
  title: true,
  items: true,
  sortOrder: true,
} as const;

const stepSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  sortOrder: true,
} as const;

const audienceSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  sortOrder: true,
} as const;

export async function getSitePayload(): Promise<SitePayload> {
  try {
    const [config, courses, modules, steps, audience, work, results] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { id: "default" } }),
      prisma.course.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: courseSelect,
      }),
      prisma.module.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: moduleSelect,
      }),
      prisma.journeyStep.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: stepSelect,
      }),
      prisma.audience.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: audienceSelect,
      }),
      prisma.mediaAsset.findMany({
        where: { published: true, section: "WORK" },
        orderBy: { sortOrder: "asc" },
        select: mediaSelect,
      }),
      prisma.mediaAsset.findMany({
        where: { published: true, section: "RESULT" },
        orderBy: { sortOrder: "asc" },
        select: mediaSelect,
      }),
    ]);

    return {
      config: config
        ? {
            phone: config.phone,
            phoneHref: config.phoneHref,
            whatsapp: config.whatsapp,
            location: config.location,
            replyTime: config.replyTime,
            formatChips: config.formatChips,
            resultsNote: config.resultsNote,
            whatsappGreeting: config.whatsappGreeting,
          }
        : DEFAULT_SITE.config,
      courses: courses.length ? courses : DEFAULT_SITE.courses,
      modules: modules.length ? modules : DEFAULT_SITE.modules,
      steps: steps.length ? steps : DEFAULT_SITE.steps,
      audience: audience.length ? audience : DEFAULT_SITE.audience,
      work: (work.length ? work : DEFAULT_SITE.work) as MediaDto[],
      results: (results.length ? results : DEFAULT_SITE.results) as MediaDto[],
    };
  } catch (error) {
    // A marketing page should never go blank because Postgres is unavailable.
    logger.warn("Falling back to bundled site content", {
      error: error instanceof Error ? error.message : String(error),
    });
    return DEFAULT_SITE;
  }
}

export async function listCourses() {
  try {
    const courses = await prisma.course.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: courseSelect,
    });
    return courses.length ? courses : DEFAULT_SITE.courses;
  } catch {
    return DEFAULT_SITE.courses;
  }
}

export async function getCourseBySlug(slug: string) {
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    select: courseSelect,
  });
  return course ?? DEFAULT_SITE.courses.find((item) => item.slug === slug) ?? null;
}
