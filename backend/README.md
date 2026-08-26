# NV Cyclothon Node Backend

This folder contains the production Node.js backend for NV Cyclothon.

## Stack

- Node.js + Express
- Environment-based database backend:
  - `DB_BACKEND=mock` for tests (in-memory)
  - `DB_BACKEND=postgres` for development, UAT, and production
- PostgreSQL via `pg`
- Validation via `zod`
- Tests via `vitest` + `supertest`

## Install

```bash
npm install
```

## Environment

```bash
cp .env.example .env
```

Important variables:

- `DB_BACKEND=mock|postgres`
- `DATABASE_URL=postgres://user:password@host:5432/dbname`
- `ENVIRONMENT=development|uat|production`

## Development (PostgreSQL)

Start PostgreSQL:

```bash
docker compose up -d
```

Initialize DB schema and seed data:

```bash
npm run db:init
```

Start API:

```bash
npm run dev
```

API health check:

- `GET http://localhost:8000/api/health`

## Testing (Mock DB)

Tests run with mock DB and do not require PostgreSQL.

```bash
npm test
```

## UAT and Production database setup

1. Set environment variables for the target environment:
   - `DB_BACKEND=postgres`
   - `DATABASE_URL` pointing to the UAT/Prod PostgreSQL instance
   - `ENVIRONMENT=uat` or `ENVIRONMENT=production`
2. Run DB initialization on that environment once per deployment pipeline stage:

```bash
npm run db:init
```

3. Start service:

```bash
npm start
```

## API compatibility

Routes preserve the existing frontend contract, including:

- `/api/admin/session`
- `/api/cyclothon/registrations`
- `/api/content/offers`
- `/api/content/chief-guests`
- `/api/admin/*`
