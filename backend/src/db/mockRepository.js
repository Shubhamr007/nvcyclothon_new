const crypto = require("crypto");
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
    event_date: "2026-10-18",
    event_start_time: "5:30 AM",
    event_location: "Rewa, Madhya Pradesh",
    edition_label: "3rd Edition",
    registration_open: true,
    hero_images: [],
    feature_section: {
      enabled: false,
      eyebrow: "",
      title: "",
      body: "",
      image_url: "",
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
      delegations: [],
      community_posts: [],
      volunteer_accounts: [],
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
      delegations: 1,
      community_posts: 1,
      volunteer_accounts: 1,
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

  calculateRegistrationFee(rideCategory) {
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
    if (now >= LAST_WEEK_START) {
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
    const duplicate = this.tables.cyclothon_registrations.find(
      (item) => item.email.toLowerCase() === payload.email.toLowerCase()
    );
    if (duplicate) {
      throw new ConflictError("This email is already registered for NV Cyclothon");
    }

    const registrationFee = this.calculateRegistrationFee(payload.ride_category);
    const isPaidRegistration = options.razorpayEnabled;
    const registration = {
      id: this.nextId("cyclothon_registrations"),
      full_name: payload.full_name,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      age: payload.age,
      city: payload.city,
      gender: payload.gender,
      ride_category: payload.ride_category,
      emergency_contact: payload.emergency_contact,
      t_shirt_size: payload.t_shirt_size,
      waiver_accepted: true,
      privacy_accepted: true,
      status: isPaidRegistration ? "pending" : "approved",
      registration_fee_paise: registrationFee,
      payment_status: isPaidRegistration ? "pending" : "paid",
      razorpay_order_id: null,
      razorpay_payment_id: null,
      razorpay_signature: null,
      payment_verified_at: isPaidRegistration ? null : this.now(),
      checkin_token: this.generateCheckinToken(),
      checked_in_at: null,
      checked_in_by: null,
      checkin_method: null,
      checkin_device: null,
      created_at: this.now(),
    };

    let checkout = null;
    if (options.razorpayEnabled) {
      const order = await options.createPaymentOrder({
        amountPaise: registration.registration_fee_paise,
        receipt: `cyclothon-${registration.id}`,
      });
      registration.razorpay_order_id = order.id;
      checkout = {
        key_id: options.razorpayKeyId,
        order_id: order.id,
        amount_paise: registration.registration_fee_paise,
        currency: "INR",
      };
    }

    this.tables.cyclothon_registrations.push(registration);
    return {
      registration: this.clone(registration),
      checkout,
    };
  }

  async verifyCyclothonPayment(registrationId, payload, expectedSignature) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.id === registrationId
    );
    if (!registration || !registration.razorpay_order_id) {
      throw new NotFoundError("Payment registration not found");
    }

    if (registration.payment_status === "paid") {
      if (registration.razorpay_payment_id === payload.razorpay_payment_id) {
        return this.clone(registration);
      }
      throw new ConflictError("This registration has already been paid");
    }

    if (payload.razorpay_order_id !== registration.razorpay_order_id) {
      throw new ValidationError("Payment order does not match this registration");
    }

    if (payload.razorpay_signature !== expectedSignature) {
      throw new ValidationError("Payment signature verification failed");
    }

    const duplicatePayment = this.tables.cyclothon_registrations.find(
      (item) =>
        item.id !== registration.id &&
        item.razorpay_payment_id &&
        item.razorpay_payment_id === payload.razorpay_payment_id
    );
    if (duplicatePayment) {
      throw new ConflictError("This payment has already been recorded");
    }

    registration.payment_status = "paid";
    if (registration.status === "pending") {
      registration.status = "approved";
    }
    registration.razorpay_payment_id = payload.razorpay_payment_id;
    registration.razorpay_signature = payload.razorpay_signature;
    registration.payment_verified_at = this.now();

    return this.clone(registration);
  }

  async markCyclothonPaymentFromWebhook({ orderId, paymentId }) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.razorpay_order_id === orderId
    );
    if (!registration) {
      throw new NotFoundError("Payment registration not found");
    }
    if (registration.payment_status === "paid") {
      return this.clone(registration);
    }
    registration.payment_status = "paid";
    registration.status = registration.status === "pending" ? "approved" : registration.status;
    registration.razorpay_payment_id = paymentId;
    registration.payment_verified_at = this.now();
    return this.clone(registration);
  }

  async listRegistrations() {
    return this.tables.cyclothon_registrations
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((item) => this.clone(item));
  }

  async getRegistrationById(registrationId) {
    const registration = this.tables.cyclothon_registrations.find(
      (item) => item.id === registrationId
    );
    return registration ? this.clone(registration) : null;
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
    return this.clone(this.siteSettings);
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
}

module.exports = {
  MockRepository,
  SITE_SECTIONS,
  defaultSiteSettings,
  mergeSiteSettings,
};
