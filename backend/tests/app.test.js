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
        CASHFREE_ENABLED: "false",
        EMAIL_ENABLED: "false",
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

    const deleteRes = await request(runtime.app)
      .delete(`/api/admin/community/posts/${postId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const publicAfterDelete = await request(runtime.app).get("/api/community/posts");
    expect(publicAfterDelete.body.total_approved).toBe(0);
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

  describe("email and phone validation on registration", () => {
    beforeEach(() => {
      runtime.resetRateLimits();
    });

    const validPayload = {
      full_name: "Validation Tester",
      email: "valid@gmail.com",
      phone: "+91 9876543299",
      age: 25,
      city: "Rewa",
      gender: "Male",
      ride_category: "10 Km Green Ride",
      emergency_contact: "+91 9876543299",
      t_shirt_size: "M",
      waiver_accepted: true,
      privacy_accepted: true,
    };

    it("rejects an incomplete email (missing domain)", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "user@" });
      expect(res.statusCode).toBe(400);
    });

    it("rejects an email without a TLD", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "user@domain" });
      expect(res.statusCode).toBe(400);
    });

    it("rejects an email with a single-character TLD", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "user@domain.c" });
      expect(res.statusCode).toBe(400);
    });

    it("accepts a valid email address", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "rider-valid@gmail.com" });
      expect(res.statusCode).toBe(201);
    });

    it("rejects a short Indian mobile number", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "short-phone@test.com", phone: "+91 12345" });
      expect(res.statusCode).toBe(400);
    });

    it("rejects an Indian mobile starting with 5", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "bad-start@test.com", phone: "+91 5123456789" });
      expect(res.statusCode).toBe(400);
    });

    it("accepts a valid Indian mobile number", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "valid-phone@test.com", phone: "+91 9876501234" });
      expect(res.statusCode).toBe(201);
    });

    it("accepts a valid international phone number", async () => {
      const res = await request(runtime.app)
        .post("/api/cyclothon/registrations")
        .send({ ...validPayload, email: "intl-phone@test.com", phone: "+1 2025551234" });
      expect(res.statusCode).toBe(201);
    });
  });

  describe("SSRF and URL Validation Hardening", () => {
    const { validateHttpsUrl } = require("../src/services/validation");

    it("accepts valid public HTTPS image URLs", () => {
      const url = "https://res.cloudinary.com/nvcyclothon/image/upload/sample.jpg";
      expect(validateHttpsUrl(url)).toBe(url);
      expect(validateHttpsUrl(null)).toBe(null);
      expect(validateHttpsUrl("")).toBe(null);
    });

    it("rejects loopback and local hostnames", () => {
      expect(() => validateHttpsUrl("https://localhost/image.png")).toThrow();
      expect(() => validateHttpsUrl("https://127.0.0.1/image.png")).toThrow();
      expect(() => validateHttpsUrl("https://127.0.0.1:8000/api/admin")).toThrow();
    });

    it("rejects cloud metadata and link-local IP addresses (169.254.169.254)", () => {
      expect(() => validateHttpsUrl("https://169.254.169.254/latest/meta-data")).toThrow();
      expect(() => validateHttpsUrl("https://metadata.google.internal/computeMetadata/v1/")).toThrow();
    });

    it("rejects private RFC-1918 addresses", () => {
      expect(() => validateHttpsUrl("https://10.0.0.5/logo.jpg")).toThrow();
      expect(() => validateHttpsUrl("https://172.16.1.100/logo.jpg")).toThrow();
      expect(() => validateHttpsUrl("https://192.168.1.1/admin")).toThrow();
    });

    it("rejects non-standard HTTPS ports to prevent internal port scanning", () => {
      expect(() => validateHttpsUrl("https://cdn.example.com:8443/image.png")).toThrow();
    });
  });

  describe("Cashfree Payment Gateway Integration", () => {
    let cashfreeRuntime;
    const clientSecret = "test_client_secret_for_cashfree_1234";

    beforeAll(async () => {
      cashfreeRuntime = await buildApplication({
        env: {
          NODE_ENV: "test",
          ENVIRONMENT: "test",
          DB_BACKEND: "mock",
          ADMIN_AUTH_ENABLED: "true",
          ADMIN_API_KEY: "test-admin-key-for-ci",
          ALLOWED_HOSTS: "127.0.0.1,localhost",
          CASHFREE_ENABLED: "true",
          CASHFREE_ENVIRONMENT: "sandbox",
          CASHFREE_CLIENT_ID: "test_client_id_cf",
          CASHFREE_CLIENT_SECRET: clientSecret,
          PUBLIC_API_URL: "http://127.0.0.1:8000",
          PUBLIC_SITE_URL: "http://127.0.0.1:5173",
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
      await cashfreeRuntime.close();
    });

    it("creates cyclothon registration with Cashfree checkout session and pending status", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url, opts) => {
        if (String(url).includes("/pg/orders") && opts?.method === "POST") {
          const body = JSON.parse(opts.body);
          return {
            ok: true,
            json: async () => ({
              order_id: body.order_id,
              payment_session_id: "session_token_abc_123",
              order_status: "ACTIVE",
            }),
          };
        }
        return { ok: false, json: async () => ({ message: "Not mocked" }) };
      });

      const payload = {
        full_name: "Cashfree Rider",
        email: "cashfree.rider@example.com",
        phone: "+91 9876543210",
        age: 26,
        city: "Rewa",
        gender: "Female",
        ride_category: "60 Km Road Challenge",
        emergency_contact: "9876543211",
        t_shirt_size: "M",
        waiver_accepted: true,
        privacy_accepted: true,
      };

      const res = await request(cashfreeRuntime.app)
        .post("/api/cyclothon/registrations")
        .send(payload);

      fetchSpy.mockRestore();

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("pending");
      expect(res.body.checkout).toBeTruthy();
      expect(res.body.checkout.provider).toBe("cashfree");
      expect(res.body.checkout.payment_session_id).toBe("session_token_abc_123");
      expect(res.body.checkout.order_id).toBe(`cyclothon-${res.body.id}`);

      // Verify payment using verify-order endpoint
      const orderId = res.body.checkout.order_id;
      const verifyFetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (String(url).includes(`/pg/orders/${encodeURIComponent(orderId)}/payments`)) {
          return {
            ok: true,
            json: async () => [
              {
                cf_payment_id: "cf_pay_test_001",
                payment_status: "SUCCESS",
                payment_amount: 899,
              },
            ],
          };
        }
        return { ok: false, json: async () => ({ message: "Not mocked" }) };
      });

      const verifyRes = await request(cashfreeRuntime.app)
        .post("/api/cyclothon/registrations/verify-order")
        .send({ order_id: orderId });

      verifyFetchSpy.mockRestore();

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.id).toBe(res.body.id);
      expect(verifyRes.body.status).toBe("approved");

      // Idempotent retry returns the same approved registration
      const retryRes = await request(cashfreeRuntime.app)
        .post("/api/cyclothon/registrations/verify-order")
        .send({ order_id: orderId });

      expect(retryRes.statusCode).toBe(200);
      expect(retryRes.body.id).toBe(res.body.id);
      expect(retryRes.body.status).toBe("approved");
    });

    it("verifies and processes Cashfree webhook signatures", async () => {
      const crypto = require("crypto");
      const orderId = "cyclothon-webhook-test";
      const paymentId = "cf_pay_webhook_999";

      // Seed a pending registration in mock tables
      cashfreeRuntime.repository.tables.cyclothon_registrations.push({
        id: 9999,
        full_name: "Webhook Rider",
        email: "webhook.rider@example.com",
        phone: "+91 9999999999",
        age: 30,
        city: "Rewa",
        gender: "Male",
        ride_category: "10 Km Green Ride",
        status: "pending",
        payment_status: "pending",
        payment_order_id: orderId,
        created_at: new Date().toISOString(),
      });

      const rawBody = JSON.stringify({
        type: "PAYMENT_SUCCESS_WEBHOOK",
        data: {
          order: { order_id: orderId },
          payment: { cf_payment_id: paymentId },
        },
      });

      const timestamp = String(Date.now());
      const signature = crypto
        .createHmac("sha256", clientSecret)
        .update(`${timestamp}${rawBody}`)
        .digest("base64");

      const webhookRes = await request(cashfreeRuntime.app)
        .post("/api/cyclothon/webhook/cashfree")
        .set("x-webhook-signature", signature)
        .set("x-webhook-timestamp", timestamp)
        .set("content-type", "application/json")
        .send(rawBody);

      expect(webhookRes.statusCode).toBe(204);

      const updated = await cashfreeRuntime.repository.getRegistrationByOrderId(orderId);
      expect(updated).toBeTruthy();
      expect(updated.payment_status).toBe("paid");
      expect(updated.status).toBe("approved");
      expect(updated.payment_id).toBe(paymentId);
    });

    it("rejects replayed or stale webhook signatures exceeding the tolerance window", async () => {
      const crypto = require("crypto");
      const rawBody = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: {} });
      const staleTimestamp = String(Date.now() - 10 * 60 * 1000);
      const staleSignature = crypto
        .createHmac("sha256", clientSecret)
        .update(`${staleTimestamp}${rawBody}`)
        .digest("base64");

      const staleRes = await request(cashfreeRuntime.app)
        .post("/api/cyclothon/webhook/cashfree")
        .set("x-webhook-signature", staleSignature)
        .set("x-webhook-timestamp", staleTimestamp)
        .set("content-type", "application/json")
        .send(rawBody);

      expect(staleRes.statusCode).toBe(401);
      expect(staleRes.body.detail).toBe("Invalid webhook signature");

      const futureTimestamp = String(Date.now() + 5 * 60 * 1000);
      const futureSignature = crypto
        .createHmac("sha256", clientSecret)
        .update(`${futureTimestamp}${rawBody}`)
        .digest("base64");

      const futureRes = await request(cashfreeRuntime.app)
        .post("/api/cyclothon/webhook/cashfree")
        .set("x-webhook-signature", futureSignature)
        .set("x-webhook-timestamp", futureTimestamp)
        .set("content-type", "application/json")
        .send(rawBody);

      expect(futureRes.statusCode).toBe(401);
    });

    it("enforces rate limits on order lookups to prevent enumeration attacks", async () => {
      cashfreeRuntime.resetRateLimits();
      for (let i = 0; i < 30; i++) {
        const res = await request(cashfreeRuntime.app).get("/api/cyclothon/registrations/by-order/order_enum_test");
        expect([404, 200]).toContain(res.statusCode);
      }
      const throttledRes = await request(cashfreeRuntime.app).get("/api/cyclothon/registrations/by-order/order_enum_test");
      expect(throttledRes.statusCode).toBe(429);
      expect(throttledRes.body.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("correctly enables PostgreSQL database SSL for remote production databases", () => {
      const { loadConfig } = require("../src/config");

      // Local development without SSL
      const devConfig = loadConfig({
        ENVIRONMENT: "development",
        DATABASE_URL: "postgres://user:pass@127.0.0.1:5432/db",
      });
      expect(devConfig.databaseSsl).toBe(false);

      // Explicit DATABASE_SSL=true
      const explicitSslConfig = loadConfig({
        ENVIRONMENT: "development",
        DATABASE_URL: "postgres://user:pass@127.0.0.1:5432/db",
        DATABASE_SSL: "true",
      });
      expect(explicitSslConfig.databaseSsl).toBe(true);

      // Remote database in production auto-enables SSL
      const prodConfig = loadConfig({
        ENVIRONMENT: "production",
        DATABASE_URL: "postgres://user:pass@db.aws.rds.com:5432/db",
        ADMIN_AUTH_ENABLED: "true",
        ADMIN_TOKEN_SECRET: "a".repeat(32),
        ALLOWED_ORIGINS: "https://nvcyclothon.in",
        VOLUNTEER_CHECKIN_PIN: "vol-pin-123456",
        VOLUNTEER_TOKEN_SECRET: "b".repeat(16),
      });
      expect(prodConfig.databaseSsl).toBe(true);
    });

    it("rejects default placeholder secrets in production mode", () => {
      const { loadConfig } = require("../src/config");

      // Placeholder admin token secret
      expect(() => {
        loadConfig({
          ENVIRONMENT: "production",
          ADMIN_AUTH_ENABLED: "true",
          ADMIN_TOKEN_SECRET: "replace-with-a-long-random-secret",
          ALLOWED_ORIGINS: "https://nvcyclothon.in",
        });
      }).toThrow(/ADMIN_TOKEN_SECRET must not use a default placeholder secret/);

      // Placeholder volunteer pin
      expect(() => {
        loadConfig({
          ENVIRONMENT: "production",
          ADMIN_AUTH_ENABLED: "true",
          ADMIN_TOKEN_SECRET: "a".repeat(32),
          ALLOWED_ORIGINS: "https://nvcyclothon.in",
          VOLUNTEER_CHECKIN_PIN: "replace-with-event-day-pin",
          VOLUNTEER_TOKEN_SECRET: "b".repeat(16),
        });
      }).toThrow(/VOLUNTEER_CHECKIN_PIN must be at least 6 characters/i);

      // Placeholder volunteer token secret
      expect(() => {
        loadConfig({
          ENVIRONMENT: "production",
          ADMIN_AUTH_ENABLED: "true",
          ADMIN_TOKEN_SECRET: "a".repeat(32),
          ALLOWED_ORIGINS: "https://nvcyclothon.in",
          VOLUNTEER_CHECKIN_PIN: "vol-pin-123456",
          VOLUNTEER_TOKEN_SECRET: "replace-with-long-random-secret",
        });
      }).toThrow(/VOLUNTEER_TOKEN_SECRET must be set to a secure 16\+ character secret/);
    });
  });

  describe("Zero-Cost Open-Source Media Upload & Delivery Engine", () => {
    it("uploads raster image, converts to WebP, strips metadata, and serves with immutable caching", async () => {
      const sharp = require("sharp");
      const samplePng = await sharp({
        create: {
          width: 64,
          height: 64,
          channels: 4,
          background: { r: 16, g: 185, b: 129, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      // 1. Upload to /api/uploads/image
      const uploadRes = await request(runtime.app)
        .post("/api/uploads/image")
        .attach("file", samplePng, "test-cyclist.png")
        .field("folder", "community");

      expect(uploadRes.statusCode).toBe(201);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.format).toBe("webp");
      expect(uploadRes.body.url).toMatch(/^\/api\/media\/community\/.*\.webp$/);
      expect(uploadRes.body.width).toBe(64);
      expect(uploadRes.body.height).toBe(64);
      expect(uploadRes.body.size_bytes).toBeGreaterThan(0);

      // 2. Fetch via /api/media/...
      const mediaRes = await request(runtime.app).get(uploadRes.body.url);
      expect(mediaRes.statusCode).toBe(200);
      expect(mediaRes.headers["content-type"]).toBe("image/webp");
      expect(mediaRes.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
      expect(mediaRes.headers["x-content-type-options"]).toBe("nosniff");
      expect(mediaRes.body.length).toBe(uploadRes.body.size_bytes);
    });

    it("strictly blocks path traversal attempts on /api/media/*", async () => {
      const traversalAttempts = [
        "/api/media/../../package.json",
        "/api/media/..%2f..%2fpackage.json",
        "/api/media/etc/passwd",
        "/api/media/....//....//config.js",
      ];

      for (const attempt of traversalAttempts) {
        const res = await request(runtime.app).get(attempt);
        expect(res.statusCode).toBe(404);
      }
    });

    it("rejects non-image files with 415 Unsupported Media Type", async () => {
      const badFile = Buffer.from("echo 'malicious script';");
      const res = await request(runtime.app)
        .post("/api/uploads/image")
        .attach("file", badFile, "script.sh");

      expect(res.statusCode).toBe(415);
      expect(res.body.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("rejects malicious SVGs containing script tags or event handlers", async () => {
      const maliciousSvg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg"><script>alert('xss')</script><circle cx="5" cy="5" r="5"/></svg>`
      );
      const res = await request(runtime.app)
        .post("/api/uploads/image")
        .attach("file", maliciousSvg, { filename: "xss.svg", contentType: "image/svg+xml" });

      expect(res.statusCode).toBe(400);
      expect(res.body.detail).toContain("SVG file contains prohibited embedded scripts");
    });

    it("accepts and safely serves clean SVG images", async () => {
      const cleanSvg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="green"/></svg>`
      );
      const res = await request(runtime.app)
        .post("/api/uploads/image")
        .attach("file", cleanSvg, { filename: "logo.svg", contentType: "image/svg+xml" });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.format).toBe("svg");
      expect(res.body.url).toMatch(/^\/api\/media\/media\/.*\.svg$/);

      const fetchRes = await request(runtime.app).get(res.body.url);
      expect(fetchRes.statusCode).toBe(200);
      expect(fetchRes.headers["content-type"]).toContain("image/svg+xml");
      expect(fetchRes.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
    });
  });
});
