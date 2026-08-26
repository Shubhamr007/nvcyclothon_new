const { z } = require("zod");
const { ValidationError } = require("../errors");
const { DELEGATION_STATUSES, REGISTRATION_STATUSES, RACE_CATEGORIES } = require("../constants");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

function normalizeIndianMobile(value) {
  const compact = String(value).replace(/[\s()\-]/g, "");
  if (compact.startsWith("+91")) {
    const local = compact.slice(3);
    if (!INDIAN_MOBILE_PATTERN.test(local)) {
      throw new ValidationError("Enter a valid 10-digit Indian mobile number");
    }
    return `+91${local}`;
  }
  if (compact.startsWith("+")) {
    throw new ValidationError("Use an Indian mobile number with country code +91");
  }
  if (!INDIAN_MOBILE_PATTERN.test(compact)) {
    throw new ValidationError("Enter a valid 10-digit Indian mobile number");
  }
  return `+91${compact}`;
}

function normalizeEmail(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new ValidationError("Enter a valid email address");
  }
  return normalized;
}

function validateHttpsUrl(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  let parsed;
  try {
    parsed = new URL(String(value));
  } catch {
    throw new ValidationError("Image URLs must use HTTPS and may not include credentials");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
    throw new ValidationError("Image URLs must use HTTPS and may not include credentials");
  }
  return parsed.toString();
}

const productCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(160),
  origin: z.string().trim().min(2).max(160),
  price_paise: z.number().int().positive(),
  description: z.string().max(5_000).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  inventory: z.number().int().min(0).default(0),
});

const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  origin: z.string().trim().min(2).max(160).optional(),
  price_paise: z.number().int().positive().optional(),
  description: z.string().max(5_000).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  inventory: z.number().int().min(0).optional(),
});

const orderCreateSchema = z.object({
  customer_name: z.string().trim().min(2).max(160),
  email: z.string().trim().min(5).max(255),
  phone: z.string().trim().min(8).max(32).optional().nullable(),
  shipping_address: z.string().trim().min(10).max(1_000),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(20),
});

const registrationCreateSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z.string().trim().min(5).max(255),
  phone: z.string().trim().min(8).max(32),
  age: z.number().int().min(10).max(100),
  city: z.string().trim().min(2).max(100),
  gender: z.enum(["Female", "Male", "Non-binary", "Prefer not to say"]),
  ride_category: z.enum(Object.keys(RACE_CATEGORIES)),
  emergency_contact: z.string().trim().min(5).max(160),
  t_shirt_size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "N/A"]),
  waiver_accepted: z.boolean(),
  privacy_accepted: z.boolean(),
});

const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().trim().min(5).max(100),
  razorpay_payment_id: z.string().trim().min(5).max(100),
  razorpay_signature: z.string().trim().min(32).max(128),
});

const statusUpdateSchema = z.object({
  status: z.enum(REGISTRATION_STATUSES),
});

const bulkStatusUpdateSchema = z.object({
  registration_ids: z.array(z.number().int().positive()).min(1).max(1000),
  status: z.enum(REGISTRATION_STATUSES),
});

const offerSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().max(2000).nullable().optional(),
  code: z.string().max(64).nullable().optional(),
  active: z.boolean().default(true),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
});

const chiefGuestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  designation: z.string().trim().min(2).max(200),
  bio: z.string().max(3000).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  featured: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
});

const delegationSchema = z.object({
  organization: z.string().trim().min(2).max(160),
  contact_name: z.string().trim().min(2).max(160),
  contact_email: z.string().max(255).nullable().optional(),
  contact_phone: z.string().max(32).nullable().optional(),
  member_count: z.number().int().min(1).max(10_000).default(1),
  status: z.enum(DELEGATION_STATUSES).default("invited"),
  notes: z.string().max(3000).nullable().optional(),
});

const adminLoginSchema = z.object({
  admin_key: z.string().trim().min(1).max(512),
});

const volunteerSessionSchema = z.object({
  volunteer_pin: z.string().trim().min(4).max(64),
  volunteer_name: z.string().trim().min(2).max(80).default("Volunteer"),
});

const checkinScanSchema = z.object({
  scan_value: z.string().trim().min(8).max(2048),
  source_device: z.string().trim().min(2).max(120).nullable().optional(),
});

const checkinManualSchema = z.object({
  registration_id: z.number().int().positive(),
  source_device: z.string().trim().min(2).max(120).nullable().optional(),
});

const eventUpdateEmailSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(3).max(5000),
});

const siteSectionsPatchSchema = z
  .object({
    editions: z.boolean().optional(),
    about: z.boolean().optional(),
    routes: z.boolean().optional(),
    updates: z.boolean().optional(),
    gallery: z.boolean().optional(),
    why_sport: z.boolean().optional(),
    contact: z.boolean().optional(),
    sponsors: z.boolean().optional(),
    community: z.boolean().optional(),
  })
  .partial();

const siteSettingsPatchSchema = z
  .object({
    event_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    event_start_time: z.string().trim().min(3).max(20).optional(),
    event_location: z.string().trim().min(2).max(160).optional(),
    edition_label: z.string().trim().min(2).max(60).optional(),
    registration_open: z.boolean().optional(),
    sections: siteSectionsPatchSchema.optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

const communityPostSchema = z.object({
  name: z.string().trim().min(2).max(80),
  message: z.string().trim().min(4).max(500),
  consent_accepted: z.union([z.boolean(), z.string(), z.number()]).transform((v) => {
    if (typeof v === "boolean") return v;
    const str = String(v).trim().toLowerCase();
    return str === "true" || str === "1" || str === "on" || str === "yes";
  }),
});

const communityModerationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

function normalizeProductInput(payload) {
  return {
    ...payload,
    image_url: validateHttpsUrl(payload.image_url),
    description: payload.description ?? null,
  };
}

function normalizeProductUpdateInput(payload) {
  const data = { ...payload };
  if (Object.prototype.hasOwnProperty.call(data, "image_url")) {
    data.image_url = validateHttpsUrl(data.image_url);
  }
  if (!Object.prototype.hasOwnProperty.call(data, "description")) {
    delete data.description;
  }
  return data;
}

function normalizeOrderInput(payload) {
  const normalized = {
    ...payload,
    email: normalizeEmail(payload.email),
    phone: payload.phone ? normalizeIndianMobile(payload.phone) : null,
  };
  const productIds = normalized.items.map((line) => line.product_id);
  if (new Set(productIds).size !== productIds.length) {
    throw new ValidationError("Each product may appear only once in an order");
  }
  return normalized;
}

function normalizeRegistrationInput(payload) {
  return {
    ...payload,
    email: normalizeEmail(payload.email),
    phone: normalizeIndianMobile(payload.phone),
    emergency_contact: normalizeIndianMobile(payload.emergency_contact),
  };
}

function normalizeOfferInput(payload) {
  return {
    ...payload,
    description: payload.description ?? null,
    code: payload.code ?? null,
    starts_at: payload.starts_at ?? null,
    ends_at: payload.ends_at ?? null,
  };
}

function normalizeChiefGuestInput(payload) {
  return {
    ...payload,
    bio: payload.bio ?? null,
    image_url: validateHttpsUrl(payload.image_url),
  };
}

function normalizeDelegationInput(payload) {
  return {
    ...payload,
    contact_email: payload.contact_email ? normalizeEmail(payload.contact_email) : null,
    contact_phone: payload.contact_phone ? normalizeIndianMobile(payload.contact_phone) : null,
    notes: payload.notes ?? null,
  };
}

function parseSchema(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ValidationError(issue?.message || "Invalid request payload");
  }
  return parsed.data;
}

module.exports = {
  normalizeIndianMobile,
  normalizeEmail,
  parseSchema,
  productCreateSchema,
  productUpdateSchema,
  orderCreateSchema,
  registrationCreateSchema,
  paymentVerifySchema,
  statusUpdateSchema,
  bulkStatusUpdateSchema,
  offerSchema,
  chiefGuestSchema,
  delegationSchema,
  adminLoginSchema,
  volunteerSessionSchema,
  checkinScanSchema,
  checkinManualSchema,
  eventUpdateEmailSchema,
  siteSettingsPatchSchema,
  communityPostSchema,
  communityModerationSchema,
  normalizeProductInput,
  normalizeProductUpdateInput,
  normalizeOrderInput,
  normalizeRegistrationInput,
  normalizeOfferInput,
  normalizeChiefGuestInput,
  normalizeDelegationInput,
};
