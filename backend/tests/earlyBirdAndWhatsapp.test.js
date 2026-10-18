const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");

describe("Early Bird Pricing Controls & WhatsApp Preferences", () => {
  let runtime;
  let adminToken;

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
      },
      logger: {
        info() {},
        error() {},
        log() {},
      },
    });

    const login = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    adminToken = login.body.access_token;
  });

  afterAll(async () => {
    await runtime.close();
  });

  beforeEach(() => {
    runtime.resetRateLimits();
  });

  it("exposes early_bird_enabled in public settings and guards admin patch", async () => {
    const initial = await request(runtime.app).get("/api/content/settings");
    expect(initial.statusCode).toBe(200);
    expect(initial.body.early_bird_enabled).toBe(true);

    const unauthorized = await request(runtime.app)
      .patch("/api/admin/settings")
      .send({ early_bird_enabled: false });
    expect(unauthorized.statusCode).toBe(401);

    const patchDisabled = await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ early_bird_enabled: false });
    expect(patchDisabled.statusCode).toBe(200);
    expect(patchDisabled.body.early_bird_enabled).toBe(false);

    const publicDisabled = await request(runtime.app).get("/api/content/settings");
    expect(publicDisabled.body.early_bird_enabled).toBe(false);

    const patchEnabled = await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ early_bird_enabled: true });
    expect(patchEnabled.statusCode).toBe(200);
    expect(patchEnabled.body.early_bird_enabled).toBe(true);
  });

  it("enforces regular price and rejects stale early-bird price when early bird is disabled", async () => {
    await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ early_bird_enabled: false });

    // Client attempts to submit stale early-bird price (39900 instead of regular 49900)
    const stalePriceRes = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Stale Price Rider",
        email: "stale-price@example.com",
        phone: "+91 9876543201",
        age: 26,
        city: "Rewa",
        gender: "Male",
        ride_category: "10 Km Green Ride",
        t_shirt_size: "M",
        waiver_accepted: true,
        privacy_accepted: true,
        expected_fee_paise: 39900,
      });

    expect(stalePriceRes.statusCode).toBe(409);
    expect(stalePriceRes.body.code).toBe("PRICE_CHANGED");
    expect(stalePriceRes.body.detail).toContain("Pricing configuration has changed");

    // Client submits expected regular price (49900)
    const validPriceRes = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Valid Price Rider",
        email: "valid-price@example.com",
        phone: "+91 9876543202",
        age: 26,
        city: "Rewa",
        gender: "Male",
        ride_category: "10 Km Green Ride",
        t_shirt_size: "M",
        waiver_accepted: true,
        privacy_accepted: true,
        expected_fee_paise: 49900,
      });

    expect(validPriceRes.statusCode).toBe(201);
    expect(validPriceRes.body.status).toBe("approved");

    const reg = await runtime.repository.getRegistrationById(validPriceRes.body.id);
    expect(reg.registration_fee_paise).toBe(49900);

    // Restore early bird enabled
    await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ early_bird_enabled: true });
  });

  it("handles primary mobile number preference for WhatsApp updates with consent", async () => {
    const res = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Primary WA Rider",
        email: "primary-wa@example.com",
        phone: "+91 98765 43210",
        age: 28,
        city: "Rewa",
        gender: "Female",
        ride_category: "10 Km Green Ride",
        t_shirt_size: "M",
        waiver_accepted: true,
        privacy_accepted: true,
        whatsapp_use_primary: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.whatsapp_use_primary).toBe(true);
    expect(res.body.whatsapp_opt_in).toBe(true);
    expect(res.body.preferred_whatsapp_number).toBe("+919876543210");

    const adminList = await request(runtime.app)
      .get("/api/admin/registrations")
      .set("Authorization", `Bearer ${adminToken}`);
    const found = adminList.body.find((item) => item.id === res.body.id);
    expect(found).toBeTruthy();
    expect(found.preferred_whatsapp_number).toBe("+919876543210");
    expect(found.whatsapp_opt_in).toBe(true);
    expect(found.whatsapp_consent_at).toBeTruthy();
  });

  it("handles alternate WhatsApp mobile number preference with normalization", async () => {
    const res = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Alternate WA Rider",
        email: "alternate-wa@example.com",
        phone: "+91 98765 11111",
        age: 32,
        city: "Satna",
        gender: "Male",
        ride_category: "10 Km Green Ride",
        t_shirt_size: "L",
        waiver_accepted: true,
        privacy_accepted: true,
        whatsapp_use_primary: false,
        whatsapp_number: "+91 98765 22222",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.whatsapp_use_primary).toBe(false);
    expect(res.body.whatsapp_opt_in).toBe(true);
    expect(res.body.preferred_whatsapp_number).toBe("+919876522222");

    const reg = await runtime.repository.getRegistrationById(res.body.id);
    expect(reg.whatsapp_number).toBe("+919876522222");
    expect(reg.preferred_whatsapp_number).toBe("+919876522222");
    expect(reg.whatsapp_opt_in).toBe(true);
  });

  it("handles non-opt-in when user unchecks primary without alternate WhatsApp number", async () => {
    const res = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Opt Out Rider",
        email: "optout-wa@example.com",
        phone: "+91 98765 33333",
        age: 35,
        city: "Bhopal",
        gender: "Male",
        ride_category: "10 Km Green Ride",
        t_shirt_size: "XL",
        waiver_accepted: true,
        privacy_accepted: true,
        whatsapp_use_primary: false,
        whatsapp_number: "",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.whatsapp_use_primary).toBe(false);
    expect(res.body.whatsapp_opt_in).toBe(false);
    expect(res.body.preferred_whatsapp_number).toBeNull();

    const reg = await runtime.repository.getRegistrationById(res.body.id);
    expect(reg.whatsapp_opt_in).toBe(false);
    expect(reg.preferred_whatsapp_number).toBeNull();
    expect(reg.whatsapp_consent_at).toBeNull();
  });

  it("rejects invalid alternate WhatsApp phone number format", async () => {
    const res = await request(runtime.app)
      .post("/api/cyclothon/registrations")
      .send({
        full_name: "Invalid Phone Rider",
        email: "badphone-wa@example.com",
        phone: "+91 98765 44444",
        age: 29,
        city: "Rewa",
        gender: "Female",
        ride_category: "10 Km Green Ride",
        t_shirt_size: "S",
        waiver_accepted: true,
        privacy_accepted: true,
        whatsapp_use_primary: false,
        whatsapp_number: "12345",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.detail).toContain("WhatsApp phone number");
  });
});
