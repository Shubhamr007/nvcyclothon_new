const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
  EARLY_BIRD_LIMIT,
  LAST_WEEK_START,
  RACE_CATEGORIES,
} = require("../constants");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
} = require("../errors");

const SITE_SECTIONS = [
  "editions",
  "about",
  "routes",
  "updates",
  "gallery",
  "why_sport",
  "contact",
  "sponsors",
  "community",
];

function defaultSiteSettings() {
  const sections = {};
  for (const key of SITE_SECTIONS) {
    sections[key] = true;
  }
  return {
    event_date: "2026-11-22",
    event_start_time: "5:30 AM",
    event_location: "Rewa, Madhya Pradesh",
    edition_label: "3rd Edition",
    registration_open: true,
    registration_tentative_date: "Upcoming Monday at 10:00 AM",
    partner_applications_open: true,
    vendor_applications_open: true,
    hero_images: [],
    feature_section: {
      enabled: false,
      eyebrow: "",
      title: "",
      body: "",
      image_url: "",
    },
    prize_pool: { enabled: false, eyebrow: "Prize pool", title: "Ride for the podium.", body: "", total: "", prizes: [], terms: "" },
    participant_kit: {
      enabled: true,
      eyebrow: "Every rider receives",
      title: "Your ride-day kit.",
      body: "Every registered participant receives these essentials on race day.",
      items: ["Event jersey", "Rider bib", "Finisher medal", "E-certificate", "Hydration support"],
      note: "Included with every registered category.",
    },
    sections,
    updated_at: null,
  };
}

function mergeSiteSettings(current, patch) {
  const next = { ...current };
  const allowedKeys = [
    "event_date",
    "event_start_time",
    "event_location",
    "edition_label",
    "registration_open",
    "registration_tentative_date",
    "partner_applications_open",
    "vendor_applications_open",
    "hero_images",
  ];
  for (const key of allowedKeys) {
    if (patch[key] !== undefined) {
      next[key] = patch[key];
    }
  }
  if (patch.feature_section && typeof patch.feature_section === "object") {
    next.feature_section = { ...current.feature_section, ...patch.feature_section };
  }
  for (const key of ["prize_pool", "participant_kit"]) {
    if (patch[key] && typeof patch[key] === "object") {
      next[key] = { ...(current[key] || defaultSiteSettings()[key]), ...patch[key] };
    }
  }
  if (patch.sections && typeof patch.sections === "object") {
    const nextSections = { ...current.sections };
    for (const key of SITE_SECTIONS) {
      if (patch.sections[key] !== undefined) {
        nextSections[key] = Boolean(patch.sections[key]);
      }
    }
    next.sections = nextSections;
  }
  next.updated_at = new Date().toISOString();
  return next;
}

class MockRepository {
  constructor() {
    this.reset();
  }

  reset() {
    this.tables = {
      products: [],
      wholesale_uploads: [],
      customers: [],
      orders: [],
      order_items: [],
      cyclothon_registrations: [],
      volunteer_checkin_logs: [],
      event_offers: [],
      chief_guests: [],
      organizing_members: [],
      sponsorship_tiers: [],
      delegations: [],
      community_posts: [],
      volunteer_accounts: [],
      rider_passes: [],
      participation_certificates: [],
      registration_email_deliveries: [],
      admin_users: [],
      page_visits: [],
      partner_applications: [],
      partner_brand_assets: [],
      partner_deliverables: [],
      partner_payments: [],
      vendor_applications: [],
    };
    this.ids = {
      products: 1,
      wholesale_uploads: 1,
      customers: 1,
      orders: 1,
      order_items: 1,
      cyclothon_registrations: 1,
      volunteer_checkin_logs: 1,
      event_offers: 1,
      chief_guests: 1,
      organizing_members: 1,
      sponsorship_tiers: 1,
      delegations: 1,
      community_posts: 1,
      volunteer_accounts: 1,
      rider_passes: 1,
      participation_certificates: 1,
      registration_email_deliveries: 1,
      admin_users: 1,
      page_visits: 1,
      partner_applications: 1,
      partner_brand_assets: 1,
      partner_deliverables: 1,
      partner_payments: 1,
      vendor_applications: 1,
    };
    this.siteSettings = defaultSiteSettings();
  }

  async init() {}

  async close() {}

  now() {
    return new Date();
  }

  nextId(table) {
    const id = this.ids[table];
    this.ids[table] += 1;
    return id;
  }

  clone(record) {
    return JSON.parse(JSON.stringify(record));
  }

  async seedProducts(catalogue) {
    const existing = new Set(this.tables.products.map((item) => item.slug));
    for (const product of catalogue) {
      if (existing.has(product.slug)) {
        continue;
      }
      this.tables.products.push({
        id: this.nextId("products"),
        slug: product.slug,
        name: product.name,
        origin: product.origin,
        price_paise: product.price_paise,
        description: product.description ?? null,
        image_url: product.image_url ?? null,
        inventory: product.inventory ?? 0,
        created_at: this.now(),
      });
    }
  }

  async ensureAdminUser(username, bootstrapPassword) {
    if (this.tables.admin_users.some((item) => item.username === username)) {
      return;
    }
    if (!bootstrapPassword) {
      throw new Error("ADMIN_BOOTSTRAP_PASSWORD is required to initialize the admin user");
    }
    this.tables.admin_users.push({
      id: this.nextId("admin_users"),
      username,
      password_hash: await bcrypt.hash(bootstrapPassword, 4),
      active: true,
    });
  }

  async getAdminUser(username) {
    return this.tables.admin_users.find((item) => item.username === username) || null;
  }

  async listProducts() {
    return this.tables.products
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((item) => this.clone(item));
  }

  async getProductBySlug(slug) {
    const product = this.tables.products.find((item) => item.slug === slug);
    return product ? this.clone(product) : null;
  }

  async createProduct(payload) {
    if (this.tables.products.some((item) => item.slug === payload.slug)) {
      throw new ConflictError("A product with this slug already exists");
    }
    const product = {
      id: this.nextId("products"),
      created_at: this.now(),
      description: null,
      image_url: null,
      ...payload,
    };
    this.tables.products.push(product);
    return this.clone(product);
  }

  async updateProductBySlug(slug, payload) {
    const product = this.tables.products.find((item) => item.slug === slug);
    if (!product) {
      return null;
    }
    Object.assign(product, payload);
    return this.clone(product);
  }

  async deleteProductBySlug(slug) {
    const index = this.tables.products.findIndex((item) => item.slug === slug);
    if (index < 0) {
      return false;
    }
    this.tables.products.splice(index, 1);
    return true;
  }

  async createOrder(payload) {
    const productMap = new Map();
    for (const line of payload.items) {
      const product = this.tables.products.find((item) => item.id === line.product_id);
      if (!product) {
        throw new NotFoundError("One or more products no longer exist");
      }
      productMap.set(product.id, product);
    }

    for (const line of payload.items) {
      const product = productMap.get(line.product_id);
      if (product.inventory < line.quantity) {
        throw new ConflictError(`Insufficient stock for ${product.name}`);
      }
    }

    let customer = this.tables.customers.find(
      (item) => item.email.toLowerCase() === payload.email.toLowerCase()
    );
    if (!customer) {
      customer = {
        id: this.nextId("customers"),
        email: payload.email.toLowerCase(),
        name: payload.customer_name,
        phone: payload.phone ?? null,
        created_at: this.now(),
      };
      this.tables.customers.push(customer);
    } else {
      customer.name = payload.customer_name;
      customer.phone = payload.phone ?? null;
    }

    const total_paise = payload.items.reduce((sum, line) => {
      const product = productMap.get(line.product_id);
      return sum + product.price_paise * line.quantity;
    }, 0);

    const order = {
      id: this.nextId("orders"),
      customer_id: customer.id,
      status: "pending",
      payment_status: "pending",
      total_paise,
      shipping_address: payload.shipping_address,
      created_at: this.now(),
    };
    this.tables.orders.push(order);

    const items = [];
    for (const line of payload.items) {
      const product = productMap.get(line.product_id);
      product.inventory -= line.quantity;
      const orderItem = {
        id: this.nextId("order_items"),
        order_id: order.id,
        product_id: product.id,
        quantity: line.quantity,
        unit_price_paise: product.price_paise,
      };
      this.tables.order_items.push(orderItem);
      items.push(orderItem);
    }

    return this.clone({
      ...order,
      items,
    });
  }

  async listOrders() {
    return this.tables.orders
      .slice()
      .sort((a, b) => b.id - a.id)
      .map((order) => ({
        ...this.clone(order),
        items: this.tables.order_items
          .filter((item) => item.order_id === order.id)
          .map((item) => this.clone(item)),
      }));
  }

  calculateRegistrationFee(rideCategory, eventDate = "2026-11-22") {
    const category = RACE_CATEGORIES[rideCategory];
    const categoryCount = this.tables.cyclothon_registrations.filter(
      (item) => item.ride_category === rideCategory && item.status !== "cancelled"
    ).length;
    if (categoryCount >= category.capacity) {
      throw new ConflictError(`${rideCategory} is full`);
    }
    if (rideCategory === "Kid-o-thon") {
      return category.regular;
    }

    const now = this.now();
    const lastWeekStart = new Date(`${eventDate}T00:00:00.000Z`);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
    if (now >= lastWeekStart) {
      return category.last_week;
    }

    const activeRegistrations = this.tables.cyclothon_registrations.filter(
      (item) => item.status !== "cancelled"
    ).length;
    return activeRegistrations < EARLY_BIRD_LIMIT
      ? category.early_bird
      : category.regular;
  }

  generateCheckinToken() {
    return crypto.randomBytes(18).toString("base64url");
  }

  async createCyclothonRegistration(payload, options) {
    // Remove any stale unpaid pending registration for this email so the user can retry
    this.tables.cyclothon_registrations = this.tables.cyclothon_registrations.filter(
      (item) =>
        !(item.email.toLowerCase() === payload.email.toLowerCase() &&
          item.status === "pending" &&
          item.payment_status === "pending")
    );

    const duplicate = this.tables.cyclothon_registrations.find(
      (item) => item.email.toLowerCase() === payload.email.toLowerCase()
    );
    if (duplicate) {
      throw new ConflictError("This email is already registered for NV Cyclothon");
    }

    const registrationFee = this.calculateRegistrationFee(
      payload.ride_category,
      options.eventDate
    );
    const isPaidRegistration = options.paymentEnabled;
    const registration = {
      id: this.nextId("cyclothon_registrations"),
      full_name: payload.full_name,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      age: payload.age,
      city: payload.city,
      gender: payload.gender,
      ride_category: payload.ride_category,
      organization_type: payload.organization_type || "Individual",
      organization_name: payload.organization_name || null,
      emergency_contact: payload.emergency_contact,
      t_shirt_size: payload.t_shirt_size,
      waiver_accepted: true,
      privacy_accepted: true,
      status: isPaidRegistration ? "pending" : "approved",
      registration_fee_paise: registrationFee,
      payment_status: isPaidRegistration ? "pending" : "paid",
      payment_order_id: null,
      payment_id: null,
      payment_signature: null,
      payment_provider: "cashfree",
      payment_verified_at: isPaidRegistration ? null : this.now(),
      checkin_token: this.generateCheckinToken(),
      checked_in_at: null,
      checked_in_by: null,
      checkin_method: null,
      checkin_device: null,
      created_at: this.now(),
    };

    let checkout = null;
    if (options.paymentEnabled) {
      const order = await options.createPaymentOrder({
        amountPaise: registration.registration_fee_paise,
        receipt: `cyclothon-${registration.id}`,
        registration,
      });
      registration.payment_order_id = order.id;
      registration.payment_provider = "cashfree";
      checkout = {
        provider: "cashfree",
        order_id: order.id,
        payment_session_id: order.payment_session_id,
        mode: order.mode,
      };
    }

    this.tables.cyclothon_registrations.push(registration);
    return {
      registration: this.clone(registration),
      checkout,
    };
  }

  async getRegistrationByOrderId(orderId) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.payment_order_id === orderId
    );
    return registration ? this.clone(registration) : null;
  }

  async verifyCyclothonPayment(registrationId, payload, expectedSignature) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.id === registrationId
    );
    const existingOrderId = registration?.payment_order_id;
    if (!registration || !existingOrderId) {
      throw new NotFoundError("Payment registration not found");
    }

    const orderId = payload.order_id || payload.payment_order_id;
    const paymentId = payload.payment_id;
    const signature = payload.signature || payload.payment_signature;

    if (registration.payment_status === "paid") {
      const existingPaymentId = registration.payment_id;
      if (existingPaymentId === paymentId) {
        return this.clone(registration);
      }
      throw new ConflictError("This registration has already been paid");
    }

    if (orderId !== existingOrderId) {
      throw new ValidationError("Payment order does not match this registration");
    }

    if (expectedSignature && signature !== expectedSignature) {
      throw new ValidationError("Payment signature verification failed");
    }

    const duplicatePayment = this.tables.cyclothon_registrations.find(
      (item) =>
        item.id !== registration.id &&
        item.payment_id && item.payment_id === paymentId
    );
    if (duplicatePayment) {
      throw new ConflictError("This payment has already been recorded");
    }

    registration.payment_status = "paid";
    if (registration.status === "pending") {
      registration.status = "approved";
    }
    registration.payment_id = paymentId;
    registration.payment_signature = signature;
    registration.payment_provider = "cashfree";
    registration.payment_verified_at = this.now();

    return this.clone(registration);
  }

  async markCyclothonPaymentFromWebhook({ orderId, paymentId }) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.payment_order_id === orderId
    );
    if (!registration) {
      throw new NotFoundError("Payment registration not found");
    }
    if (registration.payment_status === "paid") {
      return this.clone(registration);
    }
    registration.payment_status = "paid";
    registration.status = registration.status === "pending" ? "approved" : registration.status;
    registration.payment_id = paymentId;
    registration.payment_provider = "cashfree";
    registration.payment_verified_at = this.now();
    return this.clone(registration);
  }

  async listRegistrations(filters = {}) {
    const { search, status, route, limit, offset } = filters || {};
    let items = this.tables.cyclothon_registrations.slice();

    if (status && status !== "all") {
      items = items.filter((item) => item.status === status);
    }
    if (route && route !== "all") {
      items = items.filter((item) => item.ride_category === route);
    }
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      const idCandidate = Number.parseInt(q, 10);
      const digits = q.replace(/\D+/g, "");
      items = items.filter((item) => {
        if (Number.isInteger(idCandidate) && item.id === idCandidate) return true;
        const phoneDigits = String(item.phone || "").replace(/\D+/g, "");
        return (
          String(item.full_name || "").toLowerCase().includes(q) ||
          String(item.email || "").toLowerCase().includes(q) ||
          String(item.city || "").toLowerCase().includes(q) ||
          (digits && phoneDigits.includes(digits))
        );
      });
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (offset && Number.isInteger(Number(offset)) && Number(offset) > 0) {
      items = items.slice(Number(offset));
    }
    if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) {
      items = items.slice(0, Number(limit));
    }

    return items.map((item) => ({
      ...this.clone(item),
      rider_pass_status: this.tables.rider_passes.find((pass) => pass.registration_id === item.id)?.status || null,
      certificate_status: this.tables.participation_certificates.find((certificate) => certificate.registration_id === item.id)?.status || null,
      certificate_recipient: this.tables.registration_email_deliveries.find((delivery) => delivery.registration_id === item.id && delivery.email_type === "certificate")?.recipient || null,
      certificate_delivery_status: this.tables.registration_email_deliveries.find((delivery) => delivery.registration_id === item.id && delivery.email_type === "certificate")?.status || null,
      certificate_sent_at: this.tables.registration_email_deliveries.find((delivery) => delivery.registration_id === item.id && delivery.email_type === "certificate")?.sent_at || null,
      certificate_attempt_count: this.tables.registration_email_deliveries.find((delivery) => delivery.registration_id === item.id && delivery.email_type === "certificate")?.attempt_count || null,
      registration_email_status: this.tables.registration_email_deliveries.find((delivery) => delivery.registration_id === item.id && delivery.email_type === "registration_confirmation")?.status || null,
    }));
  }

  async getRegistrationById(registrationId) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.id === registrationId
    );
    return registration ? this.clone(registration) : null;
  }

  async recordEmailDelivery({ registrationId, emailType, recipient, subject, sent, status = sent ? "sent" : "failed", errorMessage = null }) {
    const existing = this.tables.registration_email_deliveries.find(
      (item) => item.registration_id === registrationId && item.email_type === emailType
    );
    if (existing) {
      existing.recipient = recipient;
      existing.subject = subject;
      existing.status = status;
      existing.attempt_count += 1;
      existing.last_error = errorMessage;
      existing.sent_at = sent ? this.now() : existing.sent_at;
      existing.updated_at = this.now();
      return;
    }
    this.tables.registration_email_deliveries.push({
      id: this.nextId("registration_email_deliveries"), registration_id: registrationId, email_type: emailType,
      recipient, subject, status, attempt_count: 1, last_error: errorMessage,
      sent_at: sent ? this.now() : null, created_at: this.now(), updated_at: this.now(),
    });
  }

  async recordRiderPass(registrationId, sent) {
    const existing = this.tables.rider_passes.find((item) => item.registration_id === registrationId);
    if (existing) {
      existing.status = sent ? "sent" : "generated";
      existing.generated_at = this.now();
      existing.emailed_at = sent ? this.now() : existing.emailed_at;
      return;
    }
    this.tables.rider_passes.push({ id: this.nextId("rider_passes"), registration_id: registrationId, template_version: "2026-approved", status: sent ? "sent" : "generated", generated_at: this.now(), emailed_at: sent ? this.now() : null });
  }

  async recordParticipationCertificate(registrationId, sent) {
    const existing = this.tables.participation_certificates.find((item) => item.registration_id === registrationId);
    if (existing) {
      existing.status = sent ? "sent" : "generated";
      existing.generated_at = this.now();
      existing.emailed_at = sent ? this.now() : existing.emailed_at;
      return;
    }
    this.tables.participation_certificates.push({ id: this.nextId("participation_certificates"), registration_id: registrationId, template_version: "2026-approved", status: sent ? "sent" : "generated", generated_at: this.now(), emailed_at: sent ? this.now() : null });
  }

  async updateRegistrationStatus(registrationId, status) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.id === registrationId
    );
    if (!registration) {
      return null;
    }
    registration.status = status;
    return this.clone(registration);
  }

  async bulkUpdateRegistrationStatus(registrationIds, status) {
    const ids = [...new Set(registrationIds)].sort((a, b) => a - b);
    let updated = 0;
    const found = new Set();
    for (const registration of this.tables.cyclothon_registrations) {
      if (ids.includes(registration.id)) {
        registration.status = status;
        found.add(registration.id);
        updated += 1;
      }
    }

    return {
      updated,
      missing_ids: ids.filter((id) => !found.has(id)),
    };
  }

  async searchRegistrationsForCheckin(query, limit = 25) {
    const trimmed = String(query || "").trim().toLowerCase();
    if (!trimmed) {
      return [];
    }
    const idCandidate = Number.parseInt(trimmed, 10);
    const digits = trimmed.replace(/\D+/g, "");

    const results = this.tables.cyclothon_registrations
      .filter((registration) => {
        if (Number.isInteger(idCandidate) && registration.id === idCandidate) {
          return true;
        }
        const phoneDigits = String(registration.phone || "").replace(/\D+/g, "");
        return (
          String(registration.full_name || "").toLowerCase().includes(trimmed) ||
          String(registration.email || "").toLowerCase().includes(trimmed) ||
          String(registration.city || "").toLowerCase().includes(trimmed) ||
          (digits && phoneDigits.includes(digits))
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        phone: item.phone,
        city: item.city,
        ride_category: item.ride_category,
        status: item.status,
        payment_status: item.payment_status,
        checked_in_at: item.checked_in_at,
        checked_in_by: item.checked_in_by,
        checkin_method: item.checkin_method,
        payment_verified_at: item.payment_verified_at,
        created_at: item.created_at,
      }));

    return results;
  }

  addCheckinLog(payload) {
    this.tables.volunteer_checkin_logs.push({
      id: this.nextId("volunteer_checkin_logs"),
      registration_id: payload.registrationId,
      volunteer_name: payload.volunteerName,
      method: payload.method,
      source_device: payload.sourceDevice,
      outcome: payload.outcome,
      notes: payload.notes,
      scanned_at: this.now(),
    });
  }

  finalizeCheckin(registration, metadata) {
    if (registration.payment_status !== "paid") {
      this.addCheckinLog({
        registrationId: registration.id,
        volunteerName: metadata.volunteerName,
        method: metadata.method,
        sourceDevice: metadata.sourceDevice,
        outcome: "payment_pending",
        notes: "Payment verification is pending",
      });
      throw new ConflictError("Payment is not verified for this participant");
    }

    if (registration.status === "cancelled") {
      this.addCheckinLog({
        registrationId: registration.id,
        volunteerName: metadata.volunteerName,
        method: metadata.method,
        sourceDevice: metadata.sourceDevice,
        outcome: "cancelled",
        notes: "Registration is cancelled",
      });
      throw new ConflictError("Cancelled registrations cannot be checked in");
    }

    if (registration.status === "checked_in") {
      this.addCheckinLog({
        registrationId: registration.id,
        volunteerName: metadata.volunteerName,
        method: metadata.method,
        sourceDevice: metadata.sourceDevice,
        outcome: "duplicate",
        notes: "Participant already checked in",
      });
      return {
        already_checked_in: true,
        registration: this.clone(registration),
      };
    }

    registration.status = "checked_in";
    registration.checked_in_at = registration.checked_in_at || this.now();
    registration.checked_in_by = metadata.volunteerName;
    registration.checkin_method = metadata.method;
    registration.checkin_device = metadata.sourceDevice;

    this.addCheckinLog({
      registrationId: registration.id,
      volunteerName: metadata.volunteerName,
      method: metadata.method,
      sourceDevice: metadata.sourceDevice,
      outcome: "checked_in",
      notes: null,
    });

    return {
      already_checked_in: false,
      registration: this.clone(registration),
    };
  }

  async checkInByToken(checkinToken, metadata) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.checkin_token === checkinToken
    );
    if (!registration) {
      throw new NotFoundError("Participant not found for this QR code");
    }
    return this.finalizeCheckin(registration, metadata);
  }

  async checkInByRegistrationId(registrationId, metadata) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.id === registrationId
    );
    if (!registration) {
      throw new NotFoundError("Participant not found");
    }
    return this.finalizeCheckin(registration, metadata);
  }

  async getRegistrationsByIds(ids) {
    const set = new Set(ids);
    return this.tables.cyclothon_registrations
      .filter((item) => set.has(item.id))
      .map((item) => this.clone(item));
  }

  async listRegistrationContacts() {
    return this.tables.cyclothon_registrations.map((item) => ({
      id: item.id,
      email: item.email,
    }));
  }

  async listRegistrationEmails() {
    return this.tables.cyclothon_registrations.map((item) => item.email);
  }

  async getAnalytics() {
    const statuses = {};
    const routes = {};
    for (const registration of this.tables.cyclothon_registrations) {
      statuses[registration.status] = (statuses[registration.status] || 0) + 1;
      routes[registration.ride_category] = (routes[registration.ride_category] || 0) + 1;
    }

    const cityMap = {};
    for (const registration of this.tables.cyclothon_registrations) {
      cityMap[registration.city] = (cityMap[registration.city] || 0) + 1;
    }

    const now = this.now();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const registrationsToday = this.tables.cyclothon_registrations.filter(
      (item) => new Date(item.created_at).getTime() >= dayStart.getTime()
    ).length;

    const activeOffers = this.tables.event_offers.filter((offer) => {
      if (!offer.active) {
        return false;
      }
      const startsAt = offer.starts_at ? new Date(offer.starts_at) : null;
      const endsAt = offer.ends_at ? new Date(offer.ends_at) : null;
      if (startsAt && startsAt > now) {
        return false;
      }
      if (endsAt && endsAt < now) {
        return false;
      }
      return true;
    }).length;

    return {
      total_registrations: Object.values(statuses).reduce((sum, value) => sum + value, 0),
      approved_registrations: statuses.approved || 0,
      checked_in_registrations: statuses.checked_in || 0,
      registrations_today: registrationsToday,
      registrations_by_route: routes,
      registrations_by_status: statuses,
      registrations_by_city: Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count })),
      delegation_count: this.tables.delegations.length,
      delegation_members: this.tables.delegations.reduce(
        (sum, delegation) => sum + delegation.member_count,
        0
      ),
      active_offers: activeOffers,
    };
  }

  async recordPageVisit(payload) {
    this.tables.page_visits.push({ ...payload, created_at: this.now() });
  }

  async getVisitorAnalytics() {
    const visits = this.tables.page_visits;
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    const half_day = [{ label: "00:00–11:59", count: 0 }, { label: "12:00–23:59", count: 0 }];
    const days = {};
    const timezones = {};
    for (const visit of visits) {
      const date = new Date(visit.created_at);
      hourly[date.getUTCHours()].count += 1;
      half_day[date.getUTCHours() < 12 ? 0 : 1].count += 1;
      const day = date.toISOString().slice(0, 10);
      days[day] = (days[day] || 0) + 1;
      if (visit.timezone) timezones[visit.timezone] = (timezones[visit.timezone] || 0) + 1;
    }
    return { total_visits: visits.length, hourly, half_day, daily: Object.entries(days).sort().slice(-14).map(([day, count]) => ({ day, count })), timezones: Object.entries(timezones).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([timezone, count]) => ({ timezone, count })) };
  }

  listByCreatedAt(table) {
    return this.tables[table]
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((item) => this.clone(item));
  }

  async listOffers() {
    return this.listByCreatedAt("event_offers");
  }

  async listPublicOffers() {
    const now = this.now();
    return this.tables.event_offers
      .filter((offer) => {
        if (!offer.active) {
          return false;
        }
        if (offer.starts_at && new Date(offer.starts_at) > now) {
          return false;
        }
        if (offer.ends_at && new Date(offer.ends_at) < now) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((item) => this.clone(item));
  }

  async createOffer(payload) {
    const offer = {
      id: this.nextId("event_offers"),
      created_at: this.now(),
      ...payload,
    };
    this.tables.event_offers.push(offer);
    return this.clone(offer);
  }

  async updateOffer(id, payload) {
    const offer = this.tables.event_offers.find((item) => item.id === id);
    if (!offer) {
      return null;
    }
    Object.assign(offer, payload);
    return this.clone(offer);
  }

  async deleteOffer(id) {
    const index = this.tables.event_offers.findIndex((item) => item.id === id);
    if (index < 0) {
      return false;
    }
    this.tables.event_offers.splice(index, 1);
    return true;
  }

  async listChiefGuests() {
    return this.listByCreatedAt("chief_guests");
  }

  async listPublicChiefGuests() {
    return this.tables.chief_guests
      .filter((item) => item.featured)
      .sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .map((item) => this.clone(item));
  }

  async createChiefGuest(payload) {
    const guest = {
      id: this.nextId("chief_guests"),
      created_at: this.now(),
      ...payload,
    };
    this.tables.chief_guests.push(guest);
    return this.clone(guest);
  }

  async listOrganizingMembers() {
    return this.tables.organizing_members
      .slice()
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
      .map((item) => this.clone(item));
  }

  async listPublicOrganizingMembers() {
    return (await this.listOrganizingMembers()).filter((item) => item.visible);
  }

  async createOrganizingMember(payload) {
    const member = { id: this.nextId("organizing_members"), created_at: this.now(), updated_at: this.now(), ...payload };
    this.tables.organizing_members.push(member);
    return this.clone(member);
  }

  async updateOrganizingMember(id, payload) {
    const member = this.tables.organizing_members.find((item) => item.id === id);
    if (!member) return null;
    Object.assign(member, payload, { updated_at: this.now() });
    return this.clone(member);
  }

  async deleteOrganizingMember(id) {
    const index = this.tables.organizing_members.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.tables.organizing_members.splice(index, 1);
    return true;
  }

  async seedOrganizingMembers() {
    if (this.tables.organizing_members.length > 0) return;
    const members = [
      ["Rajiv Khanna", "President, RDCA", "I am proud to help build a safer and stronger cycling culture across the Vindhya region."],
      ["Sunil Singh", "Vice President, RDCA", "Every rider who joins us adds momentum to a healthier, more connected community."],
      ["Vibhu Suri", "Secretary, RDCA", "Good events are built by detail, teamwork, and a shared belief in the road ahead."],
      ["Aman Mishra", "Joint Secretary, RDCA", "NV Cyclothon turns individual effort into a movement the whole region can feel."],
      ["CA Prashant Jain", "Office Bureau, RDCA", "Our goal is simple: make every edition more welcoming, credible, and memorable."],
    ];
    for (const [index, [name, role, message]] of members.entries()) {
      await this.createOrganizingMember({ name, role, message, image_url: null, display_order: index, visible: true });
    }
  }

  async listSponsorshipTiers() {
    return this.tables.sponsorship_tiers.slice().sort((a, b) => a.display_order - b.display_order || a.id - b.id).map((item) => this.clone(item));
  }

  async listPublicSponsorshipTiers() {
    return (await this.listSponsorshipTiers()).filter((item) => item.active);
  }

  async createSponsorshipTier(payload) {
    const tier = { id: this.nextId("sponsorship_tiers"), created_at: this.now(), updated_at: this.now(), ...payload };
    this.tables.sponsorship_tiers.push(tier);
    return this.clone(tier);
  }

  async updateSponsorshipTier(id, payload) {
    const tier = this.tables.sponsorship_tiers.find((item) => item.id === id);
    if (!tier) return null;
    Object.assign(tier, payload, { updated_at: this.now() });
    return this.clone(tier);
  }

  async deleteSponsorshipTier(id) {
    const index = this.tables.sponsorship_tiers.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.tables.sponsorship_tiers.splice(index, 1);
    return true;
  }

  async seedSponsorshipTiers() {
    if (this.tables.sponsorship_tiers.length > 0) return;
    const tiers = [
      ["Title Sponsor", 50000000, "1 available", "Largest logo on jersey, start/finish arch, bibs, website and press backdrop.", 10],
      ["Powered By Sponsor", 25000000, "2 available", "Large logo on jersey, website, stage backdrop and event collateral.", 5],
      ["Associate Sponsor", 10000000, "4-6 available", "Logo on jersey sleeves, banners, signage and website.", 3],
      ["Supporting Partner", 5000000, "Multiple", "Logo on event signage and website.", 2],
      ["Hydration / Medical Partner", 5000000, "Category exclusive", "Branding at water stations, medical booth and ambulance support.", 0],
      ["Media Partner", 0, "In-kind exclusive", "Exclusive media rights and logo on media backdrops.", 0],
    ];
    for (const [index, [name, amount_paise, availability, benefits, complimentary_entries]] of tiers.entries()) {
      await this.createSponsorshipTier({ name, amount_paise, availability, benefits, complimentary_entries, active: true, display_order: index });
    }
  }

  async updateChiefGuest(id, payload) {
    const guest = this.tables.chief_guests.find((item) => item.id === id);
    if (!guest) {
      return null;
    }
    Object.assign(guest, payload);
    return this.clone(guest);
  }

  async deleteChiefGuest(id) {
    const index = this.tables.chief_guests.findIndex((item) => item.id === id);
    if (index < 0) {
      return false;
    }
    this.tables.chief_guests.splice(index, 1);
    return true;
  }

  async listDelegations() {
    return this.listByCreatedAt("delegations");
  }

  async createDelegation(payload) {
    const delegation = {
      id: this.nextId("delegations"),
      created_at: this.now(),
      ...payload,
    };
    this.tables.delegations.push(delegation);
    return this.clone(delegation);
  }

  async updateDelegation(id, payload) {
    const delegation = this.tables.delegations.find((item) => item.id === id);
    if (!delegation) {
      return null;
    }
    Object.assign(delegation, payload);
    return this.clone(delegation);
  }

  async deleteDelegation(id) {
    const index = this.tables.delegations.findIndex((item) => item.id === id);
    if (index < 0) {
      return false;
    }
    this.tables.delegations.splice(index, 1);
    return true;
  }

  async createUploadRecord(payload) {
    const record = {
      id: this.nextId("wholesale_uploads"),
      created_at: this.now(),
      ...payload,
    };
    this.tables.wholesale_uploads.push(record);
    return this.clone(record);
  }

  async getSiteSettings() {
    const data = { ...this.siteSettings };
    if (this.config?.registrationOpen !== undefined) {
      data.registration_open = this.config.registrationOpen;
    }
    if (this.config?.partnerApplicationsOpen !== undefined) {
      data.partner_applications_open = this.config.partnerApplicationsOpen;
    }
    if (this.config?.vendorApplicationsOpen !== undefined) {
      data.vendor_applications_open = this.config.vendorApplicationsOpen;
    }
    data.registration_tentative_date =
      this.config?.registrationTentativeDate ||
      data.registration_tentative_date ||
      "Upcoming Monday at 10:00 AM";
    return this.clone(data);
  }

  async updateSiteSettings(patch) {
    this.siteSettings = mergeSiteSettings(this.siteSettings, patch || {});
    return this.clone(this.siteSettings);
  }

  async listVolunteerAccounts() {
    return this.tables.volunteer_accounts
      .slice()
      .sort((a, b) => a.volunteer_id.localeCompare(b.volunteer_id))
      .map((account) => this.clone(account));
  }

  async getVolunteerAccount(volunteerId) {
    const normalized = String(volunteerId || "").trim().toLowerCase();
    return this.clone(
      this.tables.volunteer_accounts.find((account) => account.volunteer_id === normalized) || null
    );
  }

  async getVolunteerAccountById(id) {
    return this.clone(
      this.tables.volunteer_accounts.find((account) => account.id === Number(id)) || null
    );
  }

  async hasActiveVolunteerAccounts() {
    return this.tables.volunteer_accounts.some((account) => account.active);
  }

  async createVolunteerAccount(payload) {
    const volunteerId = String(payload.volunteer_id || "").trim().toLowerCase();
    if (this.tables.volunteer_accounts.some((account) => account.volunteer_id === volunteerId)) {
      throw new ConflictError("Volunteer ID is already in use");
    }
    const record = {
      id: this.nextId("volunteer_accounts"),
      volunteer_id: volunteerId,
      display_name: payload.display_name,
      password_hash: payload.password_hash,
      email: payload.email || null,
      phone: payload.phone || null,
      role: payload.role || "Check-in Desk",
      organization: payload.organization || null,
      certificate_status: payload.certificate_status || "not_issued",
      certificate_sent_at: payload.certificate_sent_at || null,
      credentials_sent_at: payload.credentials_sent_at || null,
      active: true,
      created_at: this.now().toISOString(),
      updated_at: this.now().toISOString(),
    };
    this.tables.volunteer_accounts.push(record);
    return this.clone(record);
  }

  async updateVolunteerAccount(id, patch) {
    const account = this.tables.volunteer_accounts.find((item) => item.id === Number(id));
    if (!account) return null;
    if (patch.display_name !== undefined) account.display_name = patch.display_name;
    if (patch.password_hash !== undefined) account.password_hash = patch.password_hash;
    if (patch.active !== undefined) account.active = Boolean(patch.active);
    if (patch.email !== undefined) account.email = patch.email;
    if (patch.phone !== undefined) account.phone = patch.phone;
    if (patch.role !== undefined) account.role = patch.role;
    if (patch.organization !== undefined) account.organization = patch.organization;
    if (patch.certificate_status !== undefined) account.certificate_status = patch.certificate_status;
    if (patch.certificate_sent_at !== undefined) account.certificate_sent_at = patch.certificate_sent_at;
    if (patch.credentials_sent_at !== undefined) account.credentials_sent_at = patch.credentials_sent_at;
    account.updated_at = this.now().toISOString();
    return this.clone(account);
  }

  async createCommunityPost(payload) {
    const record = {
      id: this.nextId("community_posts"),
      name: payload.name,
      message: payload.message,
      image_key: payload.image_key || null,
      image_content_type: payload.image_content_type || null,
      image_size_bytes: payload.image_size_bytes || null,
      status: "pending",
      submitted_ip: payload.submitted_ip || null,
      submitted_user_agent: payload.submitted_user_agent || null,
      created_at: this.now().toISOString(),
      moderated_at: null,
      moderated_by: null,
      moderation_reason: null,
    };
    this.tables.community_posts.push(record);
    return this.clone(record);
  }

  async countCommunityPostsForIpSince(ip, sinceIso) {
    if (!ip) return 0;
    const since = new Date(sinceIso).getTime();
    return this.tables.community_posts.filter(
      (post) => post.submitted_ip === ip && new Date(post.created_at).getTime() >= since
    ).length;
  }

  async listApprovedCommunityPosts(limit = 60) {
    const rows = this.tables.community_posts
      .filter((post) => post.status === "approved")
      .sort((a, b) => new Date(b.moderated_at || b.created_at) - new Date(a.moderated_at || a.created_at))
      .slice(0, limit);
    return rows.map((row) => this.clone(row));
  }

  async countApprovedCommunityPosts() {
    return this.tables.community_posts.filter((p) => p.status === "approved").length;
  }

  async listPendingCommunityPosts(limit = 100) {
    const rows = this.tables.community_posts
      .filter((post) => post.status === "pending")
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(0, limit);
    return rows.map((row) => this.clone(row));
  }

  async getCommunityPostById(id) {
    return this.clone(
      this.tables.community_posts.find((post) => post.id === Number(id)) || null
    );
  }

  async getCommunityPostByImageKey(key) {
    return this.clone(
      this.tables.community_posts.find((post) => post.image_key === String(key)) || null
    );
  }

  async moderateCommunityPost(id, { status, moderator, reason }) {
    const post = this.tables.community_posts.find((p) => p.id === Number(id));
    if (!post) throw new NotFoundError("Community post not found");
    if (!["approved", "rejected"].includes(status)) {
      throw new ValidationError("Invalid moderation status");
    }
    post.status = status;
    post.moderated_at = this.now().toISOString();
    post.moderated_by = moderator || null;
    post.moderation_reason = reason || null;
    return this.clone(post);
  }

  async listCommunityPostsByStatus(status, limit = 100) {
    let rows = this.tables.community_posts;
    if (status && status !== "all") {
      rows = rows.filter((post) => post.status === status);
    }
    rows = rows
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
    return rows.map((row) => this.clone(row));
  }

  async deleteCommunityPost(id) {
    const index = this.tables.community_posts.findIndex((p) => p.id === Number(id));
    if (index === -1) return null;
    const [removed] = this.tables.community_posts.splice(index, 1);
    return this.clone(removed);
  }


  // --- Sponsorship Tiers Helper ---

  async getSponsorshipTierById(id) {
    const tier = this.tables.sponsorship_tiers.find((item) => item.id === Number(id));
    return tier ? this.clone(tier) : null;
  }

  // --- Partner Applications ---

  generatePartnerApplicationNumber() {
    return `NV-26-P-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  generateVendorApplicationNumber() {
    return `NV-26-V-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  async createPartnerApplication(payload) {
    const partnerId = this.nextId("partner_applications");
    const appNumber = payload.application_number || this.generatePartnerApplicationNumber();
    const partner = {
      id: partnerId,
      application_number: appNumber,
      company_name: payload.company_name,
      brand_name: payload.brand_name || payload.company_name,
      business_type: payload.business_type || 'Corporate',
      contact_name: payload.contact_name,
      designation: payload.designation || null,
      email: payload.email,
      phone: payload.phone,
      website: payload.website || null,
      gst_number: payload.gst_number || null,
      pan_number: payload.pan_number || null,
      address: payload.address || null,
      city: payload.city || null,
      state: payload.state || null,
      pincode: payload.pincode || null,
      sponsorship_tier_id: payload.sponsorship_tier_id || null,
      package_name: payload.package_name || payload.selected_package || null,
      partnership_type: payload.partnership_type || 'Cash Sponsorship',
      proposed_value: payload.proposed_value || null,
      custom_description: payload.custom_description || payload.message || null,
      brand_tagline: payload.brand_tagline || null,
      brand_description: payload.brand_description || null,
      industry: payload.industry || null,
      social_links: payload.social_links || {},
      logo_key: payload.logo_key || null,
      logo_content_type: payload.logo_content_type || null,
      logo_size_bytes: payload.logo_size_bytes || null,
      activation_options: payload.activation_options || [],
      activation_description: payload.activation_description || null,
      visibility_interests: payload.visibility_interests || [],
      status: payload.status || 'SUBMITTED',
      payment_status: payload.payment_status || 'PENDING',
      application_fee_paise: payload.application_fee_paise || 0,
      payment_order_id: payload.payment_order_id || payload.order_id || null,
      payment_id: null,
      payment_signature: null,
      payment_verified_at: null,
      reviewed_by: null,
      reviewed_at: null,
      approved_at: null,
      review_notes: null,
      created_at: this.now(),
      updated_at: this.now(),
    };
    this.tables.partner_applications.push(partner);

    const defaultDeliverables = [
      'Logo on Official Website',
      'Logo on Social Media Announcement',
      'Event Signage Placement',
      'Certificate of Partnership',
    ];
    if (Array.isArray(payload.visibility_interests) && payload.visibility_interests.length > 0) {
      for (const item of payload.visibility_interests) {
        if (!defaultDeliverables.includes(`Branding: ${item}`)) {
          defaultDeliverables.push(`Branding: ${item}`);
        }
      }
    }
    for (const d of defaultDeliverables) {
      this.tables.partner_deliverables.push({
        id: this.nextId("partner_deliverables"),
        partner_id: partnerId,
        deliverable_type: d,
        status: 'PENDING',
        notes: null,
        completed_at: null,
        created_at: this.now(),
      });
    }

    return this.clone(partner);
  }

  async listPartnerApplications(options = {}) {
    let status = null;
    let search = null;
    if (typeof options === 'string') {
      status = options;
    } else if (options && typeof options === 'object') {
      status = options.status || null;
      search = options.search || null;
    }

    let list = this.tables.partner_applications.slice();
    if (status && status !== 'all') {
      list = list.filter((p) => p.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        (p.company_name && p.company_name.toLowerCase().includes(q)) ||
        (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.application_number && p.application_number.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list.map((item) => {
      const cloned = this.clone(item);
      const tier = this.tables.sponsorship_tiers.find((t) => t.id === cloned.sponsorship_tier_id);
      cloned.tier_name = tier?.name || cloned.package_name || null;
      return cloned;
    });
  }

  async getPartnerApplicationById(id) {
    const partner = this.tables.partner_applications.find((p) => p.id === Number(id));
    if (!partner) return null;
    const cloned = this.clone(partner);
    const tier = this.tables.sponsorship_tiers.find((t) => t.id === cloned.sponsorship_tier_id);
    cloned.tier_name = tier?.name || cloned.package_name || null;
    return cloned;
  }

  async getPartnerApplicationByNumber(appNum) {
    const partner = this.tables.partner_applications.find((p) => p.application_number === appNum);
    if (!partner) return null;
    const cloned = this.clone(partner);
    const tier = this.tables.sponsorship_tiers.find((t) => t.id === cloned.sponsorship_tier_id);
    cloned.tier_name = tier?.name || cloned.package_name || null;
    return cloned;
  }

  async updatePartnerApplicationStatus(id, { status, reviewer, notes }) {
    const partner = this.tables.partner_applications.find((p) => p.id === Number(id));
    if (!partner) return null;
    partner.status = status;
    partner.reviewed_by = reviewer || 'admin';
    partner.review_notes = notes || null;
    partner.reviewed_at = this.now();
    if (String(status).toUpperCase() === 'APPROVED') {
      partner.approved_at = this.now();
    }
    partner.updated_at = this.now();
    return this.clone(partner);
  }

  async verifyPartnerPayment(id, { paymentId, signature }) {
    const partner = this.tables.partner_applications.find((p) => p.id === Number(id));
    if (!partner) return null;
    partner.payment_status = 'PAYMENT_VERIFIED';
    partner.status = 'PAYMENT_VERIFIED';
    partner.payment_id = paymentId;
    partner.payment_signature = signature;
    partner.payment_verified_at = this.now();
    partner.updated_at = this.now();
    return this.clone(partner);
  }

  async listApprovedPartners() {
    const approved = this.tables.partner_applications
      .filter((p) => p.status === 'APPROVED' || p.status === 'EVENT_READY' || p.status === 'COMPLETED')
      .map((p) => {
        const tier = this.tables.sponsorship_tiers.find((t) => t.id === p.sponsorship_tier_id);
        return {
          id: p.id,
          application_number: p.application_number,
          company_name: p.company_name,
          brand_name: p.brand_name || p.company_name,
          logo_key: p.logo_key,
          website: p.website,
          sponsorship_tier_id: p.sponsorship_tier_id,
          tier_name: tier?.name || p.package_name || 'Partner',
          display_order: tier?.display_order ?? 99,
        };
      });
    approved.sort((a, b) => a.display_order - b.display_order);
    return approved;
  }

  async listPartnerDeliverables(partnerId) {
    return this.tables.partner_deliverables
      .filter((d) => d.partner_id === Number(partnerId))
      .map(this.clone);
  }

  async updatePartnerDeliverable(deliverableId, { status, notes }) {
    const item = this.tables.partner_deliverables.find((d) => d.id === Number(deliverableId));
    if (!item) return null;
    item.status = status;
    if (notes !== undefined) item.notes = notes;
    if (String(status).toUpperCase() === 'COMPLETED') {
      item.completed_at = this.now();
    }
    return this.clone(item);
  }

  // --- Vendor Applications ---

  async createVendorApplication(payload) {
    const appNumber = payload.application_number || this.generateVendorApplicationNumber();
    const vendor = {
      id: this.nextId("vendor_applications"),
      application_number: appNumber,
      business_name: payload.business_name,
      representative_name: payload.representative_name || payload.contact_name,
      contact_name: payload.contact_name || payload.representative_name,
      email: payload.email,
      phone: payload.phone,
      category: payload.category,
      gst_number: payload.gst_number || null,
      pan_number: payload.pan_number || null,
      address: payload.address || null,
      city: payload.city || null,
      state: payload.state || null,
      pincode: payload.pincode || null,
      products_services: payload.products_services || payload.description,
      description: payload.description,
      space_requirement: payload.space_requirement || null,
      electricity_required: Boolean(payload.electricity_required),
      water_required: Boolean(payload.water_required),
      furniture_required: Boolean(payload.furniture_required),
      branding_support_required: Boolean(payload.branding_support_required),
      vehicle_access_required: Boolean(payload.vehicle_access_required),
      staff_count: Number(payload.staff_count) || 1,
      document_key: payload.document_key || null,
      document_content_type: payload.document_content_type || null,
      document_size_bytes: payload.document_size_bytes || null,
      documents: payload.documents || [],
      status: payload.status || 'SUBMITTED',
      payment_status: payload.payment_status || 'PENDING',
      stall_fee_paise: payload.stall_fee_paise || 0,
      payment_order_id: payload.payment_order_id || payload.order_id || null,
      payment_id: null,
      payment_signature: null,
      payment_verified_at: null,
      reviewed_by: null,
      reviewed_at: null,
      approved_at: null,
      review_notes: null,
      created_at: this.now(),
      updated_at: this.now(),
    };
    this.tables.vendor_applications.push(vendor);
    return this.clone(vendor);
  }

  async listVendorApplications(options = {}) {
    let status = null;
    let search = null;
    if (typeof options === 'string') {
      status = options;
    } else if (options && typeof options === 'object') {
      status = options.status || null;
      search = options.search || null;
    }

    let list = this.tables.vendor_applications.slice();
    if (status && status !== 'all') {
      list = list.filter((v) => v.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((v) =>
        (v.business_name && v.business_name.toLowerCase().includes(q)) ||
        (v.representative_name && v.representative_name.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q)) ||
        (v.application_number && v.application_number.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list.map(this.clone);
  }

  async getVendorApplicationById(id) {
    const vendor = this.tables.vendor_applications.find((v) => v.id === Number(id));
    return vendor ? this.clone(vendor) : null;
  }

  async getVendorApplicationByNumber(appNum) {
    const vendor = this.tables.vendor_applications.find((v) => v.application_number === appNum);
    return vendor ? this.clone(vendor) : null;
  }

  async updateVendorApplicationStatus(id, { status, reviewer, notes }) {
    const vendor = this.tables.vendor_applications.find((v) => v.id === Number(id));
    if (!vendor) return null;
    vendor.status = status;
    vendor.reviewed_by = reviewer || 'admin';
    vendor.review_notes = notes || null;
    vendor.reviewed_at = this.now();
    if (String(status).toUpperCase() === 'APPROVED') {
      vendor.approved_at = this.now();
    }
    vendor.updated_at = this.now();
    return this.clone(vendor);
  }

  async verifyVendorPayment(id, { paymentId, signature }) {
    const vendor = this.tables.vendor_applications.find((v) => v.id === Number(id));
    if (!vendor) return null;
    vendor.payment_status = 'PAYMENT_VERIFIED';
    vendor.payment_id = paymentId;
    vendor.payment_signature = signature;
    vendor.payment_verified_at = this.now();
    vendor.updated_at = this.now();
    return this.clone(vendor);
  }

  async getPartnerVendorAnalytics() {
    const partnerStatus = {};
    for (const p of this.tables.partner_applications) {
      partnerStatus[p.status] = (partnerStatus[p.status] || 0) + 1;
    }
    const vendorStatus = {};
    for (const v of this.tables.vendor_applications) {
      vendorStatus[v.status] = (vendorStatus[v.status] || 0) + 1;
    }
    return {
      partners: Object.entries(partnerStatus).map(([status, count]) => ({ status, count })),
      vendors: Object.entries(vendorStatus).map(([status, count]) => ({ status, count })),
    };
  }

  async cleanupExpiredPendingRegistrations(ttlMinutes = 30) {
    const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const expired = this.tables.cyclothon_registrations.filter(
      (item) =>
        item.status === "pending" &&
        item.payment_status === "pending" &&
        new Date(item.created_at) < cutoff
    );
    this.tables.cyclothon_registrations = this.tables.cyclothon_registrations.filter(
      (item) => !expired.includes(item)
    );
    return expired.map((item) => ({ id: item.id, email: item.email }));
  }
}

module.exports = {
  MockRepository,
  SITE_SECTIONS,
  defaultSiteSettings,
  mergeSiteSettings,
};
