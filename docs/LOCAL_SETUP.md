# Local setup with Docker

This guide takes a clean Windows, macOS or Linux machine to a fully working local copy of NEZX Academy: PostgreSQL in Docker, the Express API, the React site, seed data and the owner dashboard.

> **What runs in Docker?** Only PostgreSQL. The API and web app run on the host with `npm run dev` so both keep hot reload. This is the recommended development setup. The deployment guide uses Render and Cloudflare Pages instead of containers.

## What you get

| Service         | Address                          |
| --------------- | -------------------------------- |
| Website         | http://localhost:5173            |
| Owner dashboard | http://localhost:5173/admin      |
| API             | http://localhost:4000            |
| API health      | http://localhost:4000/api/health |
| PostgreSQL      | `localhost:5432`                 |

---

## 1. Install the prerequisites

You need:

- **Node.js 22+** and npm 10+
- **Git**
- **Docker Desktop** (Windows/macOS) or Docker Engine + Compose plugin (Linux)

### Windows 10/11

1. Enable WSL 2 once, from an **Administrator** PowerShell:

   ```powershell
   wsl --install
   ```

   Restart when Windows asks.

2. Install Docker Desktop:

   ```powershell
   winget install --id Docker.DockerDesktop -e
   ```

   You can also download it from <https://www.docker.com/products/docker-desktop/>.

3. Start **Docker Desktop**, accept the licence, and wait until the status says **Engine running**.

4. Close and reopen your terminal, then verify:

   ```powershell
   docker --version
   docker compose version
   docker run --rm hello-world
   ```

If `docker` is still not recognised, sign out and back in (or reboot), then reopen the terminal.

> **Virtualisation error?** Docker Desktop needs Virtual Machine Platform / WSL 2. Enable virtualisation in BIOS and make sure the "Virtual Machine Platform" and "Windows Subsystem for Linux" Windows features are on.

### macOS

Install Docker Desktop from <https://www.docker.com/products/docker-desktop/>, start it, and run the same verification commands.

### Linux

Install Docker Engine and the Compose plugin using the official instructions for your distribution, then allow your user to run Docker without `sudo`:

```bash
sudo usermod -aG docker "$USER"
# log out and back in
docker run --rm hello-world
```

---

## 2. Clone and install

```bash
git clone https://github.com/umar24nov/NEZX.git
cd NEZX
npm install
```

Node 22+ is required by the workspace `engines` field. Check with `node --version`.

---

## 3. Create the environment files

The repository ignores `.env` files. Create them from the examples:

**PowerShell**

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

**macOS / Linux / Git Bash**

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Generate a real auth secret and paste it into `apps/api/.env` as `BETTER_AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The local defaults already match `docker-compose.yml`:

```dotenv
# apps/api/.env
NODE_ENV=development
PORT=4000
WEB_ORIGINS=http://localhost:5173
TRUST_PROXY=0
DATABASE_URL="postgresql://nezx:nezx@localhost:5432/nezx?schema=public"
BETTER_AUTH_SECRET="<paste the generated value>"
BETTER_AUTH_URL=http://localhost:4000
ADMIN_EMAIL=owner@nezxacademy.com
ADMIN_PASSWORD=ChangeMe-12345
TURNSTILE_SECRET_KEY=
```

Leave Turnstile and R2 blank locally:

- Blank `TURNSTILE_SECRET_KEY` / `VITE_TURNSTILE_SITE_KEY` means the widget is skipped.
- Blank R2 values means media uploads return `503`; the seeded local media still renders on the site.

`apps/web/.env` can stay empty for local development because Vite proxies `/api` to the API.

> **Security:** never commit `.env`, and change `ADMIN_PASSWORD` plus `BETTER_AUTH_SECRET` before deploying. The defaults are for local development only.

---

## 4. Start PostgreSQL in Docker

```bash
npm run db:up
```

This runs `docker compose up -d --wait` and starts a PostgreSQL 16 container named `nezx-postgres` with a persistent named volume. It returns once the container is healthy.

Check it:

```bash
docker compose ps
```

Wait until the `STATUS` column shows `healthy`. The first pull can take a minute.

Follow the database logs (optional):

```bash
npm run db:logs
```

Press `Ctrl+C` to stop following logs; the container keeps running.

Verify the connection:

```bash
docker compose exec postgres pg_isready -U nezx -d nezx
# /var/run/postgresql:5432 - accepting connections
```

Open a SQL shell:

```bash
npm run db:psql
```

Useful psql commands:

```sql
\dt              -- list tables
\d "Course"      -- describe a table
\q               -- quit
```

---

## 5. Apply migrations and seed the database

```bash
npm run setup
```

This command:

1. builds `packages/shared`
2. generates the Prisma client
3. applies the committed migration
4. seeds site content, courses, modules and the owner account

Verify the seed:

```bash
npm run db:psql
```

```sql
SELECT COUNT(*) FROM "Course";          -- expect 4
SELECT COUNT(*) FROM "Module";          -- expect 8
SELECT email, role FROM "User";         -- expect owner@nezxacademy.com | admin
\q
```

---

## 6. Run the app

```bash
npm run dev
```

This builds the shared package and starts both processes:

- API with `tsx watch` on http://localhost:4000
- Vite dev server on http://localhost:5173

Open http://localhost:5173 and the API health check at http://localhost:4000/api/health.

If a port is already in use, stop the other process or change `PORT` in `apps/api/.env` (and the Vite proxy target in `apps/web/vite.config.ts`).

---

## 7. Test the real flows

### Submit an enquiry

Use the form at http://localhost:5173/#enquire, or call the API directly.

**PowerShell**

```powershell
$body = @{
  name       = "Local Test"
  phone      = "9876543210"
  email      = "test@example.com"
  courseSlug = "etsy-selling"
  mode       = "ONLINE"
  message    = "Testing the local setup"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://localhost:4000/api/enquiries `
  -ContentType "application/json" `
  -Body $body
```

**macOS / Linux**

```bash
curl -X POST http://localhost:4000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Test","phone":"9876543210","email":"test@example.com","courseSlug":"etsy-selling","mode":"ONLINE","message":"Testing the local setup"}'
```

A successful request returns `201` with `{ "ok": true, "id": "...", "createdAt": "..." }`.

### Sign in to the owner dashboard

1. Go to http://localhost:5173/admin
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `apps/api/.env`
3. The test enquiry should appear in the inbox
4. Change its status, add a private note, or search/filter the list

If sign-in works but API calls return `403`, the signed-in email is not an owner. Check `ADMIN_EMAIL` and restart the API.

> Use `http://localhost:5173`, not `http://127.0.0.1:5173`. Better Auth cookies and the CORS allowlist are configured for `localhost`; mixing hostnames can make the session look signed out.

### Media uploads

The Media tab needs Cloudflare R2. Without R2 credentials the upload endpoint returns `503`, which is expected locally. The page still shows the 8 seeded images/clips from `apps/web/public/media`.

---

## 8. Everyday Docker commands

| Task                      | Command                           |
| ------------------------- | --------------------------------- |
| Start PostgreSQL          | `npm run db:up`                   |
| Stop PostgreSQL           | `npm run db:down`                 |
| Follow database logs      | `npm run db:logs`                 |
| Open psql                 | `npm run db:psql`                 |
| Show container status     | `docker compose ps`               |
| Restart database          | `docker compose restart postgres` |
| Open a shell in container | `docker compose exec postgres sh` |

`npm run db:down` stops the container but **keeps the data volume**. Your enquiries and users survive restarts.

### Back up the database

```bash
docker compose exec postgres pg_dump -U nezx -d nezx -f /tmp/nezx-backup.sql
docker cp nezx-postgres:/tmp/nezx-backup.sql ./nezx-backup.sql
```

### Restore a backup

```bash
docker cp ./nezx-backup.sql nezx-postgres:/tmp/nezx-backup.sql
docker compose exec postgres psql -U nezx -d nezx -f /tmp/nezx-backup.sql
```

---

## 9. Reset the local database

This deletes **all local data** (enquiries, users, media rows) and recreates an empty database:

```bash
npm run db:reset
npm run setup
```

`npm run db:reset` is `docker compose down -v && docker compose up -d`; the `-v` removes the named volume.

If you want Prisma to drop and recreate the schema without deleting the Docker volume, run its reset command from the API workspace:

```bash
cd apps/api
npx prisma migrate reset
```

---

## 10. Troubleshooting

| Symptom                                                  | Fix                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docker: command not found`                              | Docker Desktop is not installed or the terminal predates the install. Reboot or reopen the terminal and run `docker --version`.                                                                                                      |
| `error during connect ... pipe/dockerDesktopLinuxEngine` | Start Docker Desktop and wait for **Engine running**. On Linux, start the service: `sudo systemctl start docker`.                                                                                                                    |
| `port is already allocated` on 5432                      | Another PostgreSQL is running. Stop it (`Get-Service *postgres*` on Windows / `sudo systemctl stop postgresql` on Linux), or change the host port in `docker-compose.yml` to `"5433:5432"` and update `DATABASE_URL` to port `5433`. |
| `unknown flag: --wait`                                   | Your Docker Compose is older than v2.17. Update Docker Desktop, or run `docker compose up -d` and check `docker compose ps` before continuing.                                                                                       |
| `P1001: Can't reach database server`                     | The container is not healthy yet. Run `docker compose ps` and `npm run db:logs`. Confirm `DATABASE_URL` uses `localhost:5432` and the `nezx` credentials.                                                                            |
| `P1000: Authentication failed`                           | The volume was created with different credentials. Run `npm run db:reset` (destructive) and then `npm run setup`.                                                                                                                    |
| `P3009: failed migrations found`                         | Inspect the migration with Prisma, or reset the development database with `npm run db:reset && npm run setup`.                                                                                                                       |
| Prisma client errors after pulling changes               | Run `npm run db:generate` and `npm run db:migrate`.                                                                                                                                                                                  |
| `npm run setup` fails before migrations                  | Make sure Node is 22+ and run `npm install` again from the repo root.                                                                                                                                                                |
| Admin login succeeds but the inbox shows `403`           | Set `ADMIN_EMAIL` in `apps/api/.env` to the signed-in email (or promote `User.role` to `admin`) and restart the API.                                                                                                                 |
| Signed in on one hostname, signed out on another         | Use `http://localhost:5173` consistently; cookies are host-scoped.                                                                                                                                                                   |
| Port 4000 or 5173 in use                                 | Stop the other process. For the API, also update `PORT` and the Vite proxy target.                                                                                                                                                   |
| Docker uses too much memory                              | Docker Desktop → Settings → Resources; 2–4 GB is enough for this project.                                                                                                                                                            |

---

## 11. Optional: use a local PostgreSQL install instead of Docker

If you already run PostgreSQL 16 locally, skip `npm run db:up` and create the database/user:

```sql
CREATE USER nezx WITH PASSWORD 'nezx';
CREATE DATABASE nezx OWNER nezx;
```

Keep the same `DATABASE_URL` and run `npm run setup`. The rest of the guide is unchanged.

---

## 12. Before deploying

Local Docker is only for development. For production:

- Use a managed PostgreSQL instance (Render PostgreSQL, Neon, Supabase, etc.).
- Set a strong `BETTER_AUTH_SECRET` and `ADMIN_PASSWORD`.
- Set `WEB_ORIGINS`, `BETTER_AUTH_URL`, `TRUST_PROXY=1` and the real API URL.
- Configure R2 and Turnstile keys.
- Run `npm run db:deploy` (not `db:migrate`) to apply committed migrations.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Cloudflare Pages + Render walkthrough.
