const crypto = require("crypto");
const bcrypt = require("bcryptjs");
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
    this.config = config;
    const poolConfig = {
      connectionString: config.databaseUrl,
      max: config.dbPoolMax || 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
    if (config.databaseSsl) {
      poolConfig.ssl = {
        rejectUnauthorized: config.databaseSslRejectUnauthorized !== false,
      };
    }
    this.pool = new Pool(poolConfig);
    this.pool.on("error", (error) => {
      // Idle PostgreSQL client failures otherwise emit an unhandled EventEmitter
      // error, which can terminate the API process during a transient network blip.
      console.error("Unexpected PostgreSQL pool error", error);
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
        payment_order_id VARCHAR(100),
        payment_id VARCHAR(100),
        payment_signature VARCHAR(128),
        payment_provider VARCHAR(50) DEFAULT 'cashfree',
        payment_verified_at TIMESTAMPTZ,
        checkin_token VARCHAR(128),
        checked_in_at TIMESTAMPTZ,
        checked_in_by VARCHAR(160),
        checkin_method VARCHAR(32),
        checkin_device VARCHAR(200),
        organization_type VARCHAR(64) DEFAULT 'Individual',
        organization_name VARCHAR(200),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_cyclothon_payment_order UNIQUE (payment_order_id),
        CONSTRAINT uq_cyclothon_payment_id UNIQUE (payment_id)
      );

      ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS organization_type VARCHAR(64) DEFAULT 'Individual';
      ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS organization_name VARCHAR(200);

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

      CREATE TABLE IF NOT EXISTS page_visits (
        id BIGSERIAL PRIMARY KEY,
        path VARCHAR(160) NOT NULL,
        timezone VARCHAR(80),
        locale VARCHAR(40),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ix_page_visits_created_at ON page_visits (created_at);

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

      CREATE TABLE IF NOT EXISTS organizing_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        role VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        image_url VARCHAR(500),
        display_order INTEGER NOT NULL DEFAULT 0,
        visible BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sponsorship_tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        amount_paise INTEGER NOT NULL DEFAULT 0,
        availability VARCHAR(120) NOT NULL,
        benefits TEXT NOT NULL,
        complimentary_entries INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        image_url VARCHAR(500),
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

      CREATE INDEX IF NOT EXISTS cyclothon_registrations_email_lower_idx
        ON cyclothon_registrations (lower(email));
      CREATE INDEX IF NOT EXISTS cyclothon_registrations_phone_idx
        ON cyclothon_registrations (phone);
      CREATE INDEX IF NOT EXISTS cyclothon_registrations_status_created_idx
        ON cyclothon_registrations (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS cyclothon_registrations_fullname_lower_idx
        ON cyclothon_registrations (lower(full_name));
      CREATE INDEX IF NOT EXISTS cyclothon_registrations_city_lower_idx
        ON cyclothon_registrations (lower(city));
      CREATE INDEX IF NOT EXISTS cyclothon_registrations_route_idx
        ON cyclothon_registrations (ride_category);
      CREATE INDEX IF NOT EXISTS cyclothon_registrations_payment_status_idx
        ON cyclothon_registrations (payment_status);

      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE INDEX IF NOT EXISTS cyclothon_registrations_fullname_trgm_idx
          ON cyclothon_registrations USING gin (lower(full_name) gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS cyclothon_registrations_email_trgm_idx
          ON cyclothon_registrations USING gin (lower(email) gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS cyclothon_registrations_phone_trgm_idx
          ON cyclothon_registrations USING gin (phone gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS cyclothon_registrations_city_trgm_idx
          ON cyclothon_registrations USING gin (lower(city) gin_trgm_ops);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;

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

      CREATE TABLE IF NOT EXISTS volunteer_accounts (
        id SERIAL PRIMARY KEY,
        volunteer_id VARCHAR(80) UNIQUE NOT NULL,
        display_name VARCHAR(120) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(40),
        role VARCHAR(100) DEFAULT 'Check-in Desk',
        organization VARCHAR(150),
        certificate_status VARCHAR(50) DEFAULT 'not_issued',
        certificate_sent_at TIMESTAMPTZ,
        credentials_sent_at TIMESTAMPTZ,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(120) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rider_passes (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL UNIQUE REFERENCES cyclothon_registrations(id) ON DELETE CASCADE,
        template_version VARCHAR(80) NOT NULL DEFAULT '2026-approved',
        status VARCHAR(24) NOT NULL DEFAULT 'generated',
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        emailed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS participation_certificates (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL UNIQUE REFERENCES cyclothon_registrations(id) ON DELETE CASCADE,
        template_version VARCHAR(80) NOT NULL DEFAULT '2026-approved',
        status VARCHAR(24) NOT NULL DEFAULT 'generated',
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        emailed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS registration_email_deliveries (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL REFERENCES cyclothon_registrations(id) ON DELETE CASCADE,
        email_type VARCHAR(40) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(24) NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 1,
        last_error TEXT,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (registration_id, email_type)
      );
      CREATE INDEX IF NOT EXISTS registration_email_deliveries_registration_idx
        ON registration_email_deliveries (registration_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS partner_applications (
        id SERIAL PRIMARY KEY,
        application_number VARCHAR(64) UNIQUE,
        company_name VARCHAR(200) NOT NULL,
        brand_name VARCHAR(200),
        business_type VARCHAR(100) DEFAULT 'Corporate',
        contact_name VARCHAR(160) NOT NULL,
        designation VARCHAR(120),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        website VARCHAR(500),
        gst_number VARCHAR(32),
        pan_number VARCHAR(32),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        sponsorship_tier_id INTEGER REFERENCES sponsorship_tiers(id),
        package_name VARCHAR(120),
        partnership_type VARCHAR(100) DEFAULT 'Cash Sponsorship',
        proposed_value VARCHAR(100),
        custom_description TEXT,
        brand_tagline VARCHAR(255),
        brand_description TEXT,
        industry VARCHAR(120),
        social_links JSONB DEFAULT '{}',
        logo_key VARCHAR(300),
        logo_content_type VARCHAR(80),
        logo_size_bytes INTEGER,
        activation_options JSONB DEFAULT '[]',
        activation_description TEXT,
        visibility_interests JSONB DEFAULT '[]',
        status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
        payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        application_fee_paise INTEGER NOT NULL DEFAULT 0,
        payment_order_id VARCHAR(100),
        payment_id VARCHAR(100),
        payment_signature VARCHAR(128),
        payment_verified_at TIMESTAMPTZ,
        reviewed_by VARCHAR(120),
        reviewed_at TIMESTAMPTZ,
        approved_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS partner_applications_status_idx ON partner_applications (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS partner_applications_email_idx ON partner_applications (lower(email));
      CREATE INDEX IF NOT EXISTS partner_applications_appnum_idx ON partner_applications (application_number);

      CREATE TABLE IF NOT EXISTS partner_brand_assets (
        id SERIAL PRIMARY KEY,
        partner_id INTEGER NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
        asset_type VARCHAR(64) NOT NULL DEFAULT 'LOGO',
        file_key VARCHAR(300) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size_bytes INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS partner_deliverables (
        id SERIAL PRIMARY KEY,
        partner_id INTEGER NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
        deliverable_type VARCHAR(120) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        notes TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partner_payments (
        id SERIAL PRIMARY KEY,
        partner_id INTEGER NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
        amount_paise INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        payment_gateway VARCHAR(50) DEFAULT 'CASHFREE',
        gateway_order_id VARCHAR(100),
        gateway_payment_id VARCHAR(100),
        payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vendor_applications (
        id SERIAL PRIMARY KEY,
        application_number VARCHAR(64) UNIQUE,
        business_name VARCHAR(200) NOT NULL,
        representative_name VARCHAR(160) NOT NULL,
        contact_name VARCHAR(160),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        category VARCHAR(80) NOT NULL,
        gst_number VARCHAR(32),
        pan_number VARCHAR(32),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        products_services TEXT NOT NULL,
        description TEXT NOT NULL,
        space_requirement VARCHAR(120),
        electricity_required BOOLEAN DEFAULT FALSE,
        water_required BOOLEAN DEFAULT FALSE,
        furniture_required BOOLEAN DEFAULT FALSE,
        branding_support_required BOOLEAN DEFAULT FALSE,
        vehicle_access_required BOOLEAN DEFAULT FALSE,
        staff_count INTEGER DEFAULT 1,
        document_key VARCHAR(300),
        document_content_type VARCHAR(80),
        document_size_bytes INTEGER,
        documents JSONB DEFAULT '[]',
        status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
        payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        stall_fee_paise INTEGER NOT NULL DEFAULT 0,
        payment_order_id VARCHAR(100),
        payment_id VARCHAR(100),
        payment_signature VARCHAR(128),
        payment_verified_at TIMESTAMPTZ,
        reviewed_by VARCHAR(120),
        reviewed_at TIMESTAMPTZ,
        approved_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS vendor_applications_status_idx ON vendor_applications (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS vendor_applications_email_idx ON vendor_applications (lower(email));
      CREATE INDEX IF NOT EXISTS vendor_applications_appnum_idx ON vendor_applications (application_number);
    `;

    await this.pool.query(schemaSql);

    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS application_number VARCHAR(64)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS brand_name VARCHAR(200)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS business_type VARCHAR(100) DEFAULT 'Corporate'"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS designation VARCHAR(120)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS gst_number VARCHAR(32)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS pan_number VARCHAR(32)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS address TEXT"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS city VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS state VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS pincode VARCHAR(20)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS package_name VARCHAR(120)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS partnership_type VARCHAR(100) DEFAULT 'Cash Sponsorship'"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS proposed_value VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS custom_description TEXT"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS brand_tagline VARCHAR(255)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS brand_description TEXT"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS industry VARCHAR(120)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS activation_options JSONB DEFAULT '[]'"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS activation_description TEXT"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS visibility_interests JSONB DEFAULT '[]'"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ"
    );

    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS application_number VARCHAR(64)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS representative_name VARCHAR(160)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS gst_number VARCHAR(32)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS pan_number VARCHAR(32)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS address TEXT"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS city VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS state VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS pincode VARCHAR(20)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS products_services TEXT"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS space_requirement VARCHAR(120)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS electricity_required BOOLEAN DEFAULT FALSE"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS water_required BOOLEAN DEFAULT FALSE"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS furniture_required BOOLEAN DEFAULT FALSE"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS branding_support_required BOOLEAN DEFAULT FALSE"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS vehicle_access_required BOOLEAN DEFAULT FALSE"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 1"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ"
    );

    // Keep compatibility with already-running databases that may predate
    // newer columns and indexes from previous Python deployments.
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS registration_fee_paise INTEGER NOT NULL DEFAULT 0"
    );
    await this.pool.query(
      "ALTER TABLE delegations ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(32) NOT NULL DEFAULT 'Prefer not to say'"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'pending'"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_signature VARCHAR(128)"
    );
    await this.pool.query(
      "ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'cashfree'"
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
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS email VARCHAR(150)"
    );
    await this.pool.query(
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS phone VARCHAR(40)"
    );
    await this.pool.query(
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'Check-in Desk'"
    );
    await this.pool.query(
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS organization VARCHAR(150)"
    );
    await this.pool.query(
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(50) DEFAULT 'not_issued'"
    );
    await this.pool.query(
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS certificate_sent_at TIMESTAMPTZ"
    );
    await this.pool.query(
      "ALTER TABLE volunteer_accounts ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMPTZ"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS payment_signature VARCHAR(128)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100)"
    );
    await this.pool.query(
      "ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS payment_signature VARCHAR(128)"
    );
    await this.pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_payment_order_partial ON cyclothon_registrations (payment_order_id) WHERE payment_order_id IS NOT NULL"
    );
    await this.pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_payment_id_partial ON cyclothon_registrations (payment_id) WHERE payment_id IS NOT NULL"
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

  async ensureAdminUser(username, bootstrapPassword) {
    const existing = await this.pool.query(
      "SELECT id FROM admin_users WHERE username = $1 LIMIT 1",
      [username]
    );
    if (existing.rowCount > 0) {
      return;
    }
    if (!bootstrapPassword) {
      throw new Error("ADMIN_BOOTSTRAP_PASSWORD is required to initialize the admin user");
    }
    const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
    await this.pool.query(
      `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      [username, passwordHash]
    );
  }

  async getAdminUser(username) {
    const result = await this.pool.query(
      "SELECT username, password_hash, active FROM admin_users WHERE username = $1 LIMIT 1",
      [username]
    );
    return result.rows[0] || null;
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

  calculateFeeChoice(now, rideCategory, activeCategoryCount, activeRegistrationCount, eventDate = "2026-11-22") {
    const category = RACE_CATEGORIES[rideCategory];
    if (activeCategoryCount >= category.capacity) {
      throw new ConflictError(`${rideCategory} is full`);
    }
    if (rideCategory === "Kid-o-thon") {
      return category.regular;
    }
    const lastWeekStart = new Date(`${eventDate}T00:00:00.000Z`);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
    if (now >= lastWeekStart) {
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

      // Remove any stale unpaid pending registration for this email so the user can retry
      await client.query(
        `DELETE FROM cyclothon_registrations
         WHERE lower(email) = lower($1)
           AND status = 'pending'
           AND payment_status = 'pending'`,
        [payload.email]
      );

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
        activeCount,
        options.eventDate
      );
      const checkinToken = this.generateCheckinToken();
      const initialStatus = options.paymentEnabled ? "pending" : "approved";
      const initialPaymentStatus = options.paymentEnabled ? "pending" : "paid";
      const paymentVerifiedAt = options.paymentEnabled ? null : new Date();

      let registration;
      try {
        const insertResult = await client.query(
          `INSERT INTO cyclothon_registrations (
             full_name, email, phone, age, city, gender, ride_category,
             organization_type, organization_name,
             emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
             status, registration_fee_paise, payment_status, payment_verified_at,
             checkin_token
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7,
             $8, $9,
             $10, $11, TRUE, TRUE,
             $12, $13, $14, $15, $16
           )
            RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                      organization_type, organization_name,
                      emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                      status, registration_fee_paise, payment_status, payment_order_id,
                      payment_id, payment_signature, payment_provider, payment_verified_at,
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
            payload.organization_type || "Individual",
            payload.organization_name || null,
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
      if (options.paymentEnabled) {
        const order = await options.createPaymentOrder({
          amountPaise: registration.registration_fee_paise,
          receipt: `cyclothon-${registration.id}`,
          registration,
        });
        const updateResult = await client.query(
          `UPDATE cyclothon_registrations
           SET payment_order_id = $1,
               payment_provider = 'cashfree'
           WHERE id = $2
           RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                     emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                     status, registration_fee_paise, payment_status,
                     payment_order_id, payment_id, payment_signature, payment_provider, payment_verified_at,
                     checkin_token, checked_in_at, checked_in_by, checkin_method,
                     checkin_device, created_at`,
          [order.id, registration.id]
        );
        registration = updateResult.rows[0];
        checkout = {
          provider: "cashfree",
          order_id: order.id,
          payment_session_id: order.payment_session_id,
          mode: order.mode,
        };
      }

      return {
        registration,
        checkout,
      };
    });
  }

  async getRegistrationByOrderId(orderId) {
    const result = await this.pool.query(
      `SELECT id, full_name, email, phone, age, city, gender, ride_category,
              emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
              status, registration_fee_paise, payment_status,
              payment_order_id, payment_id, payment_signature, payment_provider, payment_verified_at,
              checkin_token, checked_in_at, checked_in_by, checkin_method,
              checkin_device, created_at
       FROM cyclothon_registrations
       WHERE payment_order_id = $1`,
      [orderId]
    );
    return result.rows[0] || null;
  }

  async verifyCyclothonPayment(registrationId, payload, expectedSignature) {
    return this.withTransaction(async (client) => {
      const registrationResult = await client.query(
        `SELECT id, full_name, email, phone, age, city, gender, ride_category,
                emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                status, registration_fee_paise, payment_status,
                payment_order_id, payment_id, payment_signature, payment_provider, payment_verified_at,
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
      const existingOrderId = registration.payment_order_id;
      if (!existingOrderId) {
        throw new NotFoundError("Payment registration not found");
      }

      const orderId = payload.order_id || payload.payment_order_id;
      const paymentId = payload.payment_id;
      const signature = payload.signature || payload.payment_signature;

      if (registration.payment_status === "paid") {
        const existingPaymentId = registration.payment_id;
        if (existingPaymentId === paymentId) {
          return registration;
        }
        throw new ConflictError("This registration has already been paid");
      }

      if (orderId !== existingOrderId) {
        throw new ValidationError("Payment order does not match this registration");
      }

      if (expectedSignature && signature !== expectedSignature) {
        throw new ValidationError("Payment signature verification failed");
      }

      try {
        const updated = await client.query(
          `UPDATE cyclothon_registrations
           SET payment_status = 'paid',
               status = CASE WHEN status = 'pending' THEN 'approved' ELSE status END,
               payment_id = $1,
               payment_signature = $2,
               payment_provider = 'cashfree',
               payment_verified_at = NOW()
           WHERE id = $3
           RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                     emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                     status, registration_fee_paise, payment_status,
                     payment_order_id, payment_id, payment_signature, payment_provider, payment_verified_at,
                     checkin_token, checked_in_at, checked_in_by, checkin_method,
                     checkin_device, created_at`,
          [paymentId, signature, registrationId]
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

  async markCyclothonPaymentFromWebhook({ orderId, paymentId }) {
    const result = await this.pool.query(
      `UPDATE cyclothon_registrations
       SET payment_status = 'paid',
           status = CASE WHEN status = 'pending' THEN 'approved' ELSE status END,
           payment_id = COALESCE(payment_id, $2),
           payment_provider = 'cashfree',
           payment_verified_at = COALESCE(payment_verified_at, NOW())
       WHERE payment_order_id = $1
       RETURNING *`,
      [orderId, paymentId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError("Payment registration not found");
    }
    return result.rows[0];
  }

  async listRegistrations(filters = {}) {
    const { search, status, route, limit, offset } = filters || {};
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      conditions.push(`cr.status = $${paramIndex++}`);
      params.push(status);
    }

    if (route && route !== "all") {
      conditions.push(`cr.ride_category = $${paramIndex++}`);
      params.push(route);
    }

    if (search && String(search).trim()) {
      const trimmedSearch = String(search).trim();
      const idCandidate = Number.parseInt(trimmedSearch, 10);
      const isNum = Number.isInteger(idCandidate) && idCandidate > 0 && idCandidate <= 2147483647;
      const fuzzy = `%${trimmedSearch.toLowerCase()}%`;
      const digits = trimmedSearch.replace(/\D+/g, "");

      if (isNum && trimmedSearch.length <= 6) {
        conditions.push(`(cr.id = $${paramIndex} OR (cr.phone IS NOT NULL AND cr.phone LIKE $${paramIndex + 1}))`);
        params.push(idCandidate, `%${digits}%`);
        paramIndex += 2;
      } else {
        conditions.push(`(
          lower(cr.full_name) LIKE $${paramIndex} OR
          lower(cr.email) LIKE $${paramIndex} OR
          lower(cr.city) LIKE $${paramIndex} OR
          ($${paramIndex + 1}::int IS NOT NULL AND cr.id = $${paramIndex + 1}) OR
          ($${paramIndex + 2}::text IS NOT NULL AND cr.phone LIKE $${paramIndex + 2})
        )`);
        params.push(fuzzy, isNum ? idCandidate : null, digits ? `%${digits}%` : null);
        paramIndex += 3;
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    let paginationClause = "";
    if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) {
      paginationClause += ` LIMIT $${paramIndex++}`;
      params.push(Number(limit));
      if (offset && Number.isInteger(Number(offset)) && Number(offset) >= 0) {
        paginationClause += ` OFFSET $${paramIndex++}`;
        params.push(Number(offset));
      }
    }

    const query = `
      SELECT cr.id, cr.full_name, cr.email, cr.phone, cr.age, cr.city, cr.gender, cr.ride_category,
             cr.organization_type, cr.organization_name,
             cr.emergency_contact, cr.t_shirt_size, cr.waiver_accepted, cr.privacy_accepted,
             cr.status, cr.registration_fee_paise, cr.payment_status, cr.payment_order_id,
             cr.payment_id, cr.payment_signature, cr.payment_provider, cr.payment_verified_at,
             cr.checkin_token, cr.checked_in_at, cr.checked_in_by, cr.checkin_method,
             cr.checkin_device, cr.created_at,
             rp.status AS rider_pass_status,
             pc.status AS certificate_status,
             red_cert.recipient AS certificate_recipient,
             red_cert.status AS certificate_delivery_status,
             red_cert.sent_at AS certificate_sent_at,
             red_cert.attempt_count AS certificate_attempt_count,
             red_conf.status AS registration_email_status
      FROM cyclothon_registrations cr
      LEFT JOIN rider_passes rp ON rp.registration_id = cr.id
      LEFT JOIN participation_certificates pc ON pc.registration_id = cr.id
      LEFT JOIN registration_email_deliveries red_cert 
        ON red_cert.registration_id = cr.id AND red_cert.email_type = 'certificate'
      LEFT JOIN registration_email_deliveries red_conf 
        ON red_conf.registration_id = cr.id AND red_conf.email_type = 'registration_confirmation'
      ${whereClause}
      ORDER BY cr.created_at DESC
      ${paginationClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getRegistrationById(registrationId) {
    const result = await this.pool.query(
      `SELECT id, full_name, email, phone, age, city, gender, ride_category,
              organization_type, organization_name,
              emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
              status, registration_fee_paise, payment_status, payment_order_id,
              payment_id, payment_signature, payment_provider, payment_verified_at,
              checkin_token, checked_in_at, checked_in_by, checkin_method,
              checkin_device, created_at
       FROM cyclothon_registrations
       WHERE id = $1
       LIMIT 1`,
      [registrationId]
    );
    return result.rows[0] || null;
  }

  async recordEmailDelivery({ registrationId, emailType, recipient, subject, sent, status = sent ? "sent" : "failed", errorMessage = null }) {
    await this.pool.query(
      `INSERT INTO registration_email_deliveries (
         registration_id, email_type, recipient, subject, status, attempt_count, last_error, sent_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5::varchar, 1, $6, CASE WHEN $5::varchar = 'sent'::varchar THEN NOW() ELSE NULL END, NOW())
       ON CONFLICT (registration_id, email_type) DO UPDATE SET
         recipient = EXCLUDED.recipient,
         subject = EXCLUDED.subject,
         status = EXCLUDED.status,
         attempt_count = registration_email_deliveries.attempt_count + 1,
         last_error = EXCLUDED.last_error,
         sent_at = CASE WHEN EXCLUDED.status = 'sent' THEN NOW() ELSE registration_email_deliveries.sent_at END,
         updated_at = NOW()`,
      [registrationId, emailType, recipient, subject, status, errorMessage]
    );
  }

  async recordRiderPass(registrationId, sent) {
    await this.pool.query(
      `INSERT INTO rider_passes (registration_id, status, emailed_at)
       VALUES ($1, $2::varchar, CASE WHEN $2::varchar = 'sent'::varchar THEN NOW() ELSE NULL END)
       ON CONFLICT (registration_id) DO UPDATE SET
         status = EXCLUDED.status,
         generated_at = NOW(),
         emailed_at = CASE WHEN EXCLUDED.status = 'sent' THEN NOW() ELSE rider_passes.emailed_at END`,
      [registrationId, sent ? "sent" : "generated"]
    );
  }

  async recordParticipationCertificate(registrationId, sent) {
    await this.pool.query(
      `INSERT INTO participation_certificates (registration_id, status, emailed_at)
       VALUES ($1, $2::varchar, CASE WHEN $2::varchar = 'sent'::varchar THEN NOW() ELSE NULL END)
       ON CONFLICT (registration_id) DO UPDATE SET
         status = EXCLUDED.status,
         generated_at = NOW(),
         emailed_at = CASE WHEN EXCLUDED.status = 'sent' THEN NOW() ELSE participation_certificates.emailed_at END`,
      [registrationId, sent ? "sent" : "generated"]
    );
  }

  async updateRegistrationStatus(registrationId, status) {
    const result = await this.pool.query(
      `UPDATE cyclothon_registrations
       SET status = $1
       WHERE id = $2
       RETURNING id, full_name, email, phone, age, city, gender, ride_category,
                 emergency_contact, t_shirt_size, waiver_accepted, privacy_accepted,
                 status, registration_fee_paise, payment_status, payment_order_id,
                 payment_id, payment_signature, payment_provider, payment_verified_at,
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
    const isStrictNumeric = /^\d+$/.test(trimmed);
    const idFilter = Number.isInteger(idCandidate) && idCandidate > 0 && idCandidate <= 2147483647 ? idCandidate : null;
    const fuzzy = `%${trimmed.toLowerCase()}%`;
    const digitOnly = trimmed.replace(/\D+/g, "");
    const phoneFilter = digitOnly ? `%${digitOnly}%` : null;

    let querySql;
    let params;

    if (isStrictNumeric && idFilter && trimmed.length <= 6) {
      // Fast path: Exact ID / bib lookup (Primary key index scan: < 0.2ms)
      querySql = `
        SELECT id, full_name, email, phone, city, ride_category, status,
               payment_status, checked_in_at, checked_in_by, checkin_method,
               payment_verified_at, created_at
        FROM cyclothon_registrations
        WHERE id = $1
           OR (phone IS NOT NULL AND phone LIKE $2)
        ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END, created_at DESC
        LIMIT $3
      `;
      params = [idFilter, phoneFilter, limit];
    } else if (isStrictNumeric && phoneFilter) {
      // Fast path: Phone search (using indexed phone column)
      querySql = `
        SELECT id, full_name, email, phone, city, ride_category, status,
               payment_status, checked_in_at, checked_in_by, checkin_method,
               payment_verified_at, created_at
        FROM cyclothon_registrations
        WHERE phone LIKE $1
           OR ($2::int IS NOT NULL AND id = $2)
        ORDER BY created_at DESC
        LIMIT $3
      `;
      params = [phoneFilter, idFilter, limit];
    } else {
      // General multi-column search
      querySql = `
        SELECT id, full_name, email, phone, city, ride_category, status,
               payment_status, checked_in_at, checked_in_by, checkin_method,
               payment_verified_at, created_at
        FROM cyclothon_registrations
        WHERE lower(full_name) LIKE $1
           OR lower(email) LIKE $1
           OR lower(city) LIKE $1
           OR ($2::int IS NOT NULL AND id = $2)
           OR ($3::text IS NOT NULL AND phone LIKE $3)
        ORDER BY
          CASE WHEN ($2::int IS NOT NULL AND id = $2) THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT $4
      `;
      params = [fuzzy, idFilter, phoneFilter, limit];
    }

    const result = await this.pool.query(querySql, params);
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
                 status, registration_fee_paise, payment_status, payment_order_id,
                 payment_id, payment_signature, payment_provider, payment_verified_at,
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
                status, registration_fee_paise, payment_status, payment_order_id,
                payment_id, payment_signature, payment_provider, payment_verified_at,
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
                status, registration_fee_paise, payment_status, payment_order_id,
                payment_id, payment_signature, payment_provider, payment_verified_at,
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
              status, registration_fee_paise, payment_status, payment_order_id,
              payment_id, payment_signature, payment_provider, payment_verified_at,
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

  async recordPageVisit(payload) {
    await this.pool.query("INSERT INTO page_visits (path, timezone, locale) VALUES ($1, $2, $3)", [payload.path, payload.timezone || null, payload.locale || null]);
  }

  async getVisitorAnalytics() {
    const [total, hourly, halfDay, daily, timezones] = await Promise.all([
      this.pool.query("SELECT COUNT(*)::int AS count FROM page_visits"),
      this.pool.query("SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::int AS hour, COUNT(*)::int AS count FROM page_visits GROUP BY hour ORDER BY hour"),
      this.pool.query("SELECT CASE WHEN EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') < 12 THEN '00:00–11:59' ELSE '12:00–23:59' END AS label, COUNT(*)::int AS count FROM page_visits GROUP BY label ORDER BY label"),
      this.pool.query("SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::int AS count FROM page_visits WHERE created_at >= NOW() - INTERVAL '14 days' GROUP BY day ORDER BY day"),
      this.pool.query("SELECT timezone, COUNT(*)::int AS count FROM page_visits WHERE timezone IS NOT NULL GROUP BY timezone ORDER BY count DESC LIMIT 8"),
    ]);
    const hourlyRows = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    for (const row of hourly.rows) hourlyRows[row.hour] = row;
    return { total_visits: total.rows[0].count, hourly: hourlyRows, half_day: halfDay.rows, daily: daily.rows, timezones: timezones.rows };
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
              member_count, status, notes, image_url, created_at
       FROM delegations
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async createDelegation(payload) {
    const result = await this.pool.query(
      `INSERT INTO delegations (
         organization, contact_name, contact_email, contact_phone,
         member_count, status, notes, image_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, organization, contact_name, contact_email, contact_phone,
                 member_count, status, notes, image_url, created_at`,
      [
        payload.organization,
        payload.contact_name,
        payload.contact_email,
        payload.contact_phone,
        payload.member_count,
        payload.status,
        payload.notes,
        payload.image_url,
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
             notes = $7,
             image_url = $8
           WHERE id = $9
       RETURNING id, organization, contact_name, contact_email, contact_phone,
               member_count, status, notes, image_url, created_at`,
      [
        payload.organization,
        payload.contact_name,
        payload.contact_email,
        payload.contact_phone,
        payload.member_count,
        payload.status,
        payload.notes,
        payload.image_url,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async listOrganizingMembers() {
    const result = await this.pool.query(
      `SELECT id, name, role, message, image_url, display_order, visible, created_at, updated_at
       FROM organizing_members ORDER BY display_order ASC, id ASC`
    );
    return result.rows;
  }

  async listPublicOrganizingMembers() {
    const result = await this.pool.query(
      `SELECT id, name, role, message, image_url, display_order
       FROM organizing_members WHERE visible = TRUE ORDER BY display_order ASC, id ASC`
    );
    return result.rows;
  }

  async createOrganizingMember(payload) {
    const result = await this.pool.query(
      `INSERT INTO organizing_members (name, role, message, image_url, display_order, visible)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, role, message, image_url, display_order, visible, created_at, updated_at`,
      [payload.name, payload.role, payload.message, payload.image_url, payload.display_order, payload.visible]
    );
    return result.rows[0];
  }

  async updateOrganizingMember(id, payload) {
    const result = await this.pool.query(
      `UPDATE organizing_members
       SET name = $1, role = $2, message = $3, image_url = $4, display_order = $5, visible = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, role, message, image_url, display_order, visible, created_at, updated_at`,
      [payload.name, payload.role, payload.message, payload.image_url, payload.display_order, payload.visible, id]
    );
    return result.rows[0] || null;
  }

  async deleteOrganizingMember(id) {
    const result = await this.pool.query("DELETE FROM organizing_members WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }

  async seedOrganizingMembers() {
    const existing = await this.pool.query("SELECT COUNT(*)::int AS count FROM organizing_members");
    if (existing.rows[0].count > 0) return;
    const members = [
      ["Rajiv Khanna", "President, RDCA", "I am proud to help build a safer and stronger cycling culture across the Vindhya region.", 0],
      ["Sunil Singh", "Vice President, RDCA", "Every rider who joins us adds momentum to a healthier, more connected community.", 1],
      ["Vibhu Suri", "Secretary, RDCA", "Good events are built by detail, teamwork, and a shared belief in the road ahead.", 2],
      ["Aman Mishra", "Joint Secretary, RDCA", "NV Cyclothon turns individual effort into a movement the whole region can feel.", 3],
      ["CA Prashant Jain", "Office Bureau, RDCA", "Our goal is simple: make every edition more welcoming, credible, and memorable.", 4],
    ];
    for (const [name, role, message, displayOrder] of members) {
      await this.pool.query(
        `INSERT INTO organizing_members (name, role, message, display_order) VALUES ($1, $2, $3, $4)`,
        [name, role, message, displayOrder]
      );
    }
  }

  async listSponsorshipTiers() {
    const result = await this.pool.query("SELECT * FROM sponsorship_tiers ORDER BY display_order ASC, id ASC");
    return result.rows;
  }

  async listPublicSponsorshipTiers() {
    const result = await this.pool.query("SELECT id, name, amount_paise, availability, benefits, complimentary_entries FROM sponsorship_tiers WHERE active = TRUE ORDER BY display_order ASC, id ASC");
    return result.rows;
  }

  async createSponsorshipTier(payload) {
    const result = await this.pool.query(
      `INSERT INTO sponsorship_tiers (name, amount_paise, availability, benefits, complimentary_entries, active, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [payload.name, payload.amount_paise, payload.availability, payload.benefits, payload.complimentary_entries, payload.active, payload.display_order]
    );
    return result.rows[0];
  }

  async updateSponsorshipTier(id, payload) {
    const result = await this.pool.query(
      `UPDATE sponsorship_tiers SET name=$1, amount_paise=$2, availability=$3, benefits=$4, complimentary_entries=$5, active=$6, display_order=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [payload.name, payload.amount_paise, payload.availability, payload.benefits, payload.complimentary_entries, payload.active, payload.display_order, id]
    );
    return result.rows[0] || null;
  }

  async deleteSponsorshipTier(id) {
    const result = await this.pool.query("DELETE FROM sponsorship_tiers WHERE id=$1", [id]);
    return result.rowCount > 0;
  }

  async seedSponsorshipTiers() {
    const existing = await this.pool.query("SELECT COUNT(*)::int AS count FROM sponsorship_tiers");
    if (existing.rows[0].count > 0) return;
    const tiers = [
      ["Title Sponsor", 50000000, "1 available", "Largest logo on jersey, start/finish arch, bibs, website and press backdrop.", 10],
      ["Powered By Sponsor", 25000000, "2 available", "Large logo on jersey, website, stage backdrop and event collateral.", 5],
      ["Associate Sponsor", 10000000, "4-6 available", "Logo on jersey sleeves, banners, signage and website.", 3],
      ["Supporting Partner", 5000000, "Multiple", "Logo on event signage and website.", 2],
      ["Hydration / Medical Partner", 5000000, "Category exclusive", "Branding at water stations, medical booth and ambulance support.", 0],
      ["Media Partner", 0, "In-kind exclusive", "Exclusive media rights and logo on media backdrops.", 0],
    ];
    for (const [index, tier] of tiers.entries()) {
      await this.pool.query("INSERT INTO sponsorship_tiers (name, amount_paise, availability, benefits, complimentary_entries, display_order) VALUES ($1,$2,$3,$4,$5,$6)", [...tier, index]);
    }
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
    const data = { ...result.rows[0].data };
    let dirty = false;
    if (data.event_date === "2026-10-18") {
      data.event_date = "2026-11-22";
      dirty = true;
    }
    if (data.partner_applications_open === undefined) {
      data.partner_applications_open = true;
      dirty = true;
    }
    if (data.vendor_applications_open === undefined) {
      data.vendor_applications_open = true;
      dirty = true;
    }
    if (dirty) {
      await this.pool.query(
        "UPDATE site_settings SET data = $1, updated_at = NOW() WHERE id = 1",
        [data]
      );
    }
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

    return {
      ...data,
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

  async listVolunteerAccounts() {
    const result = await this.pool.query(
      `SELECT id, volunteer_id, display_name, email, phone, role, organization, certificate_status, certificate_sent_at, credentials_sent_at, active, created_at, updated_at
       FROM volunteer_accounts
       ORDER BY volunteer_id ASC`
    );
    return result.rows;
  }

  async getVolunteerAccount(volunteerId) {
    const result = await this.pool.query(
      `SELECT id, volunteer_id, display_name, email, phone, role, organization, certificate_status, certificate_sent_at, credentials_sent_at, password_hash, active, created_at, updated_at
       FROM volunteer_accounts
       WHERE volunteer_id = lower($1)
       LIMIT 1`,
      [String(volunteerId || "").trim()]
    );
    return result.rows[0] || null;
  }

  async getVolunteerAccountById(id) {
    const result = await this.pool.query(
      `SELECT id, volunteer_id, display_name, email, phone, role, organization, certificate_status, certificate_sent_at, credentials_sent_at, password_hash, active, created_at, updated_at
       FROM volunteer_accounts
       WHERE id = $1
       LIMIT 1`,
      [Number(id)]
    );
    return result.rows[0] || null;
  }

  async hasActiveVolunteerAccounts() {
    const result = await this.pool.query(
      "SELECT EXISTS(SELECT 1 FROM volunteer_accounts WHERE active = TRUE) AS exists"
    );
    return Boolean(result.rows[0]?.exists);
  }

  async createVolunteerAccount(payload) {
    try {
      const result = await this.pool.query(
        `INSERT INTO volunteer_accounts (volunteer_id, display_name, password_hash, email, phone, role, organization)
         VALUES (lower($1), $2, $3, $4, $5, $6, $7)
         RETURNING id, volunteer_id, display_name, email, phone, role, organization, certificate_status, certificate_sent_at, credentials_sent_at, active, created_at, updated_at`,
        [
          payload.volunteer_id,
          payload.display_name,
          payload.password_hash,
          payload.email || null,
          payload.phone || null,
          payload.role || "Check-in Desk",
          payload.organization || null,
        ]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") throw new ConflictError("Volunteer ID is already in use");
      throw error;
    }
  }

  async updateVolunteerAccount(id, patch) {
    const result = await this.pool.query(
      `UPDATE volunteer_accounts
       SET display_name = COALESCE($2, display_name),
           password_hash = COALESCE($3, password_hash),
           active = COALESCE($4, active),
           email = COALESCE($5, email),
           phone = COALESCE($6, phone),
           role = COALESCE($7, role),
           organization = COALESCE($8, organization),
           certificate_status = COALESCE($9, certificate_status),
           certificate_sent_at = COALESCE($10, certificate_sent_at),
           credentials_sent_at = COALESCE($11, credentials_sent_at),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, volunteer_id, display_name, email, phone, role, organization, certificate_status, certificate_sent_at, credentials_sent_at, active, created_at, updated_at`,
      [
        id,
        patch.display_name ?? null,
        patch.password_hash ?? null,
        patch.active ?? null,
        patch.email ?? null,
        patch.phone ?? null,
        patch.role ?? null,
        patch.organization ?? null,
        patch.certificate_status ?? null,
        patch.certificate_sent_at ?? null,
        patch.credentials_sent_at ?? null,
      ]
    );
    return result.rows[0] || null;
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

  async getCommunityPostByImageKey(key) {
    const result = await this.pool.query(
      "SELECT * FROM community_posts WHERE image_key = $1",
      [key]
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

  async listCommunityPostsByStatus(status, limit = 100) {
    if (status && status !== "all") {
      const result = await this.pool.query(
        `SELECT * FROM community_posts
         WHERE status = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [status, limit]
      );
      return result.rows;
    }
    const result = await this.pool.query(
      `SELECT * FROM community_posts
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async deleteCommunityPost(id) {
    const post = await this.getCommunityPostById(id);
    if (!post) return null;
    await this.pool.query("DELETE FROM community_posts WHERE id = $1", [id]);
    return post;
  }


  // --- Sponsorship Tiers Helper ---

  async getSponsorshipTierById(id) {
    const result = await this.pool.query(
      "SELECT * FROM sponsorship_tiers WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  // --- Partner Applications ---

  generatePartnerApplicationNumber() {
    return `NV-26-P-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  generateVendorApplicationNumber() {
    return `NV-26-V-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  async createPartnerApplication(payload) {
    const appNumber = payload.application_number || this.generatePartnerApplicationNumber();
    const result = await this.pool.query(
      `INSERT INTO partner_applications
       (application_number, company_name, brand_name, business_type, contact_name, designation,
        email, phone, website, gst_number, pan_number, address, city, state, pincode,
        sponsorship_tier_id, package_name, partnership_type, proposed_value, custom_description,
        brand_tagline, brand_description, industry, social_links,
        logo_key, logo_content_type, logo_size_bytes, activation_options, activation_description,
        visibility_interests, status, payment_status, application_fee_paise, payment_order_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
       RETURNING *`,
      [
        appNumber,
        payload.company_name,
        payload.brand_name || payload.company_name,
        payload.business_type || 'Corporate',
        payload.contact_name,
        payload.designation || null,
        payload.email,
        payload.phone,
        payload.website || null,
        payload.gst_number || null,
        payload.pan_number || null,
        payload.address || null,
        payload.city || null,
        payload.state || null,
        payload.pincode || null,
        payload.sponsorship_tier_id || null,
        payload.package_name || payload.selected_package || null,
        payload.partnership_type || 'Cash Sponsorship',
        payload.proposed_value || null,
        payload.custom_description || payload.message || null,
        payload.brand_tagline || null,
        payload.brand_description || null,
        payload.industry || null,
        JSON.stringify(payload.social_links || {}),
        payload.logo_key || null,
        payload.logo_content_type || null,
        payload.logo_size_bytes || null,
        JSON.stringify(payload.activation_options || []),
        payload.activation_description || null,
        JSON.stringify(payload.visibility_interests || []),
        payload.status || 'SUBMITTED',
        payload.payment_status || 'PENDING',
        payload.application_fee_paise || 0,
        payload.payment_order_id || payload.order_id || null,
      ]
    );

    const partner = result.rows[0];

    // Seed default deliverables based on visibility interests or standard deliverables
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
      await this.pool.query(
        `INSERT INTO partner_deliverables (partner_id, deliverable_type, status)
         VALUES ($1, $2, 'PENDING')`,
        [partner.id, d]
      );
    }

    return partner;
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

    const params = [];
    let sql = `
      SELECT pa.*, st.name AS tier_name
      FROM partner_applications pa
      LEFT JOIN sponsorship_tiers st ON pa.sponsorship_tier_id = st.id
      WHERE 1=1
    `;

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND pa.status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(pa.company_name) LIKE $${params.length}
        OR LOWER(pa.contact_name) LIKE $${params.length}
        OR LOWER(pa.email) LIKE $${params.length}
        OR pa.phone LIKE $${params.length}
        OR LOWER(COALESCE(pa.application_number, '')) LIKE $${params.length}
      )`;
    }

    sql += ' ORDER BY pa.created_at DESC';
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async getPartnerApplicationById(id) {
    const result = await this.pool.query(
      `SELECT pa.*, st.name AS tier_name
       FROM partner_applications pa
       LEFT JOIN sponsorship_tiers st ON pa.sponsorship_tier_id = st.id
       WHERE pa.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getPartnerApplicationByNumber(appNum) {
    const result = await this.pool.query(
      `SELECT pa.*, st.name AS tier_name
       FROM partner_applications pa
       LEFT JOIN sponsorship_tiers st ON pa.sponsorship_tier_id = st.id
       WHERE pa.application_number = $1`,
      [appNum]
    );
    return result.rows[0] || null;
  }

  async updatePartnerApplicationStatus(id, { status, reviewer, notes }) {
    const isApproved = String(status).toUpperCase() === 'APPROVED';
    const result = await this.pool.query(
      `UPDATE partner_applications
       SET status=$1, reviewed_by=$2, reviewed_at=NOW(), review_notes=$3,
           approved_at = CASE WHEN $4::boolean THEN NOW() ELSE approved_at END,
           updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [status, reviewer || 'admin', notes || null, isApproved, id]
    );
    return result.rows[0] || null;
  }

  async verifyPartnerPayment(id, { paymentId, signature }) {
    const result = await this.pool.query(
      `UPDATE partner_applications
       SET payment_status='PAYMENT_VERIFIED', status='PAYMENT_VERIFIED',
           payment_id=$1, payment_signature=$2, payment_verified_at=NOW(), updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [paymentId, signature, id]
    );
    return result.rows[0] || null;
  }

  async listApprovedPartners() {
    const result = await this.pool.query(
      `SELECT pa.id, pa.application_number, pa.company_name, pa.brand_name, pa.logo_key,
              pa.website, pa.sponsorship_tier_id, COALESCE(st.name, pa.package_name, 'Partner') AS tier_name,
              st.display_order
       FROM partner_applications pa
       LEFT JOIN sponsorship_tiers st ON pa.sponsorship_tier_id = st.id
       WHERE pa.status = 'APPROVED' OR pa.status = 'EVENT_READY' OR pa.status = 'COMPLETED'
       ORDER BY COALESCE(st.display_order, 99) ASC, pa.created_at ASC`
    );
    return result.rows;
  }

  async listPartnerDeliverables(partnerId) {
    const result = await this.pool.query(
      `SELECT * FROM partner_deliverables WHERE partner_id = $1 ORDER BY id ASC`,
      [partnerId]
    );
    return result.rows;
  }

  async updatePartnerDeliverable(deliverableId, { status, notes }) {
    const isCompleted = String(status).toUpperCase() === 'COMPLETED';
    const result = await this.pool.query(
      `UPDATE partner_deliverables
       SET status=$1, notes=COALESCE($2, notes),
           completed_at = CASE WHEN $3::boolean THEN NOW() ELSE completed_at END
       WHERE id=$4 RETURNING *`,
      [status, notes || null, isCompleted, deliverableId]
    );
    return result.rows[0] || null;
  }

  // --- Vendor Applications ---

  async createVendorApplication(payload) {
    const appNumber = payload.application_number || this.generateVendorApplicationNumber();
    const result = await this.pool.query(
      `INSERT INTO vendor_applications
       (application_number, business_name, representative_name, contact_name, email, phone,
        category, gst_number, pan_number, address, city, state, pincode,
        products_services, description, space_requirement, electricity_required, water_required,
        furniture_required, branding_support_required, vehicle_access_required, staff_count,
        document_key, document_content_type, document_size_bytes, documents,
        stall_fee_paise, payment_order_id, payment_status, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
       RETURNING *`,
      [
        appNumber,
        payload.business_name,
        payload.representative_name || payload.contact_name,
        payload.contact_name || payload.representative_name,
        payload.email,
        payload.phone,
        payload.category,
        payload.gst_number || null,
        payload.pan_number || null,
        payload.address || null,
        payload.city || null,
        payload.state || null,
        payload.pincode || null,
        payload.products_services || payload.description,
        payload.description,
        payload.space_requirement || null,
        Boolean(payload.electricity_required),
        Boolean(payload.water_required),
        Boolean(payload.furniture_required),
        Boolean(payload.branding_support_required),
        Boolean(payload.vehicle_access_required),
        Number(payload.staff_count) || 1,
        payload.document_key || null,
        payload.document_content_type || null,
        payload.document_size_bytes || null,
        JSON.stringify(payload.documents || []),
        payload.stall_fee_paise || 0,
        payload.payment_order_id || payload.order_id || null,
        payload.payment_status || 'PENDING',
        payload.status || 'SUBMITTED',
      ]
    );
    return result.rows[0];
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

    const params = [];
    let sql = 'SELECT * FROM vendor_applications WHERE 1=1';

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(business_name) LIKE $${params.length}
        OR LOWER(representative_name) LIKE $${params.length}
        OR LOWER(email) LIKE $${params.length}
        OR phone LIKE $${params.length}
        OR LOWER(COALESCE(application_number, '')) LIKE $${params.length}
        OR LOWER(category) LIKE $${params.length}
      )`;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async getVendorApplicationById(id) {
    const result = await this.pool.query('SELECT * FROM vendor_applications WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getVendorApplicationByNumber(appNum) {
    const result = await this.pool.query('SELECT * FROM vendor_applications WHERE application_number = $1', [appNum]);
    return result.rows[0] || null;
  }

  async updateVendorApplicationStatus(id, { status, reviewer, notes }) {
    const isApproved = String(status).toUpperCase() === 'APPROVED';
    const result = await this.pool.query(
      `UPDATE vendor_applications
       SET status=$1, reviewed_by=$2, reviewed_at=NOW(), review_notes=$3,
           approved_at = CASE WHEN $4::boolean THEN NOW() ELSE approved_at END,
           updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [status, reviewer || 'admin', notes || null, isApproved, id]
    );
    return result.rows[0] || null;
  }

  async verifyVendorPayment(id, { paymentId, signature }) {
    const result = await this.pool.query(
      `UPDATE vendor_applications
       SET payment_status='PAYMENT_VERIFIED',
           payment_id=$1, payment_signature=$2, payment_verified_at=NOW(), updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [paymentId, signature, id]
    );
    return result.rows[0] || null;
  }

  async getPartnerVendorAnalytics() {
    const partnerResult = await this.pool.query(
      `SELECT status, COUNT(*)::int AS count FROM partner_applications GROUP BY status`
    );
    const vendorResult = await this.pool.query(
      `SELECT status, COUNT(*)::int AS count FROM vendor_applications GROUP BY status`
    );
    return {
      partners: partnerResult.rows,
      vendors: vendorResult.rows,
    };
  }

  async cleanupExpiredPendingRegistrations(ttlMinutes = 30) {
    const result = await this.pool.query(
      `DELETE FROM cyclothon_registrations
       WHERE status = 'pending'
         AND payment_status = 'pending'
         AND created_at < NOW() - INTERVAL '1 minute' * $1
       RETURNING id, email`,
      [ttlMinutes]
    );
    return result.rows;
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
