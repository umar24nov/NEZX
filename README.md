# NEZX Academy

Production-ready e-commerce training website, enquiry API and owner dashboard for **NEZX Academy**.

The public site is a close rebuild of the supplied `index.html` prototype: dark hero, marquee, four courses, eight modules, six-step journey, work clips, result screenshots with a lightbox, audience cards, and an enquiry form with a WhatsApp fallback. Everything is served from a typed React app, with site content stored in PostgreSQL and an owner-only inbox for leads.

## Stack

| Layer      | Technology                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Frontend   | TypeScript, React 19, Vite, Tailwind CSS 4, shadcn-style UI, Radix UI    |
| Data layer | TanStack Query, Zustand, React Hook Form, Zod                            |
| API        | Node.js, Express 5, Zod, Better Auth, express-rate-limit, Helmet         |
| Database   | PostgreSQL + Prisma 7                                                    |
| Media      | Cloudflare R2 presigned uploads                                          |
| Edge       | Cloudflare Pages, WAF, Turnstile                                         |
| Quality    | Vitest, Testing Library, Supertest, Playwright, GitHub Actions           |

## Repository layout

```text
.
├── apps/
│   ├── api/                 Express API, Prisma schema, migrations and seed
│   │   ├── prisma/          schema.prisma, migrations, seed.ts
│   │   └── src/             app, routes, services, auth, R2, tests
│   └── web/                 React + Vite frontend
│       ├── public/          favicon, robots, sitemap, headers, media
│       ├── src/             components, features, pages, stores, lib
│       ├── tests/           Vitest + Testing Library
│       └── e2e/             Playwright smoke tests
├── packages/
│   └── shared/              Zod schemas, DTOs and default site content
├── docs/                    Deployment and API documentation
├── docker-compose.yml       Local PostgreSQL
└── .github/workflows/ci.yml Typecheck, tests, build and e2e
```

`packages/shared` is the single source of truth for the API contract and the default content. The site falls back to the bundled content if the API or database is unavailable, so the landing page never blanks.

## Quick start

**Prerequisites:** Node.js 22+, npm 10+, and either Docker or a local PostgreSQL 16 instance.

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Create environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` and replace `BETTER_AUTH_SECRET` with a random 32+ character value:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then generate the Prisma client, apply the initial migration and seed content + the owner account:

```bash
npm run setup
```

Start both apps:

```bash
npm run dev
```

| Service        | URL                              |
| -------------- | -------------------------------- |
| Website        | http://localhost:5173            |
| API            | http://localhost:4000            |
| API health     | http://localhost:4000/api/health |
| Owner inbox    | http://localhost:5173/admin      |

The owner account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `apps/api/.env`. Defaults in `.env.example` are `owner@nezxacademy.com` / `ChangeMe-12345` — change them before deploying.

## Scripts

| Command                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Build shared, then run API and web together                |
| `npm run build`        | Production build for shared, API and web                   |
| `npm run typecheck`    | TypeScript across all workspaces                           |
| `npm test`             | Unit/integration tests (builds shared first)               |
| `npm run test:e2e`     | Playwright smoke tests against the production preview      |
| `npm run db:generate`  | Generate the Prisma client                                 |
| `npm run db:migrate`   | Create/apply a migration in development                    |
| `npm run db:deploy`    | Apply committed migrations in production                   |
| `npm run db:seed`      | Seed content and the owner account                         |
| `npm run db:studio`    | Open Prisma Studio                                         |
| `npm run format`       | Format with Prettier                                       |

## Content and media

- Default copy, course data, modules, journey steps, audience cards and seeded media live in `packages/shared/src/content.ts`.
- The database is the runtime source of truth. `GET /api/site` returns published rows and falls back to `DEFAULT_SITE` if the query fails.
- `/admin` is protected by Better Auth. An account is an owner when `User.role === "admin"` or its email is listed in `ADMIN_EMAIL`.
- The Media tab uploads images/videos straight to R2 through short-lived presigned URLs. Publishing or hiding an item updates the public site immediately.
- Local seeded media is copied to `apps/web/public/media` so the site works before R2 is configured.

## Documentation

- [Deployment guide](docs/DEPLOYMENT.md) — Cloudflare Pages, Render, managed PostgreSQL, R2, Turnstile, WAF and DNS.
- [API reference](docs/API.md) — public and owner endpoints, payloads, errors and rate limits.

## Security highlights

- Validation at every boundary with shared Zod schemas (server never trusts the client).
- Better Auth email/password sessions with `HttpOnly`, `SameSite=Lax`, `Secure` cookies in production.
- Admin checks enforced in the API, not only in the UI.
- Honeypot + Cloudflare Turnstile on the public enquiry form.
- Per-IP rate limits: 8 enquiries / 10 min, 600 API requests / 15 min.
- Helmet headers, explicit CORS allowlist, 64 kB JSON body cap.
- Private R2 credentials stay on the API; the browser only receives short-lived presigned PUT URLs.
- Secrets are ignored by Git; CI never uses production credentials.

## Troubleshooting

**`Can't reach database server`** — make sure `docker compose up -d` is running and `DATABASE_URL` matches the container credentials.

**Prisma client errors after a schema change** — run `npm run db:generate` (and `npm run db:migrate` in development).

**`/admin` signs in but requests return 403** — the signed-in email is not an owner. Set `ADMIN_EMAIL` on the API or promote the user's `role` to `admin`, then restart.

**Uploads return 503** — R2 is not configured. Fill `R2_ACCOUNT_ID`, keys, bucket and public base URL in `apps/api/.env`.

**Cookies are rejected in production** — serve the API from a subdomain of the website (for example `api.nezxacademy.com` for `nezxacademy.com`) and set both `WEB_ORIGINS` and `VITE_API_URL` correctly. See the deployment guide.
