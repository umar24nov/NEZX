import "dotenv/config";

import { DEFAULT_SITE } from "@nezx/shared";

import { env } from "../src/env.js";
import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";

async function seedContent() {
  const { config } = DEFAULT_SITE;

  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: { ...config },
    create: { id: "default", ...config },
  });
  console.log("✓ Site settings");

  for (const course of DEFAULT_SITE.courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        name: course.name,
        tagline: course.tagline,
        features: course.features,
        sortOrder: course.sortOrder,
        published: true,
      },
      create: {
        slug: course.slug,
        name: course.name,
        tagline: course.tagline,
        features: course.features,
        sortOrder: course.sortOrder,
      },
    });
  }
  console.log(`✓ ${DEFAULT_SITE.courses.length} courses`);

  for (const module of DEFAULT_SITE.modules) {
    await prisma.module.upsert({
      where: { slug: module.slug },
      update: {
        title: module.title,
        items: module.items,
        sortOrder: module.sortOrder,
        published: true,
      },
      create: {
        slug: module.slug,
        title: module.title,
        items: module.items,
        sortOrder: module.sortOrder,
      },
    });
  }
  console.log(`✓ ${DEFAULT_SITE.modules.length} modules`);

  for (const step of DEFAULT_SITE.steps) {
    await prisma.journeyStep.upsert({
      where: { slug: step.slug },
      update: {
        title: step.title,
        description: step.description,
        sortOrder: step.sortOrder,
        published: true,
      },
      create: {
        slug: step.slug,
        title: step.title,
        description: step.description,
        sortOrder: step.sortOrder,
      },
    });
  }
  console.log(`✓ ${DEFAULT_SITE.steps.length} journey steps`);

  for (const audience of DEFAULT_SITE.audience) {
    await prisma.audience.upsert({
      where: { slug: audience.slug },
      update: {
        title: audience.title,
        description: audience.description,
        sortOrder: audience.sortOrder,
        published: true,
      },
      create: {
        slug: audience.slug,
        title: audience.title,
        description: audience.description,
        sortOrder: audience.sortOrder,
      },
    });
  }
  console.log(`✓ ${DEFAULT_SITE.audience.length} audience groups`);

  for (const asset of DEFAULT_SITE.work) {
    await prisma.mediaAsset.upsert({
      where: { key: asset.key },
      update: {
        url: asset.url,
        posterUrl: asset.posterUrl,
        type: asset.type,
        section: "WORK",
        alt: asset.alt,
        caption: asset.caption,
        stat: asset.stat,
        sortOrder: asset.sortOrder,
        published: true,
      },
      create: {
        key: asset.key,
        url: asset.url,
        posterUrl: asset.posterUrl,
        type: asset.type,
        section: "WORK",
        alt: asset.alt,
        caption: asset.caption,
        stat: asset.stat,
        sortOrder: asset.sortOrder,
      },
    });
  }
  console.log(`✓ ${DEFAULT_SITE.work.length} work clips`);

  for (const asset of DEFAULT_SITE.results) {
    await prisma.mediaAsset.upsert({
      where: { key: asset.key },
      update: {
        url: asset.url,
        posterUrl: null,
        type: asset.type,
        section: "RESULT",
        alt: asset.alt,
        caption: asset.caption,
        stat: asset.stat,
        sortOrder: asset.sortOrder,
        published: true,
      },
      create: {
        key: asset.key,
        url: asset.url,
        posterUrl: null,
        type: asset.type,
        section: "RESULT",
        alt: asset.alt,
        caption: asset.caption,
        stat: asset.stat,
        sortOrder: asset.sortOrder,
      },
    });
  }
  console.log(`✓ ${DEFAULT_SITE.results.length} result screenshots`);
}

async function seedOwner() {
  const email = env.adminEmails[0];
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("• Skipping owner account (set ADMIN_EMAIL and ADMIN_PASSWORD)");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email, password, name: "NEZX Academy Owner" },
    });
  }

  const owner = await prisma.user.update({
    where: { email },
    data: { role: "admin", emailVerified: true },
  });

  console.log(`✓ Owner account ready: ${owner.email}`);
}

async function main() {
  console.log("Seeding NEZX Academy…\n");
  await seedContent();
  await seedOwner();
  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
