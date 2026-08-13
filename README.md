# NV Cyclothon 2026

A React, Tailwind CSS, and FastAPI registration website for the NV Cyclothon event in Rewa, Madhya Pradesh.

## Local development

Start PostgreSQL (requires Docker Desktop):

```bash
docker compose -f backend/docker-compose.yml up -d
cp backend/.env.example backend/.env
```

Start the backend:

```bash
python3 -m pip install -r backend/requirements.txt
python3 -m uvicorn backend.app.main:app --reload
```

Start the frontend in another terminal:

```bash
npm install
npm run dev
```

Visit the Vite URL (normally `http://localhost:5173`). API documentation is available at `http://localhost:8000/docs`.

## Event routes

- `/` — event landing page, event details and ride distances
- `/register` — NV Cyclothon registration form
- `POST /api/cyclothon/registrations` — creates a new rider registration
- `POST /api/admin/session` — exchanges the administrator secret for a 15-minute session token
- `GET /api/cyclothon/registrations` — admin registration list; requires `Authorization: Bearer <token>`
- `/admin` — browser-based event control centre; enter the `ADMIN_API_KEY` to access it
- `GET /api/admin/analytics` — registration, route, offer and delegation metrics; requires `Authorization: Bearer <token>`
- `/api/admin/offers`, `/api/admin/chief-guests`, `/api/admin/delegations` — protected create, update and delete APIs
- `GET /api/content/offers`, `GET /api/content/chief-guests` — public, active event content used by the home page

## Participation certificates

From `/admin`, open Participants and use the certificate workflow:

1. Upload a CSV or XLSX roster containing an `email`, `rider_id`, `registration_id`, or `id` column. Matching registrations are selected in the table.
2. Approve the selected registrations when appropriate.
3. On event day, set riders who are present to `checked_in`.
4. Click **Generate & send** to create a personalized PDF certificate for every selected checked-in rider. Alternatively, upload a custom participation certificate PDF and use **Send to checked-in**.

The generated certificate includes the participant name, rider ID, route, event date, and event location. The API queues one personalized email per selected checked-in rider with a congratulation and thank-you message and the PDF attached. Configure `EMAIL_ENABLED=true`, `SMTP_HOST`, `SMTP_FROM_EMAIL`, and the remaining SMTP settings in `backend/.env`; keep it disabled locally unless you intentionally want to deliver mail.

The registration API collects rider contact information, age, city, race category (60 Km Road Challenge, 30 Km MTB Challenge, 10 Km Green Ride, or Kid-o-thon), emergency contact, T-shirt size, and waiver acceptance. Category capacities are 100, 150, 200 and 50 respectively. The first 50 registrations across every category use the early-bird rate; regular rates apply afterward, with last-week rates automatically starting seven days before the event. The admin dashboard can update participation states (`pending`, `approved`, `checked_in`, `cancelled`), manage promotional offers and chief guests, and track delegation contacts and member counts. Set `ADMIN_API_KEY` in a backend `.env` file before deploying. The dashboard does not persist this secret; it exchanges it for a short-lived signed token held only in memory.

Registration and emergency phone numbers must be Indian mobile numbers. The API accepts either `9876543210` or `+91 9876543210` and stores the canonical E.164 form (`+919876543210`). Phone numbers are intentionally not unique: a parent, guardian, or group organiser may register multiple riders using the same contact number; the normalized email address remains the unique registration identity.

## Database

The app requires PostgreSQL via `psycopg` in every environment: development, UAT, and production. It refuses to start when `DATABASE_URL` is SQLite or another database engine. The default local connection is:

```text
postgresql+psycopg://nv_cyclothon:nv_cyclothon@localhost:5432/nv_cyclothon
```

Set `DATABASE_URL` in `backend/.env` to the appropriate PostgreSQL instance for each environment. The previous `saffron_route.db` SQLite file is not supported or used by the application.

## Production checklist

- Use PostgreSQL and Alembic migrations instead of the local SQLite database.
- Set `ENVIRONMENT=production`, a unique 32+ character `ADMIN_API_KEY`, and your exact HTTPS public frontend URL and domain in `ALLOWED_ORIGINS` and `ALLOWED_HOSTS`. Production startup rejects wildcard/non-HTTPS origins and weak default secrets.
- Put both the frontend and API behind HTTPS and a reverse proxy. Send a restrictive CSP, HSTS, and clickjacking headers for the frontend too; API headers alone cannot secure files served by a separate frontend host.
- Use a Redis-backed rate limiter when running more than one API instance, and use a real admin identity provider with MFA/RBAC for staff before launch. The built-in shared secret is only a transitional single-admin mechanism.
- Do not accept, proxy, log, or store card PAN/CVV data. Create payments only through a PCI-DSS compliant provider's hosted checkout/tokenization flow, verify provider webhooks with their signature, and mark orders paid only from that verified server-side webhook.
- Configure `EMAIL_ENABLED=true` plus the SMTP settings in `backend/.env` to deliver registration confirmations and admin-sent essential event updates. Payment confirmation and a receipt are sent only after server-side Razorpay signature verification.
- To test Razorpay Standard Checkout locally, add `RAZORPAY_ENABLED=true`, your `rzp_test_...` key ID, and its matching secret to `backend/.env`. The backend creates every order with the server-calculated route fee, and verifies the HMAC payment signature before sending confirmation/receipt email. Never place `RAZORPAY_KEY_SECRET` in Vite environment variables or frontend code. Before using live keys, add a public HTTPS Razorpay webhook and treat its verified `payment.captured` event as the final fulfilment source of truth.
- Use database migrations to add foreign-key/index/check constraints and test concurrent order creation. Product prices are recomputed and stock rows locked by the API, but payment authorization/capture must be integrated before treating an order as final.
- Store registration data in a managed database and add a transactional email provider before opening public registrations.
- Publish a reviewed privacy notice with a named controller, lawful basis, retention schedule, data-subject request process, and processor list. This code records consent; it is not legal advice or a substitute for GDPR compliance work.
- Run an OWASP ASVS/security review before launch: managed secrets, dependency and vulnerability scanning, centralized audit logs, penetration testing, backup recovery drills, and incident response ownership.
