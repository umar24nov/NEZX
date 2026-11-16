import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://nezx:nezx@localhost:5432/nezx_test?schema=public",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-test-secret",
      BETTER_AUTH_URL: "http://localhost:4000",
      WEB_ORIGINS: "http://localhost:5173",
    },
  },
});
