# Deployment guide

This guide deploys the monorepo to a production setup built on:

- **Cloudflare Pages** for the React site (with WAF in front of the domain).
- **Render** for the Express API.
- **Managed PostgreSQL** (Neon, Supabase or Render Postgres) for Prisma.
- **Cloudflare R2** for uploaded media.
- **Cloudflare Turnstile** for spam protection.

The recommended domains are:

| Purpose        | Domain                        |
| -------------- | ----------------------------- |
| Website        | `https://nezxacademy.com`     |
| API            | `https://api.nezxacademy.com` |
| Media (R2)     | `https://media.nezxacademy.com` |

> **Keep the API on a subdomain of the website.** Better Auth uses `SameSite=Lax` cookies. Same-site subdomains (`nezxacademy.com` + `api.nezxacademy.com`) work; unrelated domains such as `nezx-api.onrender.com` will have cookies dropped by modern browsers.

---

## 1. PostgreSQL

1. Create a production database with your provider.
2. Use a **direct** (non-pooled) connection string for migrations if the provider offers both. Prisma migrations need session-level features.
3. Keep the connection string secret — it is only used by the API and CI, never the browser.

Example:

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require&schema=public"
```

Backups: enable point-in-time recovery or daily snapshots. A marketing site with leads should never run without backups.

---

## 2. Cloudflare R2

1. Create a bucket, e.g. `nezx-media`.
2. Add a **custom domain** to the bucket, e.g. `media.nezxacademy.com`, and enable public access for reads.
3. Create an R2 API token with Object Read & Write access to this bucket.
4. Configure a CORS policy so the browser can `PUT` presigned uploads:

```json
[
  {
    "AllowedOrigins": [
      "https://nezxacademy.com",
      "https://www.nezxacademy.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Record:

- Account ID
- Access key ID / secret access key
- Bucket name
- Public base URL (`https://media.nezxacademy.com`, no trailing slash)

The API validates that uploaded objects live under `uploads/` and that returned URLs point at `R2_PUBLIC_BASE_URL`.

---

## 3. Turnstile

1. In Cloudflare, create a Turnstile widget for `nezxacademy.com`.
2. Add `localhost` to the allowed hostnames for development (or leave the local widget disabled by not setting the site key).
3. Note the **site key** (public, used by Vite) and **secret key** (private, used by Render).

If `TURNSTILE_SECRET_KEY` is empty, the API skips verification — useful locally, **not** acceptable in production.

---

## 4. API on Render

Create a **Web Service** from the GitHub repository.

| Setting        | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Runtime        | Node 22                                                                                        |
| Root directory | repository root                                                                                |
| Build command  | `npm ci && npm run build -w @nezx/shared && npm run db:generate -w @nezx/api && npm run build -w @nezx/api` |
| Start command  | `npm run db:deploy -w @nezx/api && npm run start -w @nezx/api`                                 |
| Health check   | `/api/health`                                                                                  |

Environment variables:

```env
NODE_ENV=production
PORT=4000
TRUST_PROXY=1
WEB_ORIGINS=https://nezxacademy.com,https://www.nezxacademy.com
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32+ random characters>
BETTER_AUTH_URL=https://api.nezxacademy.com
ADMIN_EMAIL=owner@nezxacademy.com
ADMIN_PASSWORD=<temporary strong password used by the seed>
TURNSTILE_SECRET_KEY=<turnstile secret>
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<access key>
R2_SECRET_ACCESS_KEY=<secret key>
R2_BUCKET=nezx-media
R2_PUBLIC_BASE_URL=https://media.nezxacademy.com
```

Notes:

- `TRUST_PROXY=1` makes rate limiting and logging see the real client IP behind Cloudflare/Render.
- Migrations run on every deploy with `prisma migrate deploy`. They are additive; never edit an applied migration.
- **Seed once after the first deploy.** Open a Render shell and run:

  ```bash
  npm run db:seed -w @nezx/api
  ```

  This inserts the default content and promotes `ADMIN_EMAIL` to `role = "admin"`. After that you can rotate `ADMIN_PASSWORD` or remove it from the environment; the seed only creates the account when it is missing.

Custom domain: add `api.nezxacademy.com` in Render, then create the DNS record (below). Enable Render's managed TLS certificate.

---

## 5. Website on Cloudflare Pages

Create a Pages project connected to the repository.

| Setting              | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Framework preset     | None / Vite                                                            |
| Root directory       | repository root                                                       |
| Build command        | `npm ci && npm run build -w @nezx/shared && npm run build -w @nezx/web` |
| Build output         | `apps/web/dist`                                                       |
| Node version         | 22                                                                    |

Build-time environment variables:

```env
VITE_API_URL=https://api.nezxacademy.com
VITE_SITE_URL=https://nezxacademy.com
VITE_TURNSTILE_SITE_KEY=<turnstile site key>
```

`VITE_API_URL` must be the API origin **without** `/api` or a trailing slash. In local development leave it empty so Vite proxies `/api` to `http://localhost:4000`.

The app ships `public/_redirects` (SPA fallback) and `public/_headers` (security and cache headers) automatically.

Add the custom domain `nezxacademy.com` and `www.nezxacademy.com` in Pages. Redirect `www` to the apex or vice versa, but keep both in `WEB_ORIGINS`.

---

## 6. DNS

| Type    | Name    | Target                                  | Proxy      |
| ------- | ------- | --------------------------------------- | ---------- |
| CNAME   | `api`   | `<service>.onrender.com`                | Proxied    |
| CNAME   | `media` | R2 custom domain target                 | Proxied    |
| CNAME   | `www`   | Pages project                           | Proxied    |
| ALIAS / | `@`     | Cloudflare Pages (or use a redirect)    | Proxied    |

If the Render hostname is proxied through Cloudflare, keep SSL mode **Full (strict)** and ensure the origin certificate is valid.

---

## 7. WAF and edge protection

Recommended Cloudflare rules for `nezxacademy.com`:

1. **Managed Ruleset** — enable the Cloudflare OWASP core ruleset.
2. **Rate limiting** — 10 requests/minute per IP to `/api/auth/*`.
3. **Rate limiting** — 5 requests/minute per IP to `/api/enquiries` (the API also has its own limits).
4. **Bot Fight Mode** or Super Bot Fight Mode.
5. **Challenge `/admin`** with a Managed Challenge if you want an extra layer in front of the owner login.
6. **Turnstile** on the public form (already implemented in the app).
7. Optionally add a Cloudflare Access policy to `/admin`; the API still enforces authentication and the admin role on every request.

Do not cache `/api/auth/*`, `/api/admin/*` or `POST /api/enquiries` responses. `GET /api/site` is already sent with a 60-second edge cache header.

---

## 8. Post-deploy checklist

- [ ] `GET https://api.nezxacademy.com/api/health` returns `{ "status": "ok" }`.
- [ ] The landing page loads with content and all media.
- [ ] A test enquiry appears in `/admin` within a refresh.
- [ ] Turnstile appears on the form and rejects a request without a token.
- [ ] Owner sign-in works and the session cookie is `Secure` + `HttpOnly`.
- [ ] A non-owner account receives `403` from `/api/admin/*`.
- [ ] Media upload succeeds and the public site shows the new item.
- [ ] Hiding an item removes it from `GET /api/site`.
- [ ] `www` and apex domains both resolve and redirect sensibly.
- [ ] Lighthouse: no severe accessibility or SEO regressions.
- [ ] Database backups are enabled.
- [ ] `ADMIN_PASSWORD` is rotated or removed from Render after seeding.

---

## 9. CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. `npm ci`
2. Build shared package and generate Prisma client
3. Apply migrations to a disposable PostgreSQL service
4. Typecheck all workspaces
5. Run API + web unit tests
6. Production build
7. Playwright smoke tests against the web preview

Render and Cloudflare Pages can auto-deploy `main` after CI passes. Keep production secrets in the platform dashboards, never in the repository.

---

## 10. Rollback and operations

- **App rollback:** redeploy the previous Render/Pages build.
- **Database:** restore a snapshot/PITR. Never run `prisma migrate dev` against production — use `db:deploy`.
- **Schema changes:** create the migration locally (`npm run db:migrate`), commit the SQL under `apps/api/prisma/migrations`, and let `db:deploy` apply it.
- **Media:** deleting an item in the admin removes the database row and best-effort deletes the R2 object. Enable R2 object versioning if you need recovery.
- **Logs:** Render application logs include request lines and unhandled errors. API logs never print enquiry messages or secrets.
