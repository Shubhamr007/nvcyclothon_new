const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");

describe("NV Cyclothon Node backend", () => {
  let runtime;

  beforeAll(async () => {
    runtime = await buildApplication({
      env: {
        NODE_ENV: "test",
        ENVIRONMENT: "test",
        DB_BACKEND: "mock",
        ADMIN_AUTH_ENABLED: "true",
        ADMIN_API_KEY: "test-admin-key-for-ci",
        ALLOWED_HOSTS: "127.0.0.1,localhost",
        RAZORPAY_ENABLED: "false",
        VOLUNTEER_CHECKIN_PIN: "test-volunteer-pin",
        VOLUNTEER_TOKEN_SECRET: "test-volunteer-token-secret",
      },
      logger: {
        info() {},
        error() {},
        log() {},
      },
    });
  });

  afterAll(async () => {
    await runtime.close();
  });

  it("uses mock DB backend in test mode", () => {
    expect(runtime.config.dbBackend).toBe("mock");
  });

  it("returns health check response", async () => {
    const response = await request(runtime.app).get("/api/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("creates an admin session and accesses protected route", async () => {
    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });

    expect(login.statusCode).toBe(200);
    expect(login.body.access_token).toBeTruthy();

    const registrations = await request(runtime.app)
      .get("/api/admin/registrations")
      .set("Authorization", `Bearer ${login.body.access_token}`);

    expect(registrations.statusCode).toBe(200);
    expect(Array.isArray(registrations.body)).toBe(true);
  });

  it("denies admin route access without a token", async () => {
    const response = await request(runtime.app).get("/api/admin/registrations");
    expect(response.statusCode).toBe(401);
  });

  it("creates and prevents duplicate registrations", async () => {
    const payload = {
      full_name: "Test Rider",
      email: "rider@example.com",
      phone: "+91 9876543210",
      age: 27,
      city: "Rewa",
      gender: "Male",
      ride_category: "10 Km Green Ride",
      emergency_contact: "9876543211",
      t_shirt_size: "M",
      waiver_accepted: true,
      privacy_accepted: true,
    };

    const created = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send(payload);

    expect(created.statusCode).toBe(201);
    expect(created.body.id).toBeTypeOf("number");
    expect(created.body.checkout).toBeNull();

    const duplicate = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send(payload);

    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.body.detail).toContain("already registered");
  });

  it("does not expose public registration listing", async () => {
    const response = await request(runtime.app).get("/api/cyclothon/registrations");
    expect(response.statusCode).toBe(404);
  });

  it("does not expose orders without an authenticated admin route", async () => {
    const response = await request(runtime.app).get("/api/orders");
    expect(response.statusCode).toBe(404);
  });

  it("requires an admin session to modify products", async () => {
    const product = {
      slug: "secure-test-product",
      name: "Secure Test Product",
      origin: "Rewa",
      price_paise: 50000,
      inventory: 3,
    };
    const anonymous = await request(runtime.app).post("/api/products").send(product);
    expect(anonymous.statusCode).toBe(401);

    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const created = await request(runtime.app)
      .post("/api/products")
      .set("Authorization", `Bearer ${login.body.access_token}`)
      .send(product);
    expect(created.statusCode).toBe(201);
  });

  it("allows volunteer check-in with manual and QR flows", async () => {
    const manualPayload = {
      full_name: "Manual Rider",
      email: "manual-rider@example.com",
      phone: "+91 9123456780",
      age: 25,
      city: "Rewa",
      gender: "Male",
      ride_category: "10 Km Green Ride",
      emergency_contact: "9123456781",
      t_shirt_size: "M",
      waiver_accepted: true,
      privacy_accepted: true,
    };

    const qrPayload = {
      full_name: "QR Rider",
      email: "qr-rider@example.com",
      phone: "+91 9234567890",
      age: 28,
      city: "Satna",
      gender: "Female",
      ride_category: "30 Km MTB Challenge",
      emergency_contact: "9234567891",
      t_shirt_size: "L",
      waiver_accepted: true,
      privacy_accepted: true,
    };

    const manualCreated = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send(manualPayload);
    const qrCreated = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send(qrPayload);

    expect(manualCreated.statusCode).toBe(201);
    expect(qrCreated.statusCode).toBe(201);
    expect(manualCreated.body.status).toBe("approved");
    expect(qrCreated.body.status).toBe("approved");

    const volunteerSession = await request(runtime.app)
      .post("/api/checkin/session")
      .send({
        volunteer_pin: "test-volunteer-pin",
        volunteer_name: "Desk One",
      });

    expect(volunteerSession.statusCode).toBe(200);
    expect(volunteerSession.body.access_token).toBeTruthy();
    const volunteerToken = volunteerSession.body.access_token;

    const search = await request(runtime.app)
      .get("/api/checkin/participants/search?q=manual-rider")
      .set("Authorization", `Bearer ${volunteerToken}`);

    expect(search.statusCode).toBe(200);
    expect(search.body.count).toBeGreaterThan(0);
    const manualParticipant = search.body.items.find(
      (item) => item.email === "manual-rider@example.com"
    );
    expect(manualParticipant).toBeTruthy();

    const manualCheckin = await request(runtime.app)
      .post("/api/checkin/participants/manual-checkin")
      .set("Authorization", `Bearer ${volunteerToken}`)
      .send({ registration_id: manualParticipant.id, source_device: "test-device" });

    expect(manualCheckin.statusCode).toBe(200);
    expect(manualCheckin.body.already_checked_in).toBe(false);
    expect(manualCheckin.body.participant.status).toBe("checked_in");

    const manualDuplicate = await request(runtime.app)
      .post("/api/checkin/participants/manual-checkin")
      .set("Authorization", `Bearer ${volunteerToken}`)
      .send({ registration_id: manualParticipant.id, source_device: "test-device" });

    expect(manualDuplicate.statusCode).toBe(200);
    expect(manualDuplicate.body.already_checked_in).toBe(true);

    const adminSession = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    expect(adminSession.statusCode).toBe(200);

    const registrations = await request(runtime.app)
      .get("/api/admin/registrations")
      .set("Authorization", `Bearer ${adminSession.body.access_token}`);
    const qrParticipant = registrations.body.find(
      (item) => item.email === "qr-rider@example.com"
    );

    expect(qrParticipant?.checkin_token).toBeTruthy();

    const qrCheckin = await request(runtime.app)
      .post("/api/checkin/participants/scan")
      .set("Authorization", `Bearer ${volunteerToken}`)
      .send({
        scan_value: `nvcyclothon-checkin:${qrParticipant.checkin_token}`,
        source_device: "test-device",
      });

    expect(qrCheckin.statusCode).toBe(200);
    expect(qrCheckin.body.already_checked_in).toBe(false);
    expect(qrCheckin.body.participant.status).toBe("checked_in");
  });

  it("enforces per-volunteer credentials when configured", async () => {
    const credentialRuntime = await buildApplication({
      env: {
        NODE_ENV: "test",
        ENVIRONMENT: "test",
        DB_BACKEND: "mock",
        ADMIN_AUTH_ENABLED: "true",
        ADMIN_API_KEY: "test-admin-key-for-ci",
        ALLOWED_HOSTS: "127.0.0.1,localhost",
        VOLUNTEER_CHECKIN_PIN: "shared-fallback-pin",
        VOLUNTEER_CHECKIN_CREDENTIALS:
          '{"Desk One":"desk-one-123","Desk Two":"desk-two-456"}',
        VOLUNTEER_TOKEN_SECRET: "test-volunteer-token-secret",
      },
      logger: {
        info() {},
        error() {},
        log() {},
      },
    });

    try {
      const validLogin = await request(credentialRuntime.app)
        .post("/api/checkin/session")
        .send({
          volunteer_name: "Desk One",
          volunteer_pin: "desk-one-123",
        });

      expect(validLogin.statusCode).toBe(200);
      expect(validLogin.body.volunteer_name).toBe("Desk One");
      expect(validLogin.body.access_token).toBeTruthy();

      const wrongPin = await request(credentialRuntime.app)
        .post("/api/checkin/session")
        .send({
          volunteer_name: "Desk One",
          volunteer_pin: "shared-fallback-pin",
        });

      expect(wrongPin.statusCode).toBe(401);

      const unknownVolunteer = await request(credentialRuntime.app)
        .post("/api/checkin/session")
        .send({
          volunteer_name: "Desk Three",
          volunteer_pin: "desk-one-123",
        });

      expect(unknownVolunteer.statusCode).toBe(401);
    } finally {
      await credentialRuntime.close();
    }
  });

  it("exposes public site settings and allows admin updates", async () => {
    const initial = await request(runtime.app).get("/api/content/settings");
    expect(initial.statusCode).toBe(200);
    expect(initial.body.event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(initial.body.sections).toBeTypeOf("object");
    expect(initial.body.sections.editions).toBe(true);

    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    expect(login.statusCode).toBe(200);
    const adminToken = login.body.access_token;

    const unauthorized = await request(runtime.app)
      .patch("/api/admin/settings")
      .send({ event_date: "2026-11-01" });
    expect(unauthorized.statusCode).toBe(401);

    const patched = await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        event_date: "2026-11-01",
        edition_label: "3rd Edition",
        sections: { gallery: false, contact: true },
      });
    expect(patched.statusCode).toBe(200);
    expect(patched.body.event_date).toBe("2026-11-01");
    expect(patched.body.edition_label).toBe("3rd Edition");
    expect(patched.body.sections.gallery).toBe(false);
    expect(patched.body.sections.contact).toBe(true);
    expect(patched.body.sections.editions).toBe(true);

    const publicAfter = await request(runtime.app).get("/api/content/settings");
    expect(publicAfter.body.event_date).toBe("2026-11-01");
    expect(publicAfter.body.sections.gallery).toBe(false);

    const invalid = await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ event_date: "not-a-date" });
    expect(invalid.statusCode).toBe(400);
  });

  it("enforces registration closure on the server", async () => {
    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const adminToken = login.body.access_token;

    await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ registration_open: false });
    const response = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Closed Rider",
        email: "closed-rider@example.com",
        phone: "+91 9345678901",
        age: 30,
        city: "Rewa",
        gender: "Male",
        ride_category: "10 Km Green Ride",
        emergency_contact: "9345678902",
        t_shirt_size: "M",
        waiver_accepted: true,
        privacy_accepted: true,
      });
    expect(response.statusCode).toBe(403);

    await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ registration_open: true });
  });

  it("lets admins provision volunteer credentials for public check-in", async () => {
    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const adminToken = login.body.access_token;

    const created = await request(runtime.app)
      .post("/api/admin/volunteers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        volunteer_id: "desk-01",
        display_name: "Registration Desk 1",
        password: "race-day-password-01",
      });
    expect(created.statusCode).toBe(201);
    expect(created.body.password_hash).toBeUndefined();
    expect(created.body.active).toBe(true);

    const session = await request(runtime.app)
      .post("/api/checkin/session")
      .send({ volunteer_name: "desk-01", volunteer_pin: "race-day-password-01" });
    expect(session.statusCode).toBe(200);
    expect(session.body.volunteer_name).toBe("Registration Desk 1");

    const validToken = session.body.access_token;
    const activeSession = await request(runtime.app)
      .get("/api/checkin/participants/search?q=ri")
      .set("Authorization", `Bearer ${validToken}`);
    expect(activeSession.statusCode).toBe(200);

    const disabled = await request(runtime.app)
      .patch(`/api/admin/volunteers/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ active: false });
    expect(disabled.statusCode).toBe(200);

    const revokedToken = await request(runtime.app)
      .get("/api/checkin/participants/search?q=ri")
      .set("Authorization", `Bearer ${validToken}`);
    expect(revokedToken.statusCode).toBe(401);

    const rejected = await request(runtime.app)
      .post("/api/checkin/session")
      .send({ volunteer_name: "desk-01", volunteer_pin: "race-day-password-01" });
    expect(rejected.statusCode).toBe(401);
  });

  it("supports volunteer template download, auto-credentialing, bulk import, and certificates", async () => {
    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const adminToken = login.body.access_token;

    // 1. Download Excel template
    const templateRes = await request(runtime.app)
      .get("/api/admin/volunteers/template")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(templateRes.statusCode).toBe(200);
    expect(templateRes.headers["content-type"]).toContain("spreadsheetml");

    // 2. Create single volunteer with auto-generated ID & password
    const autoCreated = await request(runtime.app)
      .post("/api/admin/volunteers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        display_name: "Siddharth Verma",
        email: "siddharth@example.com",
        phone: "9876543219",
        role: "Bib Distribution",
        organization: "Government Engineering College Rewa",
      });
    expect(autoCreated.statusCode).toBe(201);
    expect(autoCreated.body.volunteer_id).toMatch(/^vol-siddhart/);
    expect(autoCreated.body.generated_password).toBeTruthy();
    expect(autoCreated.body.role).toBe("Bib Distribution");

    // 3. Login using the auto-generated credentials
    const autoLogin = await request(runtime.app)
      .post("/api/checkin/session")
      .send({
        volunteer_name: autoCreated.body.volunteer_id,
        volunteer_pin: autoCreated.body.generated_password,
      });
    expect(autoLogin.statusCode).toBe(200);
    expect(autoLogin.body.access_token).toBeTruthy();

    // 4. Send/reset credentials
    const credRes = await request(runtime.app)
      .post(`/api/admin/volunteers/${autoCreated.body.id}/send-credentials`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(credRes.statusCode).toBe(200);
    expect(credRes.body.success).toBe(true);
    expect(credRes.body.generated_password).toBeTruthy();

    // 5. Preview volunteer certificate
    const certPreview = await request(runtime.app)
      .get(`/api/admin/volunteers/${autoCreated.body.id}/certificate-preview`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(certPreview.statusCode).toBe(200);
    expect(certPreview.headers["content-type"]).toBe("application/pdf");

    // 6. Send volunteer certificate
    const certSend = await request(runtime.app)
      .post(`/api/admin/volunteers/${autoCreated.body.id}/certificate-send`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(certSend.statusCode).toBe(200);
    expect(certSend.body.success).toBe(true);

    // 7. Bulk import via array
    const bulkRes = await request(runtime.app)
      .post("/api/admin/volunteers/bulk-upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        volunteers: [
          {
            full_name: "Kavita Rao",
            email: "kavita@example.com",
            phone: "9876543220",
            role: "Hydration Point",
            organization: "Rewa Youth Club",
          },
          {
            full_name: "Manish Tiwari",
            email: "manish@example.com",
            phone: "9876543221",
            role: "Route Marshal",
            organization: "Rewa Runners",
          },
        ],
      });
    expect(bulkRes.statusCode).toBe(201);
    expect(bulkRes.body.imported_count).toBe(2);
    expect(bulkRes.body.imported[0].generated_password).toBeTruthy();
  });

  it("supports community wall submissions with moderation and status toggling", async () => {
    const submission = await request(runtime.app)
      .post("/api/community/posts")
      .field("name", "Anita R")
      .field("message", "Loved every kilometre of the 2025 ride. Cannot wait for edition 3!")
      .field("consent_accepted", "true");
    expect(submission.statusCode).toBe(201);
    expect(submission.body.status).toBe("pending_review");
    const postId = submission.body.id;
    expect(postId).toBeTypeOf("number");

    const missingConsent = await request(runtime.app)
      .post("/api/community/posts")
      .field("name", "No Consent")
      .field("message", "This should be rejected because no consent was ticked.")
      .field("consent_accepted", "false");
    expect(missingConsent.statusCode).toBe(400);

    const publicPending = await request(runtime.app).get("/api/community/posts");
    expect(publicPending.statusCode).toBe(200);
    expect(publicPending.body.total_approved).toBe(0);
    expect(publicPending.body.items.length).toBe(0);

    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const adminToken = login.body.access_token;

    const queue = await request(runtime.app)
      .get("/api/admin/community/posts?status=pending")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(queue.statusCode).toBe(200);
    expect(queue.body.items.length).toBeGreaterThanOrEqual(1);

    const approve = await request(runtime.app)
      .post(`/api/admin/community/posts/${postId}/moderate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(approve.statusCode).toBe(200);
    expect(approve.body.status).toBe("approved");

    const publicApproved = await request(runtime.app).get("/api/community/posts");
    expect(publicApproved.body.total_approved).toBe(1);
    expect(publicApproved.body.items[0].name).toBe("Anita R");
    expect(publicApproved.body.items[0].message).toContain("2025 ride");

    const disable = await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sections: { community: false } });
    expect(disable.statusCode).toBe(200);

    const disabledPublic = await request(runtime.app).get("/api/community/posts");
    expect(disabledPublic.body.enabled).toBe(false);
    expect(disabledPublic.body.items.length).toBe(0);

    const blockedSubmit = await request(runtime.app)
      .post("/api/community/posts")
      .field("name", "Blocked Person")
      .field("message", "Submissions should not be accepted while wall is off")
      .field("consent_accepted", "true");
    expect(blockedSubmit.statusCode).toBe(403);

    await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sections: { community: true } });
  });

  it("submits partner application, verifies reference number format, and allows admin review", async () => {
    // 1. Check public packages
    const packagesRes = await request(runtime.app).get("/api/partnerships/packages");
    expect(packagesRes.statusCode).toBe(200);

    // 2. Submit partner application
    const submitRes = await request(runtime.app)
      .post("/api/partnerships/applications")
      .field("company_name", "Rewa Cycles Private Limited")
      .field("business_type", "Corporate")
      .field("contact_name", "Rajesh Sharma")
      .field("designation", "Marketing Director")
      .field("email", "rajesh@rewacycles.com")
      .field("phone", "+91 9876543210")
      .field("address", "Civil Lines, Rewa")
      .field("city", "Rewa")
      .field("state", "Madhya Pradesh")
      .field("pincode", "486001")
      .field("selected_package", "Title Sponsor")
      .field("partnership_type", "Cash Sponsorship");

    expect(submitRes.statusCode).toBe(201);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.reference_number).toMatch(/^NV-26-P-\d+$/);
    const partnerId = submitRes.body.application.id;

    // 3. Admin review flow
    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const adminToken = login.body.access_token;

    const listRes = await request(runtime.app)
      .get("/api/admin/partner-applications?status=SUBMITTED")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.some((p) => p.id === partnerId)).toBe(true);

    const approveRes = await request(runtime.app)
      .post(`/api/admin/partner-applications/${partnerId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVED", notes: "Approved by committee" });
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.status).toBe("APPROVED");

    // 4. Public approved partners check
    const approvedRes = await request(runtime.app).get("/api/partnerships/approved");
    expect(approvedRes.statusCode).toBe(200);
    expect(approvedRes.body.some((p) => p.id === partnerId)).toBe(true);
  });

  it("submits vendor application, verifies reference number format, and retrieves categories", async () => {
    // 1. Get official categories
    const catRes = await request(runtime.app).get("/api/vendors/categories");
    expect(catRes.statusCode).toBe(200);
    expect(catRes.body).toContain("Cycling & Sports");
    expect(catRes.body).toContain("Food & Nutrition");

    // 2. Submit vendor application
    const submitRes = await request(runtime.app)
      .post("/api/vendors/applications")
      .field("business_name", "Vindhya Fresh Juices")
      .field("representative_name", "Sunil Patel")
      .field("phone", "+91 9123456780")
      .field("email", "sunil@vindhyafresh.com")
      .field("category", "Hydration")
      .field("address", "Station Road, Rewa")
      .field("products_services", "Cold-pressed fresh orange and sugarcane juice")
      .field("description", "Supplying natural energy drinks and hydration for endurance athletes.")
      .field("space_requirement", "10x10 ft stall")
      .field("electricity_required", "true")
      .field("water_required", "true")
      .field("staff_count", "3");

    expect(submitRes.statusCode).toBe(201);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.reference_number).toMatch(/^NV-26-V-\d+$/);
    const vendorId = submitRes.body.application.id;

    // 3. Admin review
    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    const adminToken = login.body.access_token;

    const reviewRes = await request(runtime.app)
      .post(`/api/admin/vendor-applications/${vendorId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVED", notes: "Stall allocated near water station 1" });
    expect(reviewRes.statusCode).toBe(200);
    expect(reviewRes.body.status).toBe("APPROVED");
  });
});
