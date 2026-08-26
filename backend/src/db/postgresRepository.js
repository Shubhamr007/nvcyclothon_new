const crypto = require("crypto");
const { Pool } = require("pg");
const {
  EARLY_BIRD_LIMIT,
  LAST_WEEK_START,
  RACE_CATEGORIES,
} = require("../constants");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
  ApiError,
} = require("../errors");
const { defaultSiteSettings, mergeSiteSettings } = require("./mockRepository");

class PostgresRepository {
  constructor(config) {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
    });
  }

  async init() {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(120) UNIQUE NOT NULL,
        name VARCHAR(160) NOT NULL,
        origin VARCHAR(160) NOT NULL,
        price_paise INTEGER NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        inventory INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wholesale_uploads (
        id SERIAL PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        storage_key VARCHAR(300) UNIQUE NOT NULL,
        content_type VARCHAR(120),
        size_bytes INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(160) NOT NULL,
        phone VARCHAR(32),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
        total_paise INTEGER NOT NULL,
        shipping_address TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price_paise INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cyclothon_registrations (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(160) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        age INTEGER NOT NULL,
        city VARCHAR(100) NOT NULL,
        gender VARCHAR(32) NOT NULL DEFAULT 'Prefer not to say',
        ride_category VARCHAR(64) NOT NULL,
        emergency_contact VARCHAR(160) NOT NULL,
        t_shirt_size VARCHAR(10) NOT NULL,
        waiver_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        registration_fee_paise INTEGER NOT NULL DEFAULT 0,
        payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        razorpay_signature VARCHAR(128),
        payment_verified_at TIMESTAMPTZ,
        checkin_token VARCHAR(128),
        checked_in_at TIMESTAMPTZ,
        checked_in_by VARCHAR(160),
        checkin_method VARCHAR(32),
        checkin_device VARCHAR(200),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_cyclothon_razorpay_order UNIQUE (razorpay_order_id),
        CONSTRAINT uq_cyclothon_razorpay_payment UNIQUE (razorpay_payment_id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_registrations_email_normalized
      ON cyclothon_registrations (lower(email));

      CREATE INDEX IF NOT EXISTS ix_products_slug ON products (slug);
      CREATE INDEX IF NOT EXISTS ix_customers_email ON customers (email);

      CREATE TABLE IF NOT EXISTS event_offers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(160) NOT NULL,
        description TEXT,
        code VARCHAR(64),
        active BOOLEAN NOT NULL DEFAULT TRUE,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chief_guests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        designation VARCHAR(200) NOT NULL,
        bio TEXT,
        image_url VARCHAR(500),
        featured BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS delegations (
        id SERIAL PRIMARY KEY,
        organization VARCHAR(160) NOT NULL,
        contact_name VARCHAR(160) NOT NULL,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(32),
        member_count INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(32) NOT NULL DEFAULT 'invited',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS volunteer_checkin_logs (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL REFERENCES cyclothon_registrations(id) ON DELETE CASCADE,
        volunteer_name VARCHAR(160) NOT NULL,
        method VARCHAR(32) NOT NULL,
        source_device VARCHAR(200),
        outcome VARCHAR(32) NOT NULL,
        notes TEXT,
        scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT site_settings_singleton CHECK (id = 1)
      );

      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        message TEXT NOT NULL,
        image_key VARCHAR(200),
        image_content_type VARCHAR(80),
        image_size_bytes INTEGER,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        submitted_ip VARCHAR(64),
        submitted_user_agent VARCHAR(240),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        moderated_at TIMESTAMPTZ,
        moderated_by VARCHAR(120),
        moderation_reason TEXT
      );
      CREATE INDEX IF NOT EXISTS community_posts_status_created_idx
        ON community_posts (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS community_posts_ip_created_idx
        ON community_posts (submitted_ip, created_at DESC);
    `;

    await this.pool.query(schemaSql);

    // Keep compatibility with already-running databases that may predate
    // newer columns and indexes from previous Python deployments.
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS registration_fee_paise INTEGER NOT NULL DEFAULT 0"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(32) NOT NULL DEFAULT 'Prefer not to say'"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'pending'"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(128)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS checkin_token VARCHAR(128)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS checked_in_by VARCHAR(160)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS checkin_method VARCHAR(32)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS checkin_device VARCHAR(200)"
    );
    await this.pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_razorpay_order_partial ON cyclothon_registrations (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL"
    );
    await this.pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_razorpay_payment_partial ON cyclothon_registrations (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL"
    );
    await this.pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_checkin_token_partial ON cyclothon_registrations (checkin_token) WHERE checkin_token IS NOT NULL"
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS volunteer_checkin_logs (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL REFERENCES cyclothon_registrations(id) ON DELETE CASCADE,
        volunteer_name VARCHAR(160) NOT NULL,
        method VARCHAR(32) NOT NULL,
        source_device VARCHAR(200),
        outcome VARCHAR(32) NOT NULL,
        notes TEXT,
        scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );

    await this.backfillMissingCheckinTokens();
  }

  async backfillMissingCheckinTokens() {
    const result = await this.pool.query(
      "SELECT id FROM cyclothon_registrations WHERE checkin_token IS NULL"
    );

    for (const row of result.rows) {
      let assigned = false;
      for (let attempt = 0; attempt < 5 && !assigned; attempt += 1) {
        const token = this.generateCheckinToken();
        try {
          await this.pool.query(
            `UPDATE cyclothon_registrations
             SET checkin_token = $1
             WHERE id = $2 AND checkin_token IS NULL`,
            [token, row.id]
          );
          assigned = true;
        } catch (error) {
          if (error.code !== "23505") {
            throw error;
          }
        }
      }

      if (!assigned) {
        throw new ApiError(500, "Unable to backfill check-in token for registration");
      }
    }
  }

  async close() {
    await this.pool.end();
  }

  async withTransaction(work) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async seedProducts(catalogue) {
    for (const product of catalogue) {
      await this.pool.query(
        `INSERT INTO products (slug, name, origin, price_paise, description, image_url, inventory)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO NOTHING`,
        [
          product.slug,
          product.name,
          product.origin,
          product.price_paise,
          product.description ?? null,
          product.image_url ?? null,
          product.inventory ?? 0,
        ]
      );
    }
  }

  async listProducts() {
    const result = await this.pool.query(
      `SELECT id, slug, name, origin, price_paise, description, image_url, inventory, created_at
       FROM products
       ORDER BY id ASC`
    );
    return result.rows;
  }

  async getProductBySlug(slug) {
    const result = await this.pool.query(
      `SELECT id, slug, name, origin, price_paise, description, image_url, inventory, created_at
       FROM products
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );
    return result.rows[0] || null;
  }

  async createProduct(payload) {
    try {
      const result = await this.pool.query(
        `INSERT INTO products (slug, name, origin, price_paise, description, image_url, inventory)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, slug, name, origin, price_paise, description, image_url, inventory, created_at`,
        [
          payload.slug,
          payload.name,
          payload.origin,
          payload.price_paise,
          payload.description ?? null,
          payload.image_url ?? null,
          payload.inventory,
        ]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        throw new ConflictError("A product with this slug already exists");
      }
      throw error;
    }
  }

  async updateProductBySlug(slug, payload) {
    const fields = [];
    const values = [];
    let index = 1;
    for (const [key, value] of Object.entries(payload)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index += 1;
    }
    if (!fields.length) {
      return this.getProductBySlug(slug);
    }
    values.push(slug);

    const result = await this.pool.query(
      `UPDATE products
       SET ${fields.join(", ")}
       WHERE slug = $${index}
       RETURNING id, slug, name, origin, price_paise, description, image_url, inventory, created_at`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteProductBySlug(slug) {
    const result = await this.pool.query("DELETE FROM products WHERE slug = $1", [slug]);
    return result.rowCount > 0;
  }

  async createOrder(payload) {
    return this.withTransaction(async (client) => {
      const productIds = payload.items.map((line) => line.product_id);
      const productRows = await client.query(
        `SELECT id, name, price_paise, inventory
         FROM products
         WHERE id = ANY($1::int[])
         FOR UPDATE`,
        [productIds]
      );
      const products = new Map(productRows.rows.map((row) => [row.id, row]));
      if (products.size !== productIds.length) {
        throw new NotFoundError("One or more products no longer exist");
      }

      for (const line of payload.items) {
        const product = products.get(line.product_id);
        if (product.inventory < line.quantity) {
          throw new ConflictError(`Insufficient stock for ${product.name}`);
        }
      }

      const existingCustomer = await client.query(
        "SELECT id FROM customers WHERE email = $1 LIMIT 1",
        [payload.email.toLowerCase()]
      );

      let customerId;
      if (existingCustomer.rowCount === 0) {
        const insertedCustomer = await client.query(
          `INSERT INTO customers (email, name, phone)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [payload.email.toLowerCase(), payload.customer_name, payload.phone]
        );
        customerId = insertedCustomer.rows[0].id;
      } else {
        customerId = existingCustomer.rows[0].id;
        await client.query(
          `UPDATE customers
           SET name = $1, phone = $2
           WHERE id = $3`,
          [payload.customer_name, payload.phone, customerId]
        );
      }

      const totalPaise = payload.items.reduce((sum, line) => {
        const product = products.get(line.product_id);
        return sum + product.price_paise * line.quantity;
      }, 0);

      const orderResult = await client.query(
        `INSERT INTO orders (customer_id, status, payment_status, total_paise, shipping_address)
         VALUES ($1, 'pending', 'pending', $2, $3)
         RETURNING id, status, payment_status, total_paise, shipping_address, created_at`,
        [customerId, totalPaise, payload.shipping_address]
      );

      const order = orderResult.rows[0];
      const items = [];
      for (const line of payload.items) {
        const product = products.get(line.product_id);
        await client.query(
          `UPDATE products
           SET inventory = inventory - $1
           WHERE id = $2`,
          [line.quantity, line.product_id]
        );

        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price_paise)
           VALUES ($1, $2, $3, $4)
           RETURNING product_id, quantity, unit_price_paise`,
          [order.id, line.product_id, line.quantity, product.price_paise]
        );
        items.push(itemResult.rows[0]);
      }

      return {
        ...order,
        items,
      };
    });
  }

  async listOrders() {
    const result = await this.pool.query(
      `SELECT o.id,
              o.status,
              o.payment_status,
              o.total_paise,
              o.shipping_address,
              o.created_at,
              oi.product_id,
              oi.quantity,
              oi.unit_price_paise,
              oi.id AS order_item_id
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ORDER BY o.id DESC, oi.id ASC`
    );

    const grouped = new Map();
    for (const row of result.rows) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: row.id,
          status: row.status,
          payment_status: row.payment_status,
          total_paise: row.total_paise,
          shipping_address: row.shipping_address,
          created_at: row.created_at,
          items: [],
        });
      }
      if (row.product_id) {
        grouped.get(row.id).items.push({
          product_id: row.product_id,
          quantity: row.quantity,
          unit_price_paise: row.unit_price_paise,
        });
      }
    }

    return Array.from(grouped.values());
  }

  calculateFeeChoice(now, rideCategory, activeCategoryCount, activeRegistrationCount) {
    const category = RACE_CATEGORIES[rideCategory];
    if (activeCategoryCount >= category.capacity) {
      throw new ConflictError(`${rideCategory} is full`);
    }
    if (rideCategory === "Kid-o-thon") {
      return category.regular;
    }
    if (now >= LAST_WEEK_START) {
      return category.last_week;
    }
    return activeRegistrationCount < EARLY_BIRD_LIMIT
      ? category.early_bird
      : category.regular;
  }

  generateCheckinToken() {
    return crypto.randomBytes(18).toString("base64url");
  }

  async createCyclothonRegistration(payload, options) {
    return this.withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(20261018)");

      const duplicate = await client.query(
        `SELECT id
         FROM cyclothon_registrations
         WHERE lower(email) = lower($1)
         LIMIT 1`,
        [payload.email]
      );
      if (duplicate.rowCount > 0) {
        throw new ConflictError("This email is already registered for NV Cyclothon");
      }

      const categoryCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM cyclothon_registrations
         WHERE ride_category = $1
           AND status <> 'cancelled'`,
        [payload.ride_category]
      );
      const categoryCount = categoryCountResult.rows[0].count;

      const activeCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM cyclothon_registrations
         WHERE status <> 'cancelled'`
      );
      const activeCount = activeCountResult.rows[0].count;

      const fee = this.calculateFeeChoice(
        new Date(),
        payload.ride_category,
        categoryCount,
        activeCount
      );
      const checkinToken = this.generateCheckinToken();
      const initialStatus = options.razorpayEnabled ? "pending" : "approved";
      const initialPaymentStatus = options.razorpayEnabled ? "pending" : "paid";
      const paymentVerifiedAt = options.razorpayEnabled ? null : new Date();

      let registration;
      try {
        const insertResult = await client.query(
          `INSERT INTO cyclothon_registrations (
             full_name, email, phone, age, city, gender, ride_category,
             emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
             status, registration_fee_paise, payment_status, payment_verified_at,
             checkin_token
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7,
             $8, $9, TRUE, TRUE,
             $10, $11, $12, $13, $14
           )
           RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                     emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                     status, registration_fee_paise, payment_status, razorpay_order_id,
                     razorpay_payment_id, razorpay_signature, payment_verified_at,
                     checkin_token, checked_in_at, checked_in_by, checkin_method,
                     checkin_device, created_at`,
          [
            payload.full_name,
            payload.email.toLowerCase(),
            payload.phone,
            payload.age,
            payload.city,
            payload.gender,
            payload.ride_category,
            payload.emergency_contact,
            payload.t_shirt_size,
            initialStatus,
            fee,
            initialPaymentStatus,
            paymentVerifiedAt,
            checkinToken,
          ]
        );
        registration = insertResult.rows[0];
      } catch (error) {
        if (error.code === "23505") {
          if (String(error.constraint || "").includes("email")) {
            throw new ConflictError("This email is already registered for NV Cyclothon");
          }
          if (String(error.constraint || "").includes("checkin_token")) {
            throw new ConflictError("Unable to issue a check-in token. Please retry.");
          }
        }
        throw error;
      }

      let checkout = null;
      if (options.razorpayEnabled) {
        const order = await options.createPaymentOrder({
          amountPaise: registration.registration_fee_paise,
          receipt: `cyclothon-${registration.id}`,
        });
        const updateResult = await client.query(
          `UPDATE cyclothon_registrations
           SET razorpay_order_id = $1
           WHERE id = $2
           RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                     emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                     status, registration_fee_paise, payment_status, razorpay_order_id,
                     razorpay_payment_id, razorpay_signature, payment_verified_at,
                     checkin_token, checked_in_at, checked_in_by, checkin_method,
                     checkin_device, created_at`,
          [order.id, registration.id]
        );
        registration = updateResult.rows[0];
        checkout = {
          key_id: options.razorpayKeyId,
          order_id: order.id,
          amount_paise: registration.registration_fee_paise,
          currency: "INR",
        };
      }

      return {
        registration,
        checkout,
      };
    });
  }

  async verifyCyclothonPayment(registrationId, payload, expectedSignature) {
    return this.withTransaction(async (client) => {
      const registrationResult = await client.query(
        `SELECT id, full_name, email, phone, age, city, gender, ride_category,
                emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                status, registration_fee_paise, payment_status, razorpay_order_id,
                razorpay_payment_id, razorpay_signature, payment_verified_at,
                checkin_token, checked_in_at, checked_in_by, checkin_method,
                checkin_device, created_at
         FROM cyclothon_registrations
         WHERE id = $1
         FOR UPDATE`,
        [registrationId]
      );
      if (registrationResult.rowCount === 0) {
        throw new NotFoundError("Payment registration not found");
      }
      const registration = registrationResult.rows[0];
      if (!registration.razorpay_order_id) {
        throw new NotFoundError("Payment registration not found");
      }

      if (registration.payment_status === "paid") {
        if (registration.razorpay_payment_id === payload.razorpay_payment_id) {
          return registration;
        }
        throw new ConflictError("This registration has already been paid");
      }

      if (payload.razorpay_order_id !== registration.razorpay_order_id) {
        throw new ValidationError("Payment order does not match this registration");
      }

      if (payload.razorpay_signature !== expectedSignature) {
        throw new ValidationError("Payment signature verification failed");
      }

      try {
        const updated = await client.query(
          `UPDATE cyclothon_registrations
           SET payment_status = 'paid',
               status = CASE WHEN status = 'pending' THEN 'approved' ELSE status END,
               razorpay_payment_id = $1,
               razorpay_signature = $2,
               payment_verified_at = NOW()
           WHERE id = $3
           RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                     emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                     status, registration_fee_paise, payment_status, razorpay_order_id,
                     razorpay_payment_id, razorpay_signature, payment_verified_at,
                     checkin_token, checked_in_at, checked_in_by, checkin_method,
                     checkin_device, created_at`,
          [payload.razorpay_payment_id, payload.razorpay_signature, registrationId]
        );
        return updated.rows[0];
      } catch (error) {
        if (error.code === "23505") {
          throw new ConflictError("This payment has already been recorded");
        }
        throw error;
      }
    });
  }

  async listRegistrations() {
    const result = await this.pool.query(
      `SELECT id, full_name, email, phone, age, city, gender, ride_category,
              emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
              status, registration_fee_paise, payment_status, razorpay_order_id,
              razorpay_payment_id, razorpay_signature, payment_verified_at,
              checkin_token, checked_in_at, checked_in_by, checkin_method,
              checkin_device, created_at
       FROM cyclothon_registrations
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getRegistrationById(registrationId) {
    const result = await this.pool.query(
      `SELECT id, full_name, email, phone, age, city, gender, ride_category,
              emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
              status, registration_fee_paise, payment_status, razorpay_order_id,
              razorpay_payment_id, razorpay_signature, payment_verified_at,
              checkin_token, checked_in_at, checked_in_by, checkin_method,
              checkin_device, created_at
       FROM cyclothon_registrations
       WHERE id = $1
       LIMIT 1`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  async updateRegistrationStatus(registrationId, status) {
    const result = await this.pool.query(
      `UPDATE cyclothon_registrations
       SET status = $1
       WHERE id = $2
       RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                 emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                 status, registration_fee_paise, payment_status, razorpay_order_id,
                 razorpay_payment_id, razorpay_signature, payment_verified_at,
                 checkin_token, checked_in_at, checked_in_by, checkin_method,
                 checkin_device, created_at`,
      [status, registrationId]
    );
    return result.rows[0] || null;
  }

  async bulkUpdateRegistrationStatus(registrationIds, status) {
    const ids = [...new Set(registrationIds)].sort((a, b) => a - b);
    const foundRows = await this.pool.query(
      `SELECT id
       FROM cyclothon_registrations
       WHERE id = ANY($1::int[])`,
      [ids]
    );
    const foundIds = new Set(foundRows.rows.map((item) => item.id));

    const updateResult = await this.pool.query(
      `UPDATE cyclothon_registrations
       SET status = $1
       WHERE id = ANY($2::int[])`,
      [status, ids]
    );

    return {
      updated: updateResult.rowCount,
      missing_ids: ids.filter((id) => !foundIds.has(id)),
    };
  }

  async searchRegistrationsForCheckin(query, limit = 25) {
    const trimmed = String(query || "").trim();
    if (!trimmed) {
      return [];
    }

    const idCandidate = Number.parseInt(trimmed, 10);
    const idFilter = Number.isInteger(idCandidate) ? idCandidate : null;
    const fuzzy = `%${trimmed.toLowerCase()}%`;
    const digitOnly = trimmed.replace(/\D+/g, "");
    const phoneFilter = digitOnly ? `%${digitOnly}%` : null;

    const result = await this.pool.query(
      `SELECT id, full_name, email, phone, city, ride_category, status,
              payment_status, checked_in_at, checked_in_by, checkin_method,
              payment_verified_at, created_at
       FROM cyclothon_registrations
       WHERE lower(full_name) LIKE $1
          OR lower(email) LIKE $1
          OR lower(city) LIKE $1
          OR ($2::int IS NOT NULL AND id = $2)
          OR ($3::text IS NOT NULL AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE $3)
       ORDER BY
         CASE WHEN ($2::int IS NOT NULL AND id = $2) THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT $4`,
      [fuzzy, idFilter, phoneFilter, limit]
    );
    return result.rows;
  }

  async addCheckinLog(client, payload) {
    await client.query(
      `INSERT INTO volunteer_checkin_logs (
         registration_id,
         volunteer_name,
         method,
         source_device,
         outcome,
         notes
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        payload.registrationId,
        payload.volunteerName,
        payload.method,
        payload.sourceDevice,
        payload.outcome,
        payload.notes,
      ]
    );
  }

  async markCheckedIn(client, registration, metadata) {
    const volunteerName = metadata.volunteerName;
    const method = metadata.method;
    const sourceDevice = metadata.sourceDevice;

    if (registration.payment_status !== "paid") {
      await this.addCheckinLog(client, {
        registrationId: registration.id,
        volunteerName,
        method,
        sourceDevice,
        outcome: "payment_pending",
        notes: "Payment verification is pending",
      });
      throw new ConflictError("Payment is not verified for this participant");
    }

    if (registration.status === "cancelled") {
      await this.addCheckinLog(client, {
        registrationId: registration.id,
        volunteerName,
        method,
        sourceDevice,
        outcome: "cancelled",
        notes: "Registration is cancelled",
      });
      throw new ConflictError("Cancelled registrations cannot be checked in");
    }

    if (registration.status === "checked_in") {
      await this.addCheckinLog(client, {
        registrationId: registration.id,
        volunteerName,
        method,
        sourceDevice,
        outcome: "duplicate",
        notes: "Participant already checked in",
      });
      return {
        already_checked_in: true,
        registration,
      };
    }

    const updatedResult = await client.query(
      `UPDATE cyclothon_registrations
       SET status = 'checked_in',
           checked_in_at = COALESCE(checked_in_at, NOW()),
           checked_in_by = $1,
           checkin_method = $2,
           checkin_device = $3
       WHERE id = $4
       RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                 emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                 status, registration_fee_paise, payment_status, razorpay_order_id,
                 razorpay_payment_id, razorpay_signature, payment_verified_at,
                 checkin_token, checked_in_at, checked_in_by, checkin_method,
                 checkin_device, created_at`,
      [volunteerName, method, sourceDevice, registration.id]
    );

    const updated = updatedResult.rows[0];
    await this.addCheckinLog(client, {
      registrationId: updated.id,
      volunteerName,
      method,
      sourceDevice,
      outcome: "checked_in",
      notes: null,
    });

    return {
      already_checked_in: false,
      registration: updated,
    };
  }

  async checkInByToken(checkinToken, metadata) {
    return this.withTransaction(async (client) => {
      const registrationResult = await client.query(
        `SELECT id, full_name, email, phone, age, city, gender, ride_category,
                emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                status, registration_fee_paise, payment_status, razorpay_order_id,
                razorpay_payment_id, razorpay_signature, payment_verified_at,
                checkin_token, checked_in_at, checked_in_by, checkin_method,
                checkin_device, created_at
         FROM cyclothon_registrations
         WHERE checkin_token = $1
         LIMIT 1
         FOR UPDATE`,
        [checkinToken]
      );

      if (registrationResult.rowCount === 0) {
        throw new NotFoundError("Participant not found for this QR code");
      }

      return this.markCheckedIn(client, registrationResult.rows[0], metadata);
    });
  }

  async checkInByRegistrationId(registrationId, metadata) {
    return this.withTransaction(async (client) => {
      const registrationResult = await client.query(
        `SELECT id, full_name, email, phone, age, city, gender, ride_category,
                emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                status, registration_fee_paise, payment_status, razorpay_order_id,
                razorpay_payment_id, razorpay_signature, payment_verified_at,
                checkin_token, checked_in_at, checked_in_by, checkin_method,
                checkin_device, created_at
         FROM cyclothon_registrations
         WHERE id = $1
         LIMIT 1
         FOR UPDATE`,
        [registrationId]
      );

      if (registrationResult.rowCount === 0) {
        throw new NotFoundError("Participant not found");
      }

      return this.markCheckedIn(client, registrationResult.rows[0], metadata);
    });
  }

  async getRegistrationsByIds(ids) {
    const result = await this.pool.query(
      `SELECT id, full_name, email, phone, age, city, gender, ride_category,
              emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
              status, registration_fee_paise, payment_status, razorpay_order_id,
              razorpay_payment_id, razorpay_signature, payment_verified_at,
              checkin_token, checked_in_at, checked_in_by, checkin_method,
              checkin_device, created_at
       FROM cyclothon_registrations
       WHERE id = ANY($1::int[])
       ORDER BY id ASC`,
      [ids]
    );
    return result.rows;
  }

  async listRegistrationContacts() {
    const result = await this.pool.query(
      `SELECT id, email
       FROM cyclothon_registrations`
    );
    return result.rows;
  }

  async listRegistrationEmails() {
    const result = await this.pool.query("SELECT email FROM cyclothon_registrations");
    return result.rows.map((row) => row.email);
  }

  async getAnalytics() {
    const now = new Date();
    const dayStartUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const statusRows = await this.pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM cyclothon_registrations
       GROUP BY status`
    );
    const routeRows = await this.pool.query(
      `SELECT ride_category, COUNT(*)::int AS count
       FROM cyclothon_registrations
       GROUP BY ride_category`
    );
    const cityRows = await this.pool.query(
      `SELECT city, COUNT(*)::int AS count
       FROM cyclothon_registrations
       GROUP BY city
       ORDER BY count DESC
       LIMIT 5`
    );
    const registrationsToday = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM cyclothon_registrations
       WHERE created_at >= $1`,
      [dayStartUtc]
    );
    const delegationCount = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM delegations"
    );
    const delegationMembers = await this.pool.query(
      "SELECT COALESCE(SUM(member_count), 0)::int AS total FROM delegations"
    );
    const activeOffers = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM event_offers WHERE active = TRUE"
    );

    const statuses = {};
    for (const row of statusRows.rows) {
      statuses[row.status] = row.count;
    }

    const routes = {};
    for (const row of routeRows.rows) {
      routes[row.ride_category] = row.count;
    }

    const totalRegistrations = Object.values(statuses).reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      total_registrations: totalRegistrations,
      approved_registrations: statuses.approved || 0,
      checked_in_registrations: statuses.checked_in || 0,
      registrations_today: registrationsToday.rows[0].count,
      registrations_by_route: routes,
      registrations_by_status: statuses,
      registrations_by_city: cityRows.rows.map((row) => ({
        city: row.city,
        count: row.count,
      })),
      delegation_count: delegationCount.rows[0].count,
      delegation_members: delegationMembers.rows[0].total,
      active_offers: activeOffers.rows[0].count,
    };
  }

  async listOffers() {
    const result = await this.pool.query(
      `SELECT id, title, description, code, active, starts_at, ends_at, created_at
       FROM event_offers
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async listPublicOffers() {
    const result = await this.pool.query(
      `SELECT id, title, description, code, active, starts_at, ends_at, created_at
       FROM event_offers
       WHERE active = TRUE
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async createOffer(payload) {
    const result = await this.pool.query(
      `INSERT INTO event_offers (title, description, code, active, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, code, active, starts_at, ends_at, created_at`,
      [
        payload.title,
        payload.description,
        payload.code,
        payload.active,
        payload.starts_at,
        payload.ends_at,
      ]
    );
    return result.rows[0];
  }

  async updateOffer(id, payload) {
    const result = await this.pool.query(
      `UPDATE event_offers
       SET title = $1,
           description = $2,
           code = $3,
           active = $4,
           starts_at = $5,
           ends_at = $6
       WHERE id = $7
       RETURNING id, title, description, code, active, starts_at, ends_at, created_at`,
      [
        payload.title,
        payload.description,
        payload.code,
        payload.active,
        payload.starts_at,
        payload.ends_at,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async deleteOffer(id) {
    const result = await this.pool.query("DELETE FROM event_offers WHERE id = $1", [id]);
    return result.rowCount > 0;
  }

  async listChiefGuests() {
    const result = await this.pool.query(
      `SELECT id, name, designation, bio, image_url, featured, display_order, created_at
       FROM chief_guests
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async listPublicChiefGuests() {
    const result = await this.pool.query(
      `SELECT id, name, designation, bio, image_url, featured, display_order, created_at
       FROM chief_guests
       WHERE featured = TRUE
       ORDER BY display_order ASC, created_at DESC`
    );
    return result.rows;
  }

  async createChiefGuest(payload) {
    const result = await this.pool.query(
      `INSERT INTO chief_guests (name, designation, bio, image_url, featured, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, designation, bio, image_url, featured, display_order, created_at`,
      [
        payload.name,
        payload.designation,
        payload.bio,
        payload.image_url,
        payload.featured,
        payload.display_order,
      ]
    );
    return result.rows[0];
  }

  async updateChiefGuest(id, payload) {
    const result = await this.pool.query(
      `UPDATE chief_guests
       SET name = $1,
           designation = $2,
           bio = $3,
           image_url = $4,
           featured = $5,
           display_order = $6
       WHERE id = $7
       RETURNING id, name, designation, bio, image_url, featured, display_order, created_at`,
      [
        payload.name,
        payload.designation,
        payload.bio,
        payload.image_url,
        payload.featured,
        payload.display_order,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async deleteChiefGuest(id) {
    const result = await this.pool.query("DELETE FROM chief_guests WHERE id = $1", [id]);
    return result.rowCount > 0;
  }

  async listDelegations() {
    const result = await this.pool.query(
      `SELECT id, organization, contact_name, contact_email, contact_phone,
              member_count, status, notes, created_at
       FROM delegations
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async createDelegation(payload) {
    const result = await this.pool.query(
      `INSERT INTO delegations (
         organization, contact_name, contact_email, contact_phone,
         member_count, status, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, organization, contact_name, contact_email, contact_phone,
                 member_count, status, notes, created_at`,
      [
        payload.organization,
        payload.contact_name,
        payload.contact_email,
        payload.contact_phone,
        payload.member_count,
        payload.status,
        payload.notes,
      ]
    );
    return result.rows[0];
  }

  async updateDelegation(id, payload) {
    const result = await this.pool.query(
      `UPDATE delegations
       SET organization = $1,
           contact_name = $2,
           contact_email = $3,
           contact_phone = $4,
           member_count = $5,
           status = $6,
           notes = $7
       WHERE id = $8
       RETURNING id, organization, contact_name, contact_email, contact_phone,
                 member_count, status, notes, created_at`,
      [
        payload.organization,
        payload.contact_name,
        payload.contact_email,
        payload.contact_phone,
        payload.member_count,
        payload.status,
        payload.notes,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async deleteDelegation(id) {
    const result = await this.pool.query("DELETE FROM delegations WHERE id = $1", [id]);
    return result.rowCount > 0;
  }

  async createUploadRecord(payload) {
    const result = await this.pool.query(
      `INSERT INTO wholesale_uploads (original_name, storage_key, content_type, size_bytes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, original_name, storage_key, content_type, size_bytes, created_at`,
      [
        payload.original_name,
        payload.storage_key,
        payload.content_type,
        payload.size_bytes,
      ]
    );
    return result.rows[0];
  }

  async getSiteSettings() {
    const result = await this.pool.query(
      "SELECT data, updated_at FROM site_settings WHERE id = 1"
    );
    if (result.rows.length === 0) {
      const defaults = defaultSiteSettings();
      await this.pool.query(
        "INSERT INTO site_settings (id, data, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO NOTHING",
        [defaults]
      );
      return { ...defaults, updated_at: new Date().toISOString() };
    }
    return {
      ...result.rows[0].data,
      updated_at: result.rows[0].updated_at
        ? new Date(result.rows[0].updated_at).toISOString()
        : null,
    };
  }

  async updateSiteSettings(patch) {
    const current = await this.getSiteSettings();
    const next = mergeSiteSettings(current, patch || {});
    await this.pool.query(
      `INSERT INTO site_settings (id, data, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [next]
    );
    return next;
  }

  async createCommunityPost(payload) {
    const result = await this.pool.query(
      `INSERT INTO community_posts
         (name, message, image_key, image_content_type, image_size_bytes,
          status, submitted_ip, submitted_user_agent)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
       RETURNING *`,
      [
        payload.name,
        payload.message,
        payload.image_key || null,
        payload.image_content_type || null,
        payload.image_size_bytes || null,
        payload.submitted_ip || null,
        payload.submitted_user_agent || null,
      ]
    );
    return result.rows[0];
  }

  async countCommunityPostsForIpSince(ip, sinceIso) {
    if (!ip) return 0;
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM community_posts
       WHERE submitted_ip = $1 AND created_at >= $2`,
      [ip, sinceIso]
    );
    return result.rows[0]?.count || 0;
  }

  async listApprovedCommunityPosts(limit = 60) {
    const result = await this.pool.query(
      `SELECT * FROM community_posts
       WHERE status = 'approved'
       ORDER BY COALESCE(moderated_at, created_at) DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async countApprovedCommunityPosts() {
    const result = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM community_posts WHERE status = 'approved'"
    );
    return result.rows[0]?.count || 0;
  }

  async listPendingCommunityPosts(limit = 100) {
    const result = await this.pool.query(
      `SELECT * FROM community_posts
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getCommunityPostById(id) {
    const result = await this.pool.query(
      "SELECT * FROM community_posts WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  async moderateCommunityPost(id, { status, moderator, reason }) {
    if (!["approved", "rejected"].includes(status)) {
      throw new ValidationError("Invalid moderation status");
    }
    const result = await this.pool.query(
      `UPDATE community_posts
       SET status = $2, moderated_at = NOW(), moderated_by = $3, moderation_reason = $4
       WHERE id = $1
       RETURNING *`,
      [id, status, moderator || null, reason || null]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError("Community post not found");
    }
    return result.rows[0];
  }
}

function isPostgresUniqueError(error) {
  return error && error.code === "23505";
}

function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }
  if (isPostgresUniqueError(error)) {
    return new ConflictError("A record with this unique value already exists");
  }
  return error;
}

module.exports = {
  PostgresRepository,
  toApiError,
};
