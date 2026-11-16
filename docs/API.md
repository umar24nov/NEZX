# API reference

Base URLs:

- Local: `http://localhost:4000`
- Production: `https://api.nezxacademy.com`

All request and response bodies are JSON. The browser sends the Better Auth session cookie automatically (`credentials: "include"`). Admin routes require that cookie and an owner account.

Shared TypeScript types and Zod schemas live in `packages/shared/src`. Error responses always use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need your attention.",
    "details": { "phone": ["Enter a valid phone number."] }
  }
}
```

`details` is only present for validation errors.

---

## Public endpoints

### `GET /api/health`

Liveness probe.

```json
{
  "status": "ok",
  "uptimeSeconds": 123,
  "timestamp": "2026-01-01T10:00:00.000Z"
}
```

### `GET /api/site`

Returns everything the landing page needs in one request. Cacheable for 60 seconds.

```json
{
  "config": {
    "phone": "+91 63963 01025",
    "phoneHref": "tel:+916396301025",
    "whatsapp": "916396301025",
    "location": "Roorkee, Uttarakhand, India. Offline classes at our center.",
    "replyTime": "Usually within one working day.",
    "formatChips": ["Live practical sessions"],
    "resultsNote": "These are the founder's own store results…",
    "whatsappGreeting": "Hello NEZX Academy, I want to enquire."
  },
  "courses": [],
  "modules": [],
  "steps": [],
  "audience": [],
  "work": [],
  "results": []
}
```

If PostgreSQL is unavailable, the API returns the bundled `DEFAULT_SITE` content with a `200` so the marketing page never blanks.

### `GET /api/courses`

Returns `{ "items": Course[] }` (published courses ordered by `sortOrder`).

### `GET /api/courses/:slug`

Returns a single published course. `404 NOT_FOUND` if it does not exist.

### `POST /api/enquiries`

Public enquiry form submission.

```json
{
  "name": "Asha Verma",
  "phone": "9876543210",
  "email": "asha@example.com",
  "courseSlug": "etsy-selling",
  "mode": "OFFLINE",
  "message": "I want to sell brass bowls.",
  "turnstileToken": "0.xxxxx",
  "website": ""
}
```

| Field            | Required | Notes                                                                         |
| ---------------- | -------- | ----------------------------------------------------------------------------- |
| `name`           | yes      | 2–80 characters                                                               |
| `phone`          | yes      | Indian mobile with optional `+91`/`0`, or an international number (8–15 digits) |
| `email`          | no       | Valid email, up to 160 characters                                             |
| `courseSlug`     | yes      | A published course slug, or `"unsure"`                                        |
| `mode`           | yes      | `"ONLINE"` or `"OFFLINE"`                                                     |
| `message`        | no       | Up to 1000 characters                                                         |
| `website`        | no       | Honeypot. Real users never send this.                                         |
| `turnstileToken` | prod     | Required when `TURNSTILE_SECRET_KEY` is configured                            |

Responses:

| Status | Meaning                                                                 |
| ------ | ----------------------------------------------------------------------- |
| `201`  | `{ "ok": true, "id": "…", "createdAt": "…" }`                            |
| `202`  | Honeypot triggered; nothing stored (pretends success)                   |
| `400`  | `VERIFICATION_FAILED` or `UNKNOWN_COURSE`                               |
| `422`  | `VALIDATION_ERROR` with a `details` map                                 |
| `429`  | `RATE_LIMITED` — 8 requests per 10 minutes per IP                       |

Phone numbers are normalised to E.164 (`+919876543210`) before storage. The API stores the course name in `courseLabel` so deleting a course later does not erase the lead context.

```bash
curl -X POST http://localhost:4000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Verma","phone":"9876543210","courseSlug":"etsy-selling","mode":"ONLINE"}'
```

---

## Authentication

Better Auth is mounted at `/api/auth/*`. The web app uses `better-auth/react`.

### `POST /api/auth/sign-in/email`

```json
{ "email": "owner@nezxacademy.com", "password": "………………" }
```

Sets an `HttpOnly`, `SameSite=Lax` session cookie (secure in production). Passwords must be 10–128 characters.

### `GET /api/auth/get-session`

Returns `{ "session": …, "user": … }` or `null`. The user object includes `role`.

### `POST /api/auth/sign-out`

Clears the session.

There is intentionally **no public sign-up UI**. Create the owner with the seed script; add other accounts only through a trusted admin process.

An account is treated as an owner when:

- `User.role === "admin"`, or
- its email is in the comma-separated `ADMIN_EMAIL` environment variable.

---

## Owner endpoints

Every route below requires an authenticated owner. Missing session → `401 UNAUTHENTICATED`; signed in but not an owner → `403 FORBIDDEN`.

### `GET /api/admin/enquiries`

Query parameters:

| Param      | Default | Notes                                    |
| ---------- | ------- | ---------------------------------------- |
| `status`   | all     | `NEW`, `CONTACTED`, `ENROLLED`, `CLOSED` |
| `q`        | —       | Search name, phone, email or course      |
| `page`     | `1`     | 1–10,000                                 |
| `pageSize` | `20`    | 1–100                                    |

Response:

```json
{
  "items": [
    {
      "id": "cm…",
      "name": "Asha Verma",
      "phone": "+919876543210",
      "email": "asha@example.com",
      "courseSlug": "etsy-selling",
      "courseLabel": "Etsy Selling",
      "mode": "OFFLINE",
      "message": "I want to sell brass bowls.",
      "status": "NEW",
      "adminNote": null,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "totalPages": 1
}
```

Newest first. `phone`, email and name are searchable case-insensitively (phone matches partial digits).

### `GET /api/admin/enquiries/stats`

```json
{
  "total": 41,
  "newCount": 7,
  "last7Days": 12,
  "byStatus": { "NEW": 7, "CONTACTED": 9, "ENROLLED": 20, "CLOSED": 5 }
}
```

### `PATCH /api/admin/enquiries/:id`

Send one or both fields:

```json
{ "status": "CONTACTED", "adminNote": "Called on Monday; wants the evening batch." }
```

`adminNote` may be `null` to clear it. Returns the updated `EnquiryDto`. `422` when the body is empty.

### `GET /api/admin/media`

Returns every asset, including unpublished ones:

```json
{
  "items": [
    {
      "id": "cm…",
      "key": "uploads/result/uuid.jpg",
      "url": "https://media.example.com/uploads/result/uuid.jpg",
      "posterUrl": null,
      "type": "IMAGE",
      "section": "RESULT",
      "alt": "Etsy stats screen showing total revenue",
      "caption": "Etsy revenue, Jan to Nov",
      "stat": "₹81,80,143",
      "sortOrder": 1,
      "published": true,
      "createdAt": "…",
      "updatedAt": "…"
    }
  ]
}
```

### `POST /api/admin/media`

Registers an uploaded object after the browser PUT succeeds.

```json
{
  "key": "uploads/result/uuid.jpg",
  "url": "https://media.example.com/uploads/result/uuid.jpg",
  "type": "IMAGE",
  "section": "RESULT",
  "alt": "Etsy stats screen",
  "caption": "Etsy revenue, Jan to Nov",
  "stat": "₹81,80,143",
  "sortOrder": 0
}
```

- `key` must start with `uploads/`.
- `url` must start with the configured `R2_PUBLIC_BASE_URL`.
- Duplicate keys → `409 DUPLICATE_MEDIA`.
- `sortOrder: 0` appends to the end of its section.

### `PATCH /api/admin/media/:id`

Any subset of `alt`, `caption`, `stat`, `posterUrl`, `sortOrder`, `published`. Returns the updated row. Empty body → `422`.

### `DELETE /api/admin/media/:id`

Deletes the database row and best-effort deletes the R2 object. Returns `204`.

### `POST /api/admin/uploads/presign`

Creates a short-lived R2 upload URL.

```json
{
  "filename": "etsy-revenue.jpg",
  "contentType": "image/jpeg",
  "size": 48213,
  "section": "RESULT"
}
```

Response:

```json
{
  "uploadUrl": "https://<account>.r2.cloudflarestorage.com/…",
  "key": "uploads/result/<uuid>.jpg",
  "publicUrl": "https://media.example.com/uploads/result/<uuid>.jpg",
  "expiresIn": 600
}
```

Rules:

- `contentType` must start with `image/` or `video/`.
- Maximum size is 50 MB.
- URLs expire in 10 minutes.
- If R2 is not configured → `503 STORAGE_NOT_CONFIGURED`.

Upload flow:

1. `POST /api/admin/uploads/presign`
2. `PUT` the raw file to `uploadUrl` with the same `Content-Type`
3. `POST /api/admin/media` with `key`, `publicUrl`, metadata

---

## Rate limits

| Scope                    | Limit                            |
| ------------------------ | -------------------------------- |
| `POST /api/enquiries`    | 8 requests / 10 minutes / IP     |
| All other `/api` routes  | 600 requests / 15 minutes / IP   |

Responses use `RateLimit` headers (`draft-8`) and return `429 RATE_LIMITED` when exceeded. Behind Cloudflare/Render set `TRUST_PROXY=1` so the real client IP is used.

## Status codes

| Code | Meaning                                          |
| ---- | ------------------------------------------------ |
| 200  | Success                                          |
| 201  | Created                                          |
| 202  | Accepted (honeypot)                              |
| 204  | No content (delete)                              |
| 400  | Invalid request semantics                        |
| 401  | Not signed in                                    |
| 403  | Signed in without owner access                   |
| 404  | Missing route or resource                        |
| 409  | Duplicate media key                              |
| 413  | Body larger than 64 kB (JSON)                    |
| 422  | Zod validation error                             |
| 429  | Rate limited                                     |
| 500  | Unexpected server error                          |
| 503  | R2 storage not configured                        |
