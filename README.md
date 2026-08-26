# NV Cyclothon 2026

A React + Tailwind frontend with a Node.js + Express backend for NV Cyclothon in Rewa, Madhya Pradesh.

## Local development

1. Start PostgreSQL (requires Docker Desktop):

```bash
docker compose -f backend/docker-compose.yml up -d
```

2. Configure backend environment:

```bash
cp backend/.env.example backend/.env
```

3. Start backend API:

```bash
cd backend
npm install
npm run db:init
npm run dev
```

4. Start frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Testing

Backend tests use an in-memory mock DB (no PostgreSQL required):

```bash
cd backend
npm test
```

## Environment database strategy

- `test`: `DB_BACKEND=mock`
- `development`: `DB_BACKEND=postgres`
- `uat`: `DB_BACKEND=postgres`
- `production`: `DB_BACKEND=postgres`

For UAT/Prod, set `DATABASE_URL` to the target PostgreSQL instance and run:

```bash
npm run db:init
```

## Event routes

- `/` - event landing page
- `/register` - rider registration form
- `POST /api/cyclothon/registrations` - create rider registration
- `POST /api/admin/session` - exchange admin key for short-lived token
- `GET /api/cyclothon/registrations` - admin list of registrations (Bearer token)
- `/admin` - browser admin workspace
- `GET /api/admin/analytics` - admin analytics (Bearer token)
- `/api/admin/offers`, `/api/admin/chief-guests`, `/api/admin/delegations` - admin CRUD
- `GET /api/content/offers`, `GET /api/content/chief-guests` - public content

## Participation certificates

From `/admin`, use this flow:

1. Upload a CSV/XLSX/PDF roster with `email`, `rider_id`, `registration_id`, or `id`.
2. Approve selected participants.
3. Mark present riders as `checked_in`.
4. Generate/send personalized certificate PDFs, or upload a custom PDF and send to checked-in riders.

Enable transactional email by setting `EMAIL_ENABLED=true` plus SMTP settings in `backend/.env`.

## Database

The backend is PostgreSQL-first for development, UAT, and production.
Use this format in `backend/.env`:

```text
DATABASE_URL=postgres://username:password@hostname:5432/database_name
```

## Production checklist

- Set `ENVIRONMENT=production` and a unique 32+ character `ADMIN_API_KEY`.
- Configure strict `ALLOWED_ORIGINS` and `ALLOWED_HOSTS` for your real HTTPS domains.
- Run behind HTTPS and reverse proxy with frontend security headers.
- Use a centralized rate limiter (for example Redis-backed) if running multiple API instances.
- Keep payment handling on provider-hosted checkout and verify server-side signatures/webhooks.
- Configure SMTP for registration/essential event communications.
- Run security hardening and operations checks before public launch.
