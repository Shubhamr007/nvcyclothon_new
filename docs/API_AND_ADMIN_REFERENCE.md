# NV Cyclothon — API & Admin Architecture Master Reference

> **Purpose:** This document is the single authoritative reference for the **Backend API** and **Admin Operations Application** of the NV Cyclothon codebase. Reading this document gives an AI model or developer complete structural, contractual, and operational knowledge of the backend services, security model, database schemas, and frontend admin components without needing to load or scan hundreds of source files.

---

## 1. System Topology & Process Boundaries

The NV Cyclothon platform is built as a **decoupled modular monolith** featuring two isolated client applications and an Express 5 API server.

```
                           +----------------------------------------------------+
                           |                  Browser Client                    |
                           +-------------------------+--------------------------+
                                                     |
                         [Port 5173 / dist]          |          [Port 5174 / dist-internal]
                         Public Website SPA          |          Operations Console SPA
                      (index.html -> main.jsx)       |       (internal.html -> internal-main.jsx)
                                                     |                  (HashRouter: #/admin)
                                                     v
                                       +----------------------------+
                                       |      Vite / Edge Proxy     |
                                       +-------------+--------------+
                                                     |
                         Reverse Proxy /api, /upload | (Port 8000)
                                                     v
                                       +----------------------------+
                                       |      Express 5 Server      |
                                       |    (backend/src/app.js)    |
                                       +-------------+--------------+
                                                     |
                        +----------------------------+----------------------------+
                        |                            |                            |
                        v                            v                            v
             +--------------------+       +--------------------+       +--------------------+
             |  PostgreSQL / Pool |       | Disk / Cloudinary  |       | External Gateways  |
             | (or Mock DB Engine)|       |  Storage Service   |       | • Cashfree Payment |
             |   (db/index.js)    |       | (services/storage) |       | • Nodemailer SMTP  |
             +--------------------+       +--------------------+       +--------------------+
```

### Process Isolation Rules
1. **Public Site (`http://localhost:5173` / production domain):**
   - Serves `index.html` mounting `src/main.jsx` and `App.jsx`.
   - Contains `/`, `/register`, `/partners`, `/vendors`, `/checkin`, `/community`.
   - **Does NOT** contain `/admin` route (redirects to `NotFoundPage`).
2. **Admin Operations Portal (`http://localhost:5174` / `admin.nvcyclothon.com`):**
   - Configured via `vite.internal.config.js`. Serves `internal.html` mounting `src/internal-main.jsx` and `InternalApp.jsx`.
   - Uses `HashRouter` strictly locked to `#/admin`. Any non-matching route automatically navigates to `#/admin`.
   - `vite.internal.config.js` uses `internalEntryPlugin` to intercept all HTML page navigations and rewrite them to `/internal.html`, making it impossible for the public site to load on port 5174.
3. **Backend API Server (`http://127.0.0.1:8000`):**
   - Node.js + Express 5 application (`backend/src/app.js`).
   - Serves JSON REST endpoints under `/api/*`, static media under `/api/media/*`, and health check `/health`.

---

## 2. Authentication, Authorization & Security Architecture

### 2.1 Token Model & Cryptography
The application uses **cryptographically signed HMAC-SHA256 scoped bearer tokens** (`backend/src/services/security.js`), bypassing the need for stateful session databases while maintaining zero-trust isolation:

- **Token Format:** `<base64url(payload)>.<base64url(hmac_sha256_signature)>`
- **Admin Tokens (`issueAdminToken`):**
  - Scope: `admin`
  - Subject: `admin`
  - Secret: `config.adminTokenSecret`
  - TTL: 43,200 seconds (12 hours)
  - Verified by: `requireAdmin(config)` middleware.
- **Volunteer Tokens (`issueVolunteerToken`):**
  - Scope: `volunteer_checkin`
  - Claims: `{ volunteer_id: string, volunteer_name: string }`
  - Secret: `config.volunteerTokenSecret`
  - TTL: 43,200 seconds (12 hours)
  - Verified by: `requireVolunteer(config, repository)` middleware. Live-checks database to ensure volunteer account is still `active: true`.
- **Timing Attacks Defense:** All signature comparisons use `crypto.timingSafeEqual` via `safeCompare()`.

### 2.2 Admin Authentication Handshake (`POST /api/admin/session`)
- **Rate Limit:** 10 attempts per 15 minutes per IP.
- **Payload:** `{ "admin_key": "<secret-password>" }`
- **Verification:** Looks up user `config.adminUsername` (default: `admin`) in `admin_users` table; compares hash using `bcrypt.compare`.
- **Response (200 OK):**
  ```json
  {
    "access_token": "<scoped_hmac_token>",
    "token_type": "bearer",
    "expires_in": 43200
  }
  ```

### 2.3 Security Headers & Transport Hardening
- **CORS:** Strict origin matching against `nvcyclothon.com`, `nvcyclothon.in`, `localhost`, `127.0.0.1`. Blocks arbitrary cross-origin requests.
- **Helmet:** Enforces `nosniff`, `DENY` for `X-Frame-Options`, strict referrer policy, COOP (`same-origin`), and CORP (`cross-origin`).
- **Body Limit:** Strict 1MB body limit (`express.json({ limit: "1mb" })`). Upload endpoints handle multipart streaming via Multer.
- **Cache-Control:** All `/api/admin/*` endpoints strictly return `Cache-Control: no-store`.

---

## 3. Database Schema & Data Models (PostgreSQL)

The persistence layer (`backend/src/db/postgresRepository.js`) runs on PostgreSQL (with in-memory `mockRepository.js` for unit/integration tests). All table schemas are created idempotently on startup.

### Core Tables Summary

| Table Name | Primary Key | Key Columns / Indexes | Purpose |
|---|---|---|---|
| `admin_users` | `id SERIAL` | `username UNIQUE`, `password_hash`, `active` | Admin operator login credentials |
| `site_settings` | `id INT (1)` | `data JSONB`, `updated_at` | Singleton JSONB storing dynamic event configs |
| `cyclothon_registrations` | `id SERIAL` | `email` (lower unique), `phone`, `ride_category`, `status`, `payment_status`, `payment_order_id`, `checkin_token`, `batch_name` | All registered participants/riders |
| `volunteer_accounts` | `id SERIAL` | `volunteer_id UNIQUE`, `display_name`, `password_hash`, `email`, `phone`, `role`, `certificate_status`, `active` | On-ground volunteers & check-in staff |
| `volunteer_checkin_logs` | `id SERIAL` | `registration_id FK`, `volunteer_name`, `method` (QR/manual), `outcome`, `scanned_at` | Audit trail of rider check-ins |
| `delegations` | `id SERIAL` | `organization`, `contact_name`, `member_count`, `status`, `image_url` | VIP institutions, cycling clubs, corporate teams |
| `partner_applications` | `id SERIAL` | `application_number UNIQUE`, `company_name`, `sponsorship_tier_id FK`, `status`, `payment_status` | Commercial sponsorship applications |
| `partner_deliverables` | `id SERIAL` | `partner_id FK`, `deliverable_type`, `status` (PENDING/COMPLETED) | Sponsor contracted entitlements tracker |
| `vendor_applications` | `id SERIAL` | `application_number UNIQUE`, `business_name`, `category`, `status`, `space_requirement` | Race village food & expo stall vendors |
| `community_posts` | `id SERIAL` | `name`, `message`, `image_key`, `status` (pending/approved/rejected) | Rider community wall submissions |
| `gallery_items` | `id SERIAL` | `title`, `category`, `image_url`, `display_order`, `featured` | High-res photo gallery management |
| `organizing_members` | `id SERIAL` | `name`, `role`, `message`, `image_url`, `display_order`, `visible` | RDCA Committee & Advisory board |
| `chief_guests` | `id SERIAL` | `name`, `designation`, `bio`, `image_url`, `featured`, `display_order` | Dignitaries & VIP flag-off guests |
| `event_offers` | `id SERIAL` | `title`, `code`, `active`, `starts_at`, `ends_at` | Promotional coupon codes and discounts |
| `sponsorship_tiers` | `id SERIAL` | `name`, `amount_paise`, `availability`, `benefits`, `active` | Defined sponsorship tiers (Title, Co-sponsor, etc.) |
| `rider_passes` | `id SERIAL` | `registration_id FK UNIQUE`, `template_version`, `status`, `emailed_at` | Generated PDF rider pass records |
| `participation_certificates` | `id SERIAL` | `registration_id FK UNIQUE`, `template_version`, `status`, `emailed_at` | Rider participation certificate records |
| `page_visits` | `id BIGSERIAL`| `path`, `timezone`, `locale`, `created_at` | Anonymous privacy-preserving site analytics |

### Site Settings Schema (`site_settings.data` JSONB)
```json
{
  "event_date": "2026-11-22T00:00:00.000Z",
  "event_location": "Rewa, Madhya Pradesh",
  "registration_open": true,
  "early_bird_limit": 50,
  "race_categories": {
    "60 Km Road Challenge": {
      "capacity": 100,
      "min_age": 18,
      "max_age": null,
      "early_bird": 89900,
      "regular": 109900,
      "last_week": 129900
    },
    "30 Km MTB Challenge": {
      "capacity": 150,
      "min_age": 16,
      "max_age": null,
      "early_bird": 79900,
      "regular": 99900,
      "last_week": 119900
    },
    "10 Km Green Ride": {
      "capacity": 200,
      "min_age": null,
      "max_age": null,
      "early_bird": 39900,
      "regular": 49900,
      "last_week": 59900
    },
    "Kid-o-thon": {
      "capacity": 50,
      "min_age": 10,
      "max_age": 13,
      "early_bird": 29900,
      "regular": 29900,
      "last_week": 29900
    }
  },
  "sections_visibility": {
    "experience": true,
    "editions": true,
    "about": true,
    "members": true,
    "routes": true,
    "updates": true,
    "gallery": true,
    "why_sport": true,
    "faq": true,
    "contact": true,
    "sponsors": true,
    "community": true
  },
  "social_links": {
    "instagram": "https://www.instagram.com/nvcyclothon",
    "youtube": "https://www.youtube.com/@nvcyclothon",
    "facebook": "https://www.facebook.com/nvcyclothon",
    "linkedin": "https://www.linkedin.com/company/nvcyclothon"
  }
}
```

---

## 4. Complete Backend API Route Directory

All routes below require `Authorization: Bearer <token>` unless marked `[PUBLIC]`.

### 4.1 Authentication & System Operations
- `POST /api/admin/session` `[PUBLIC]`
  - Body: `{ "admin_key": "string" }`
  - Returns: `{ access_token, token_type, expires_in }`
- `GET /api/admin/analytics`
  - Returns total registrations, approved, checked-in, total revenue (paise), category breakdowns, T-shirt counts.
- `GET /api/admin/visitor-analytics`
  - Returns hourly/daily visitor counts, top URLs, locale, and timezone distributions.
- `GET /api/admin/settings`
  - Returns full `site_settings` JSON object.
- `PATCH /api/admin/settings`
  - Body: Partial update matching `siteSettingsPatchSchema`.
- `POST /api/admin/bulk-delete`
  - Body: `{ "entity": "riders|offers|chief_guests|organizing_members|sponsorship_tiers|gallery|delegations|community_posts|volunteers", "ids": [1, 2, 3] }`
  - Safety check: If `entity === "riders"`, approved or paid riders are protected from deletion.
- `POST /api/admin/profile-images`
  - Multipart form upload (`image` field). Converts to optimized WebP, stores on disk/Cloudinary, returns `{ url }`.

### 4.2 Rider Registrations (`/api/admin/registrations`)
- `GET /api/admin/registrations`
  - Query parameters: optional search and status filter.
  - Returns array of riders with bib number, batch name, payment status, check-in status, token.
- `PATCH /api/admin/registrations/:registrationId`
  - Body: `{ status, batch_name, t_shirt_size, ride_category, emergency_contact, notes }`
- `POST /api/admin/registrations/bulk-status`
  - Body: `{ "ids": [1, 2, 3], "status": "approved|checked_in|cancelled|pending" }`
- `POST /api/admin/registrations/bulk-batch`
  - Body: `{ "ids": [1, 2, 3], "batch_name": "Wave 1 - 06:00 AM" }`
- `POST /api/admin/registrations/roster-match`
  - Multipart form: `.csv` or `.xlsx` roster match. Reconciles finish times / manual check-ins.
- `POST /api/admin/registrations/rider-passes/generate`
  - Body: `{ "ids": [1, 2, 3], "send_email": true }`
  - Renders PDF passes with embedded QR tokens, dispatches emails.
- `GET /api/admin/registrations/:registrationId/rider-pass-preview`
  - Streams PDF pass binary directly to browser (`application/pdf`).
- `POST /api/admin/registrations/certificates/generate`
  - Body: `{ "ids": [1, 2, 3], "send_email": true }`
  - Renders official PDF participation certificates and emails them.
- `GET /api/admin/registrations/:registrationId/certificate-preview`
  - Streams PDF participation certificate preview.
- `POST /api/admin/event-updates/email`
  - Body: `{ "subject": "string", "message": "string", "filter_category": "string|all" }`
  - Broadcasts notification email to matching riders.

### 4.3 Volunteer Management (`/api/admin/volunteers`)
- `GET /api/admin/volunteers`
  - Returns all volunteer accounts, display names, roles, certificate status, active flags.
- `POST /api/admin/volunteers`
  - Body: `{ display_name, email, phone, role, organization, password? }`
  - If password is not provided, auto-generates secure friendly credentials (`Pedal@429`).
- `PATCH /api/admin/volunteers/:volunteerId`
  - Updates role, contact details, active status, or resets password.
- `GET /api/admin/volunteers/template`
  - Streams Excel `.xlsx` template pre-configured with column data types and validation instructions.
- `POST /api/admin/volunteers/bulk-upload`
  - Multipart file upload: parses Excel/CSV roster, generates IDs and credentials in bulk, returns summary `{ created, skipped, errors }`.
- `POST /api/admin/volunteers/:volunteerId/send-credentials`
  - Triggers email to volunteer with their PIN, credentials, and check-in portal link.
- `GET /api/admin/volunteers/:volunteerId/certificate-preview`
  - Streams rendered volunteer certificate of appreciation PDF.
- `POST /api/admin/volunteers/:volunteerId/certificate-send`
  - Dispatches certificate PDF to volunteer's email address and updates `certificate_status = 'emailed'`.

### 4.4 Delegations / VIPs (`/api/admin/delegations`)
- Standard CRUD:
  - `GET /api/admin/delegations`
  - `POST /api/admin/delegations`
  - `PUT /api/admin/delegations/:itemId`
  - `DELETE /api/admin/delegations/:itemId`
  - Fields: `organization`, `contact_name`, `contact_email`, `contact_phone`, `member_count`, `status` (`invited|confirmed|declined|attended`), `notes`, `image_url`.

### 4.5 Commercial Partners & Sponsors (`/api/admin/partner-applications`)
- `GET /api/admin/partner-applications?status=all|SUBMITTED|APPROVED|REJECTED&search=...`
- `GET /api/admin/partner-applications/export`
  - Streams formatted CSV export of all partner applications.
- `GET /api/admin/partner-applications/:id`
- `POST /api/admin/partner-applications/:id/review` (or `/status`)
  - Body: `{ "status": "APPROVED|REJECTED", "notes": "string", "tier_id": 1 }`
- `GET /api/admin/partner-applications/:id/deliverables`
- `PATCH /api/admin/partner-applications/:id/deliverables/:deliverableId`
  - Body: `{ "status": "COMPLETED|PENDING", "notes": "string" }`
- `GET /api/admin/partner-applications/:id/logo`
  - Streams partner logo binary.

### 4.6 Expo & Food Vendors (`/api/admin/vendor-applications`)
- `GET /api/admin/vendor-applications?status=all|SUBMITTED|APPROVED|REJECTED&search=...`
- `GET /api/admin/vendor-applications/export`
  - Streams formatted CSV export of vendor applications.
- `GET /api/admin/vendor-applications/:id`
- `POST /api/admin/vendor-applications/:id/review` (or `/status`)
  - Body: `{ "status": "APPROVED|REJECTED", "notes": "string", "stall_fee_paise": 500000 }`
- `GET /api/admin/vendor-applications/:id/document`
  - Streams uploaded business registration/FSSAI document binary.

### 4.7 Community Wall Moderation (`/api/admin/community`)
- `GET /api/admin/community/posts?status=pending|approved|rejected|all`
- `POST /api/admin/community/posts/:id/moderate`
  - Body: `{ "status": "approved|rejected", "reason": "string", "featured": boolean }`
- `DELETE /api/admin/community/posts/:id`
  - Deletes post from database and purges media asset from storage.
- `GET /api/admin/community/media/:key`
  - Securely streams community uploaded media.

### 4.8 Event Content Management
- **Offers:** `/api/admin/offers` (GET, POST, PUT, DELETE)
- **Chief Guests:** `/api/admin/chief-guests` (GET, POST, PUT, DELETE)
- **Organizing Members:** `/api/admin/organizing-members` (GET, POST, PUT, DELETE)
- **Sponsorship Tiers:** `/api/admin/sponsorship-tiers` (GET, POST, PUT, DELETE)
- **Photo Gallery:**
  - `GET /api/admin/gallery`
  - `POST /api/admin/gallery`
  - `POST /api/admin/gallery/batch` (Body: `{ "items": [{ title, category, image_url, caption }] }`)
  - `PUT /api/admin/gallery/:itemId`
  - `DELETE /api/admin/gallery/:itemId`

### 4.9 Local AI & Ollama Intelligence Subsystem (`/api/admin/ai`)
- `GET /api/admin/ai/status`
  - Returns: `{ enabled: boolean, available: boolean, currentModel: string, modelReady: boolean, installedModels: string[] }`
- `POST /api/admin/ai/moderate-post`
  - Body: `{ id?: number, message: string, name?: string, bib_number?: string }`
  - Returns: `{ status: "approved"|"rejected"|"pending", confidence: number, reason: string, tags: string[] }`
- `POST /api/admin/ai/draft-email`
  - Body: `{ prompt: string, category?: string }`
  - Returns: `{ subject: string, previewText: string, body: string }`
- `POST /api/admin/ai/analytics-summary`
  - Returns: `{ headline: string, highlights: string[], recommendations: string[] }`
- `POST /api/admin/ai/chat`
  - Body: `{ prompt: string, systemPrompt?: string }`
  - Returns: `{ content: string, model: string, totalDurationMs?: number }`

---

## 5. Frontend Admin Architecture (`client/src/features/admin`)

The internal application runs entirely inside `InternalApp.jsx` and `AdminPage.jsx`.

### 5.1 Component Structure & Line Count Budget
All files are strictly architected to adhere to enterprise modularity standards with **0 files exceeding 300 lines**:

```
client/src/features/admin/
├── ai/                             # Local AI Operations Subsystem (Ollama)
│   ├── AiStatusIndicator.jsx       # Connectivity chip in AdminFooter
│   ├── AiInsightsPanel.jsx         # Executive analytics summary card in OverviewTab
│   ├── AiModerationBadge.jsx       # 1-click AI scan & recommendation badge in CommunityTab
│   ├── AiEmailBroadcastModal.jsx   # AI-assisted email composer in ParticipantsTab
│   └── index.js                    # Barrel export
├── components/                     # Shared Admin UI primitives
│   ├── AdminHeader.jsx             # Top bar (breadcrumb, operator avatar, sign out)
│   ├── AdminSidebar.jsx            # Left navigation with 12 tabs across 5 groups
│   ├── AdminFooter.jsx             # Status footer with API connectivity badge
│   ├── AdminLogin.jsx              # Passkey authentication form
│   ├── AdminSlideOver.jsx          # Generic animated slide-over portal drawer
│   ├── ConfirmDeleteDialog.jsx     # Reusable confirmation modal for destructions
│   ├── SelectedDeleteAction.jsx    # Bulk selection delete floating bar
│   ├── TablePagination.jsx         # Universal pagination control
│   ├── StatusBadge.jsx             # Standardized color-coded status chips
│   ├── TabErrorBoundary.jsx        # Crash containment per tab
│   └── TabLoadingFallback.jsx      # Skeleton loader during tab code-split loading
├── participants/                   # Rider Directory & Race Roster Subsystem
│   ├── ParticipantDirectoryView.jsx# Tab view: search, filters, batching, export
│   ├── ParticipantDirectoryTable.jsx# Virtualized/memoized riders table
│   ├── ParticipantDirectoryRow.jsx # Memoized table row with expandable drawer
│   ├── ParticipantExpandedDetails.jsx# Detailed rider card with pass/cert preview
│   ├── ParticipantDirectoryToolbar.jsx# Search and filtering action bar
│   ├── ParticipantBulkActionBar.jsx# Action bar for selected riders
│   ├── BatchManagementModal.jsx    # Wave/batch assigner (auto-split or custom)
│   ├── ParticipantQrModal.jsx      # Dynamic QR viewer for rider pass
│   ├── EventDayRaceRoster.jsx      # Race Day operations view
│   ├── RosterTable.jsx             # Compact race check-in table
│   ├── EventDayRaceRosterRow.jsx   # Row with 1-click check-in toggle and call links
│   └── useParticipantDirectoryActions.js# Custom hook for bulk actions
├── settings/                       # Event Settings & Race Configuration Subsystem
│   ├── RaceCategoriesSection.jsx   # Categories, fees, early-bird limits
│   ├── CategoryCard.jsx            # Individual category card with price inputs
│   ├── CategoryPricingTiers.jsx    # Early-bird, regular, and last-week fees
│   ├── CategoryAgeControls.jsx     # Min/max age inputs and validation
│   ├── CategoryPreviewCard.jsx     # Real-time preview of rider registration view
│   ├── LogisticsSection.jsx        # Venue, assembly time, location settings
│   ├── SectionsVisibilitySection.jsx# Toggles for public landing page sections
│   ├── SocialLinksSection.jsx      # Social media links (IG, YT, FB, LinkedIn)
│   ├── PrizesAndKitSection.jsx     # T-shirt and prize inclusions
│   └── SettingsNavTabs.jsx         # Secondary navigation inside Settings
├── partners/                       # Sponsor & Commercial Management Subsystem
│   ├── PartnersTab.jsx             # Main tab controller
│   ├── PartnerHeaderBar.jsx        # Stats, search, and CSV export action
│   ├── PartnerFilterToolbar.jsx    # Status pills (All, Submitted, Approved)
│   ├── PartnerApplicationsTable.jsx# Enterprise data table
│   ├── PartnerTableRow.jsx         # Actionable row with deliverables indicators
│   ├── PartnerApprovedGrid.jsx     # Visual cards for confirmed sponsors
│   ├── PartnerCard.jsx             # Sponsor card with tier badge
│   ├── PartnerDetailModal.jsx      # Full company dossier & GST details
│   ├── PartnerReviewModal.jsx      # Accept/reject form with notes
│   └── PartnerDeliverablesModal.jsx# Checkbox list for contract deliverables
├── vendors/                        # Food & Expo Vendor Subsystem
│   ├── VendorsTab.jsx              # Main tab controller
│   ├── VendorHeaderBar.jsx         # Header and CSV export trigger
│   ├── VendorFilterToolbar.jsx     # Category and status filters
│   ├── VendorApplicationsTable.jsx # Applications table
│   ├── VendorTableRow.jsx          # Vendor row with stall status
│   ├── VendorAllocationsGrid.jsx   # Grid map of stall spaces
│   ├── VendorAllocationCard.jsx    # Stall card
│   ├── VendorDetailModal.jsx       # Vendor inspection modal with document viewer
│   └── VendorReviewModal.jsx       # Allocation & fee approval modal
├── volunteers/                     # Volunteers & Workforce Subsystem
│   ├── VolunteersTab.jsx           # Main tab controller
│   ├── VolunteerTable.jsx          # Table with credential status and certificate
│   ├── VolunteerToolbar.jsx        # Add volunteer and Excel import buttons
│   ├── VolunteerFormDrawer.jsx     # Slide-over create/edit volunteer form
│   └── VolunteerBulkImportDrawer.jsx# Excel file uploader with parsing feedback
├── delegations/                    # VIP Delegations Subsystem
│   ├── DelegationsTab.jsx          # Main tab controller
│   ├── DelegationTable.jsx         # Delegations table
│   ├── DelegationRow.jsx           # Delegation row
│   ├── DelegationToolbar.jsx       # Add delegation trigger
│   ├── DelegationFormDrawer.jsx    # Slide-over form
│   ├── DelegationProtocolFields.jsx# Rank and VIP protocol level inputs
│   └── DelegationLogisticsFields.jsx# Vehicle pass and seating inputs
├── gallery/                        # Photo Gallery Manager Subsystem
│   ├── GalleryManager.jsx          # Main tab controller
│   ├── GalleryHeaderBar.jsx        # Upload triggers (single / batch)
│   ├── GalleryCategoryFilterBar.jsx# Category pills (Riders, Event, Partners)
│   ├── GalleryGrid.jsx             # Responsive masonry photo grid
│   ├── GalleryCard.jsx             # Card with featured toggle & delete
│   ├── GallerySingleDrawer.jsx     # Single image upload drawer
│   ├── GalleryBatchDrawer.jsx      # Multi-image batch URL importer
│   └── useGalleryActions.js        # State and handlers hook
└── tabs/                           # Standalone Tab Entrypoints
    ├── OverviewTab.jsx             # KPI command center
    ├── AnalyticsTab.jsx            # Visitor traffic analytics
    ├── ParticipantsTab.jsx         # Directory & Roster wrapper
    ├── OffersTab.jsx               # Coupons & discounts
    ├── MembersTab.jsx              # Committee members & guests
    └── CommunityTab.jsx            # User stories moderation queue
```

### 5.2 Redux Store Architecture (`client/src/store/`)
The frontend uses **Redux Toolkit** with strict domain slice separation:

- **`authSlice.js`:** Manages `accessToken` (persisted in `sessionStorage`), authentication loading state, error messages, and logout cleanup.
- **`participantsSlice.js`:** Stores registrations, batching states, search terms, active sub-views (`directory` vs `roster`), selected row IDs.
- **`settingsSlice.js`:** Holds loaded dynamic `site_settings`, dirty state flags, category updates.
- **`volunteersSlice.js`:** Volunteer accounts, filter states, template download status.
- **`partnersSlice.js`:** Applications list, active status filter, deliverable check states.
- **`vendorsSlice.js`:** Vendor entries, stall assignment state, document inspection state.
- **`delegationsSlice.js`:** Delegations list, active drawer visibility.
- **`gallerySlice.js`:** Photo items, category filter, drawer modal controls.
- **`communitySlice.js`:** Community posts queue, moderation filters (`pending`/`approved`/`rejected`).
- **`membersSlice.js`:** Committee members, chief guests, order sorting.

---

## 6. End-to-End Operational Workflows

### 6.1 Rider Intake, Payment & Check-In
```
[Rider Submits Form] -> POST /api/cyclothon/registrations
                              |
                     Validate Age & Cap (from site_settings.race_categories)
                              |
               Cashfree Order Created -> Returns Checkout Session
                              |
                      [Rider Pays Online]
                              |
         +--------------------+--------------------+
         |                                         |
(Cashfree Webhook)                     (Frontend Return Verification)
POST /api/cyclothon/webhook/cashfree    POST /api/cyclothon/registrations/:id/payment/verify
         |                                         |
         +--------------------+--------------------+
                              |
               Verify Signature & Payment Status === "PAID"
                              |
            cyclothon_registrations.payment_status = 'paid'
            cyclothon_registrations.status = 'approved'
            cyclothon_registrations.checkin_token = crypto.randomUUID()
                              |
          Generate Rider Pass PDF (PDFKit + CID QR Code)
                              |
       Send Confirmation Email with Pass Attachment (Nodemailer)
                              |
[Race Day]: Volunteer scans QR via /api/checkin/participants/scan
            Marks cyclothon_registrations.status = 'checked_in'
            Logs entry in volunteer_checkin_logs
```

### 6.2 Volunteer Bulk Onboarding & Certificate Issuance
1. Admin clicks **"Download Excel Template"** (`GET /api/admin/volunteers/template`) in `VolunteersTab.jsx`.
2. Admin populates names, emails, and roles in Excel, then uploads it via `VolunteerBulkImportDrawer.jsx` (`POST /api/admin/volunteers/bulk-upload`).
3. Server generates friendly credentials (e.g. `Velox@812`), hashes passwords with `bcrypt`, and inserts records into `volunteer_accounts`.
4. Admin clicks **"Send Credentials"** (`POST /api/admin/volunteers/:id/send-credentials`) to dispatch welcome emails with PINs.
5. Post-race: Admin clicks **"Issue Certificate"** (`POST /api/admin/volunteers/:id/certificate-send`), generating and attaching an official appreciation certificate PDF.

### 6.3 Partner Review & Deliverable Tracking
1. Sponsor submits application on public site (`POST /api/partners/applications`).
2. Appears in Admin `PartnersTab.jsx` under `SUBMITTED`.
3. Admin reviews financial offer and brand details in `PartnerReviewModal.jsx`, approving it with tier selection (`POST /api/admin/partner-applications/:id/review`).
4. Approving automatically populates contracted entitlements in `partner_deliverables` (e.g. Logo on jersey, VIP stage passes, Expo stall).
5. Committee marks each deliverable `COMPLETED` as assets are received (`PATCH /api/admin/partner-applications/:id/deliverables/:deliverableId`).

---

## 7. Developer Cheatsheet & CLI Commands

### 7.1 Running Services
```bash
# Start backend API (Port 8000)
cd backend && npm run dev

# Start public website (Port 5173)
cd client && npm run dev

# Start internal admin portal (Port 5174)
cd client && npm run dev:internal
```

### 7.2 Testing & Build Verification
```bash
# Run all backend integration tests (59 Vitest tests)
cd backend && npm test

# Build public production bundle (dist/)
cd client && npm run build

# Build internal operations bundle (dist-internal/)
cd client && npm run build:internal
```

### 7.3 Key Engineering Constraints
- **Zero File Bloat:** Keep all React components under **300 lines**.
- **No Native Browser Alerts:** Never use `alert()`, `confirm()`, or `prompt()`. Always use `ConfirmDeleteDialog`, `AdminSlideOver`, or React Toastify.
- **State Management:** Use Redux Toolkit (`useAppDispatch`, `useAppSelector`). Never drill props across more than one level.
- **Admin Isolation:** Never add anchor tags or direct links pointing to public routes (`/`, `/register`) from within the admin application.
- **Strict On-Demand / Lazy Fetching:** Never fetch all tab APIs upfront in parallel at login or dashboard mount. Initial load fetches only `/analytics`. Each respective tab (`ParticipantsTab`, `OffersTab`, `VolunteersTab`, `PartnersTab`, etc.) fetches its required endpoint only when navigated to, with local state caching to avoid redundant roundtrips.

