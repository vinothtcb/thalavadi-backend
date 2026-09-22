-- Thalavadi Directory — Database Schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ─────────────────────────────────────────────
-- USERS
-- One row per logged-in phone number. Guests are not stored.
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(150) UNIQUE NOT NULL,  -- primary login identifier — OTP is sent here
  phone       VARCHAR(15),                   -- mandatory as of profile completion, but not the login key (see updateMe)
  name        VARCHAR(100),
  location    VARCHAR(150),                  -- e.g. area/village within Thalavadi
  emergency_contact_name   VARCHAR(100),
  emergency_contact_phone  VARCHAR(15),
  license_image_url        TEXT,             -- self-uploaded driving license photo, max 5MB
  verified_driver           BOOLEAN NOT NULL DEFAULT false,  -- admin-toggled after reviewing license photo
  id_document_image_url    TEXT,             -- self-uploaded government ID photo, max 5MB (Aadhaar, Voter ID, etc.)
  id_document_type         VARCHAR(30),      -- e.g. 'Aadhaar Card', 'Voter ID', 'Driving License', 'Other'
  id_verification_status   VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (id_verification_status IN ('none','pending','verified','rejected')),
  id_verification_note     VARCHAR(200),     -- admin's note, e.g. reason for rejection
  willing_blood_donor      BOOLEAN NOT NULL DEFAULT false,  -- set from Profile, and kept in sync when posting to Blood Donors
  blood_group               VARCHAR(3) CHECK (blood_group IN ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  notification_preferences  TEXT[] NOT NULL DEFAULT '{}',    -- e.g. {'news','events','classifieds','rides','blood_donors'}
  last_notifications_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- badge count = items newer than this, in the user's preferred categories
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- updated on OTP login and on every session refresh, so it reflects real recent activity
  role        VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- OTP_CODES
-- Short-lived codes used to verify a phone number at login.
-- ─────────────────────────────────────────────
-- ─────────────────────────────────────────────
-- OTP_CODES
-- Short-lived codes used to verify an email address at login.
-- ─────────────────────────────────────────────
CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(150) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_email ON otp_codes(email);

-- ─────────────────────────────────────────────
-- REFRESH_TOKENS
-- Enables persistent login (no re-OTP every app open) via short-lived
-- access tokens + long-lived, revocable, per-device refresh tokens.
-- Only the hash is stored — the raw token never touches the database.
-- ─────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(128) NOT NULL UNIQUE,
  device_id    VARCHAR(100),      -- client-generated, identifies "this phone"
  device_label VARCHAR(150),      -- human-readable, e.g. browser/OS info
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked      BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- ─────────────────────────────────────────────
-- CATEGORIES
-- The tiles shown on the dashboard (Hospitals, Restaurants, etc.)
-- ─────────────────────────────────────────────
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  name_ta     VARCHAR(120),                  -- Tamil name, shown when the app's language is set to Tamil
  name_kn     VARCHAR(120),                  -- Kannada name, shown when the app's language is set to Kannada
  slug        VARCHAR(80) UNIQUE NOT NULL,   -- e.g. 'hospitals'
  icon        VARCHAR(40) NOT NULL,          -- icon key used by the app
  color       VARCHAR(7)  NOT NULL,          -- hex color for the tile
  image_url   TEXT,                          -- optional cover photo, max 5MB (enforced client-side)
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- BUSINESSES
-- Individual listings that belong to a category.
-- ─────────────────────────────────────────────
CREATE TABLE businesses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  tagline      VARCHAR(200),
  phone        VARCHAR(15) NOT NULL,
  whatsapp     VARCHAR(15),
  address      VARCHAR(250),
  latitude     NUMERIC(9,6),
  longitude    NUMERIC(9,6),
  rating       NUMERIC(2,1) DEFAULT 0.0,
  priority     INT NOT NULL DEFAULT 0,   -- admin-controlled sort order, higher shows first
  details      JSONB,                     -- category-specific fields (e.g. school board, hospital specialties)
  image_url    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  posted_by    UUID REFERENCES users(id),      -- the user who posted it; NULL for admin-seeded listings
  created_by   UUID REFERENCES users(id),      -- kept for backward compatibility with earlier admin-only flow
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_category ON businesses(category_id);
CREATE INDEX idx_business_priority ON businesses(priority DESC);
CREATE INDEX idx_business_name_search ON businesses USING GIN (to_tsvector('english', name || ' ' || coalesce(tagline, '')));

-- ─────────────────────────────────────────────
-- FAVORITES (optional, for a later "saved businesses" feature)
-- ─────────────────────────────────────────────
CREATE TABLE favorites (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

-- ─────────────────────────────────────────────
-- BUS_SCHEDULES
-- Local bus timings. "Next bus" is computed on the frontend by comparing
-- departure_time to the current time — no special column needed for that.
-- ─────────────────────────────────────────────
CREATE TABLE bus_schedules (
  id             SERIAL PRIMARY KEY,
  route_name     VARCHAR(150) NOT NULL,      -- e.g. 'Thalavadi - Sathyamangalam'
  source         VARCHAR(100) NOT NULL,
  destination    VARCHAR(100) NOT NULL,
  departure_time TIME NOT NULL,              -- 24-hour time, e.g. 06:30
  bus_type       VARCHAR(30) NOT NULL DEFAULT 'Government', -- Government | Private | Town Bus
  operator       VARCHAR(100),
  notes          VARCHAR(200),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bus_departure ON bus_schedules(departure_time);

-- ─────────────────────────────────────────────
-- BLOOD_DONORS
-- Group-wise (blood group) volunteer donor directory.
-- ─────────────────────────────────────────────
CREATE TABLE blood_donors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  blood_group   VARCHAR(3) NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  phone         VARCHAR(15) NOT NULL,
  area          VARCHAR(150),
  is_available  BOOLEAN NOT NULL DEFAULT true,
  user_id       UUID REFERENCES users(id),  -- links back to the user who set willingness in Profile; NULL for admin-added entries
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_donor_blood_group ON blood_donors(blood_group);
CREATE UNIQUE INDEX idx_donor_user_id ON blood_donors(user_id) WHERE user_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- GOVERNMENT_OFFICES
-- ─────────────────────────────────────────────
CREATE TABLE government_categories (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,      -- e.g. 'Revenue & Land'
  name_ta        VARCHAR(180),
  name_kn        VARCHAR(180),
  slug           VARCHAR(120) UNIQUE NOT NULL,
  icon           VARCHAR(80),
  display_order  INT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE government_offices (
  id                    SERIAL PRIMARY KEY,
  category_id           INT REFERENCES government_categories(id),
  office_name           VARCHAR(220) NOT NULL,
  office_name_tamil     VARCHAR(260),
  designation           VARCHAR(220),         -- e.g. 'Tahsildar, Thalavadi'
  officer_name          VARCHAR(220),
  phone                 VARCHAR(100),
  mobile                VARCHAR(100),
  email                 VARCHAR(220),
  address               TEXT,
  pincode               VARCHAR(10),
  taluk                 VARCHAR(100) DEFAULT 'Thalavadi',
  district              VARCHAR(100) DEFAULT 'Erode',
  state                 VARCHAR(100) DEFAULT 'Tamil Nadu',
  services              TEXT,                 -- what this office helps with
  website_url           TEXT,
  source_url            TEXT,                 -- where this record was verified from
  verified_date         DATE,
  verification_status   VARCHAR(40) NOT NULL DEFAULT 'verified',
  is_local_office        BOOLEAN NOT NULL DEFAULT true,  -- true = Thalavadi-specific, false = district/state service
  image_url             TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gov_offices_category ON government_offices(category_id);

-- ─────────────────────────────────────────────
-- FARMER CATEGORIES & SERVICES
-- A directory for agriculture-related services, structured the same way
-- as the rest of the app (a fixed set of subcategories + user-postable
-- listings), rather than a bespoke schema per subcategory.
-- ─────────────────────────────────────────────
CREATE TABLE farmer_categories (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  name_ta        VARCHAR(150),
  name_kn        VARCHAR(150),
  slug           VARCHAR(120) UNIQUE NOT NULL,
  icon           VARCHAR(40) NOT NULL,     -- icon key, mirrors "categories.icon" pattern
  sort_order     INT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE farmer_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     INT NOT NULL REFERENCES farmer_categories(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  contact_person  VARCHAR(120),
  phone           VARCHAR(15) NOT NULL,
  whatsapp        VARCHAR(15),
  address         VARCHAR(250),
  village         VARCHAR(120),
  service_area    VARCHAR(250),            -- e.g. "Thalavadi, Bejalatti, Gettavadi" — providers often serve multiple villages
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  description     TEXT,
  services        TEXT,                    -- short list of what they offer
  opening_hours   VARCHAR(150),
  rate            VARCHAR(60),              -- optional pricing, e.g. '₹500/day' — free text since it varies a lot by category
  details         JSONB,                    -- category-specific extra fields (brand, qualification, vehicle_type, etc.)
  image_url       TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT false,   -- admin-only to set, same pattern as businesses.priority
  is_active       BOOLEAN NOT NULL DEFAULT true,
  posted_by       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_farmer_services_category ON farmer_services(category_id);

-- ─────────────────────────────────────────────
-- POSTING_PERMISSIONS
-- One row per user-postable content type. When allowed = false, regular
-- users can browse that section but the "Add/Post" button is hidden —
-- admins can always post regardless of this setting.
-- ─────────────────────────────────────────────
CREATE TABLE posting_permissions (
  type_key    VARCHAR(40) PRIMARY KEY,
  label       VARCHAR(80) NOT NULL,
  allowed     BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- ARCHIVED_LISTINGS
-- Where completed/expired content ends up permanently, once it's old
-- enough to clear out of the live tables. Stores a full snapshot so
-- nothing is lost, just moved out of the way — admins can still browse it.
-- ─────────────────────────────────────────────
-- WHATSAPP_NOTIFICATION_LOG
-- What was (or would be) sent to whom for each new post, per the
-- recipient's own notification_preferences. See utils/whatsappNotify.js
-- for why "status" is usually 'queued' rather than 'sent' until a real
-- WhatsApp Business API provider is configured.
-- ─────────────────────────────────────────────
-- TILE_READ_STATUS
-- Per-user, per-dashboard-tile "last viewed" timestamp — lets opening one
-- tile (e.g. Return Pickups) clear just that tile's notification count
-- without affecting any other tile's count. Before this table existed,
-- there was only one global last_notifications_read_at per user, so
-- opening any one thing cleared everything.
-- ─────────────────────────────────────────────
CREATE TABLE tile_read_status (
  user_id      UUID NOT NULL REFERENCES users(id),
  tile_key     VARCHAR(30) NOT NULL,   -- matches TILE_COUNT_QUERIES keys in notificationController.js
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tile_key)
);

-- ─────────────────────────────────────────────
CREATE TABLE whatsapp_notification_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category           VARCHAR(30) NOT NULL,
  title              VARCHAR(200) NOT NULL,
  body               TEXT,
  recipient_user_id  UUID REFERENCES users(id),
  recipient_phone    VARCHAR(15) NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  note               VARCHAR(200),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_log_created ON whatsapp_notification_log(created_at);

-- ─────────────────────────────────────────────
CREATE TABLE archived_listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table   VARCHAR(40) NOT NULL,   -- 'events' | 'ride_requests' | 'classifieds' | 'news_alerts'
  original_id    TEXT NOT NULL,
  title          VARCHAR(200),           -- denormalized for a fast admin list view
  payload        JSONB NOT NULL,         -- full original row
  archived_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_archived_source ON archived_listings(source_table);

-- ─────────────────────────────────────────────
-- EMERGENCY_CONTACTS
-- Covers police, fire, hospitals, and ambulance services in one directory.
-- ─────────────────────────────────────────────
CREATE TABLE emergency_contacts (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  category    VARCHAR(20) NOT NULL CHECK (category IN ('police','fire','ambulance','hospital','other')),
  phone       VARCHAR(15) NOT NULL,
  address     VARCHAR(250),
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_emergency_category ON emergency_contacts(category);

-- ─────────────────────────────────────────────
-- CLASSIFIEDS
-- Covers jobs, rentals, properties, and auto/cab-for-hire listings in one
-- table, distinguished by "type". Type-specific extra fields (e.g. BHK for
-- a rental, salary for a job) go in the flexible "details" JSON column so
-- we don't need a separate table per type.
-- ─────────────────────────────────────────────
CREATE TABLE classifieds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           VARCHAR(20) NOT NULL CHECK (type IN ('job','rental','property','auto_cab')),
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  price          VARCHAR(60),          -- free text: '₹15,000/month', '₹25 LPA', 'Negotiable'
  location       VARCHAR(150),
  contact_name   VARCHAR(100),
  contact_phone  VARCHAR(15) NOT NULL,
  vehicle_verification_status VARCHAR(20) DEFAULT 'pending' CHECK (vehicle_verification_status IN ('verified','pending','failed')), -- Auto/Cab listings only
  vehicle_verification_note   VARCHAR(200),
  details        JSONB,                -- type-specific extras
  latitude       NUMERIC(9,6),          -- optional map location (used by property/rental)
  longitude      NUMERIC(9,6),
  image_url      TEXT,
  posted_by      UUID REFERENCES users(id),
  status         VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')), -- poster marks Jobs/Rentals/Properties completed when filled
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_classifieds_type ON classifieds(type);

-- ─────────────────────────────────────────────
-- NEWS_ALERTS
-- City/village news and alerts, postable by admins.
-- ─────────────────────────────────────────────
CREATE TABLE news_alerts (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  body        TEXT,
  is_urgent   BOOLEAN NOT NULL DEFAULT false,
  image_url   TEXT,
  posted_by   UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_created ON news_alerts(created_at DESC);

-- ─────────────────────────────────────────────
-- COMMUNITIES
-- Local clubs, associations, and self-help groups.
-- ─────────────────────────────────────────────
CREATE TABLE communities (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  category       VARCHAR(60),           -- e.g. 'Youth Club', 'Women's SHG', 'Sports'
  description    TEXT,
  contact_name   VARCHAR(100),
  contact_phone  VARCHAR(15),
  meeting_info   VARCHAR(200),
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- GALLERY_PHOTOS
-- Admin-managed photo gallery of Thalavadi. Read-only for regular users.
-- ─────────────────────────────────────────────
CREATE TABLE gallery_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT NOT NULL,
  caption     VARCHAR(200),
  category    VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (category IN ('general','events','festivals','nature','historical')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- EVENTS
-- Community events. "Upcoming" vs "Completed" is computed from start_date/end_date
-- vs the current date — no separate status column needed.
-- ─────────────────────────────────────────────
CREATE TABLE events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  location       VARCHAR(200),
  start_date     DATE NOT NULL,
  start_time     TIME,
  end_date       DATE,             -- defaults to start_date if not given
  end_time       TIME,
  contact_name   VARCHAR(100),
  contact_phone  VARCHAR(15),
  is_paid_event  BOOLEAN NOT NULL DEFAULT false,
  registration_fee VARCHAR(20),      -- e.g. '₹100' — the poster's own amount, not enforced/validated as a real transaction
  upi_id         VARCHAR(100),       -- e.g. 'organizer@upi' — attendees pay the organizer directly via their own UPI app
  upi_qr_image_url TEXT,             -- optional, self-uploaded QR code as an alternative to typing the UPI ID
  image_url      TEXT,
  posted_by      UUID REFERENCES users(id),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_date ON events(start_date);

-- ─────────────────────────────────────────────
-- RIDE_REQUESTS
-- Covers both "Return Pickups" (cargo transport on a return trip, to avoid
-- driving empty) and "Car Pooling", distinguished by ride_type. Pickup/drop
-- coordinates are captured via the free OpenStreetMap geocoder; distance is
-- calculated client-side (Haversine) from those coordinates. Price is
-- entirely set by the person posting — the app never sets pricing.
-- ─────────────────────────────────────────────
CREATE TABLE ride_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_type        VARCHAR(20) NOT NULL CHECK (ride_type IN ('return_pickup','carpool')),
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  pickup_name      VARCHAR(200) NOT NULL,
  pickup_lat       NUMERIC(9,6),
  pickup_lng       NUMERIC(9,6),
  drop_name        VARCHAR(200) NOT NULL,
  drop_lat         NUMERIC(9,6),
  drop_lng         NUMERIC(9,6),
  distance_km      NUMERIC(6,1),
  price            VARCHAR(60),         -- free text, set by the poster
  negotiable       BOOLEAN NOT NULL DEFAULT false,
  travel_date      DATE,
  travel_time      TIME,
  end_date         DATE,    -- listing auto-completes once this (plus end_time) passes
  end_time         TIME,
  seats_available  INT,                 -- mainly relevant for carpool
  weight_kg        NUMERIC(7,2),        -- legacy cargo spec, kept for backward compatibility
  dimensions       VARCHAR(60),         -- legacy, e.g. '40 x 30 x 20 cm'
  cargo_category   VARCHAR(20) CHECK (cargo_category IN ('general','fragile','perishable','hazardous','documents')),
  vehicle_type     VARCHAR(30),         -- e.g. 'Pickup', 'Mini Truck' (return_pickup) or 'Car', 'SUV' (carpool)
  vehicle_registration_number VARCHAR(20),
  vehicle_verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (vehicle_verification_status IN ('verified','pending','failed')),
  vehicle_verification_note   VARCHAR(200),
  travelling_status VARCHAR(20) CHECK (travelling_status IN ('empty','part_load')), -- return_pickup only
  status           VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','cancelled')),
  completed_at     TIMESTAMPTZ,
  contact_name     VARCHAR(100),
  contact_phone    VARCHAR(15) NOT NULL,
  image_url        TEXT,
  posted_by        UUID REFERENCES users(id),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ride_type ON ride_requests(ride_type);

-- ─────────────────────────────────────────────
-- RATINGS
-- Lightweight trust signal: anyone can rate the poster of a listing they
-- interacted with (a ride, an event, etc.) once it's marked complete.
-- Not a strict "verified mutual" system — appropriate for a small
-- community app where most coordination happens by phone/WhatsApp anyway.
-- ─────────────────────────────────────────────
CREATE TABLE ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ratee_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- person being rated
  rater_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- person giving the rating
  context_type  VARCHAR(30) NOT NULL,   -- 'ride_request' | 'event'
  context_id    UUID NOT NULL,
  stars         INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_text   VARCHAR(300),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rater_id, context_type, context_id)  -- one rating per person per listing
);
CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);

-- ─────────────────────────────────────────────
-- ACTIVITY_LOGS
-- Records write actions (POST/PUT/DELETE) for admin visibility.
-- Recommended retention: 90 days (auto-cleaned by the server, see server.js).
-- ─────────────────────────────────────────────
CREATE TABLE activity_logs (
  id          SERIAL PRIMARY KEY,
  user_id     UUID,
  phone       VARCHAR(15),
  action      VARCHAR(200) NOT NULL,   -- e.g. 'POST /api/classifieds'
  details     VARCHAR(200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- ERROR_LOGS
-- Server-side errors caught by the global error handler.
-- Recommended retention: 30 days (auto-cleaned by the server, see server.js).
-- ─────────────────────────────────────────────
CREATE TABLE error_logs (
  id           SERIAL PRIMARY KEY,
  message      TEXT,
  path         VARCHAR(200),
  method       VARCHAR(10),
  status_code  INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_error_created ON error_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- FEEDBACK
-- User-submitted feedback, viewable by admins.
-- ─────────────────────────────────────────────
CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  name        VARCHAR(100),
  phone       VARCHAR(15),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- TOURNAMENTS
-- Replaces "Hotels & Mess" on the More Services row. Covers the full
-- organizer workflow: Create → Registration → Approve Teams → Generate
-- Fixtures → Schedule Matches → Enter Results → Points Table → Winner.
--
-- Auto-generated fixtures are only implemented for Round Robin and
-- Knockout — those are well-defined algorithms. Double Elimination and
-- the knockout stage of League + Knockout rely on the organizer manually
-- adding matches (tournament_matches supports that for every format
-- anyway, so it's also how any auto-generated fixture gets corrected).
-- "Live scores" here means match status + final result entry, not a
-- ball-by-ball commentary feed — that's a materially bigger feature this
-- doesn't attempt.
-- ─────────────────────────────────────────────
CREATE TABLE tournaments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   VARCHAR(150) NOT NULL,
  sport                  VARCHAR(30) NOT NULL CHECK (sport IN ('Cricket','Football','Volleyball','Kabaddi','Badminton','Chess','Carrom','Esports','Custom')),
  custom_sport_name      VARCHAR(60),          -- only used when sport = 'Custom'
  participation_type     VARCHAR(30) NOT NULL DEFAULT 'Team'
                           CHECK (participation_type IN ('Individual','Team','Pair / Doubles','Team Event','Individual + Team','Custom')),
  sport_config           JSONB NOT NULL DEFAULT '{}',
                           -- Free-form, sport-specific settings — deliberately JSONB rather than a
                           -- rigid column per sport per field (same pattern as businesses.details
                           -- elsewhere in this app), since each sport needs a different shape:
                           -- Cricket: {players_per_unit, substitutes, overs_format, custom_overs}
                           -- Football: {players_per_unit, substitutes}
                           -- Badminton: {event_type: 'Men''s Singles'|'Doubles'|..., players_per_unit}
                           -- Chess: {participation_mode: 'Individual'|'Team', boards_per_team, substitutes}
                           -- All values are organizer-editable defaults, not hard-coded rules.
  organizer_name         VARCHAR(100),
  location               VARCHAR(200),
  start_date             DATE NOT NULL,
  end_date               DATE,
  registration_deadline  DATE,
  entry_fee              VARCHAR(30),          -- free text, e.g. '₹500 per team' — self-reported, not a real payment
  prize_details          TEXT,
  rules                  TEXT,
  format                 VARCHAR(30) NOT NULL
                           CHECK (format IN ('Knockout','Double Elimination','Round Robin','Group + Knockout','League','Swiss','League + Knockout','Custom')),
                           -- Auto-generated fixtures exist for Round Robin, Knockout, League (same
                           -- engine as Round Robin), and Group + Knockout. Double Elimination and
                           -- Swiss are selectable but rely on the organizer adding matches manually
                           -- (see tournamentController.js's generateFixtures for why — both are
                           -- genuinely complex algorithms where a subtly wrong bracket/pairing is
                           -- worse than no automation at all).
  status                 VARCHAR(30) NOT NULL DEFAULT 'registration_open'
                           CHECK (status IN ('registration_open','registration_closed','fixtures_generated','in_progress','completed')),
  image_url              TEXT,
  posted_by              UUID REFERENCES users(id),
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tournaments_start ON tournaments(start_date);

-- ─────────────────────────────────────────────
-- TOURNAMENT_AGE_CATEGORIES
-- An organizer can define as many as needed (Under 16, Open, 35+, a
-- custom age range, or a birth-year range) — teams register into one.
-- ─────────────────────────────────────────────
CREATE TABLE tournament_age_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  label           VARCHAR(50) NOT NULL,   -- e.g. 'Under 16', 'Open', '35+', or a custom label
  min_age         INT,
  max_age         INT,
  birth_year_min  INT,
  birth_year_max  INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_age_categories_tournament ON tournament_age_categories(tournament_id);

CREATE TABLE tournament_teams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id     UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  age_category_id   UUID REFERENCES tournament_age_categories(id),  -- NULL if the tournament has no age categories
  team_name         VARCHAR(100) NOT NULL,
  captain_name      VARCHAR(100) NOT NULL,
  captain_phone     VARCHAR(15) NOT NULL,
  logo_url          TEXT,
  payment_status    VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','waived')),
  approval_status   VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  registered_by     UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_tournament ON tournament_teams(tournament_id);

CREATE TABLE tournament_players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  role           VARCHAR(60),        -- free text — position/role, sport-agnostic (e.g. 'Bowler', 'Goalkeeper')
  phone          VARCHAR(15),
  jersey_number  VARCHAR(10),
  is_captain     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_players_team ON tournament_players(team_id);

CREATE TABLE tournament_matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id    UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_name       VARCHAR(50) NOT NULL,  -- e.g. 'Round 1', 'League Round 3', 'Semi-Final', 'Final'
  team1_id         UUID REFERENCES tournament_teams(id),
  team2_id         UUID REFERENCES tournament_teams(id),  -- NULL when team1 has a bye
  scheduled_date   DATE,
  scheduled_time   TIME,
  venue            VARCHAR(200),
  status           VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled','rescheduled','cancelled','in_progress','completed')),
  team1_score      VARCHAR(50),   -- free text, sport-agnostic (e.g. '156/4', '2', '3-1')
  team2_score      VARCHAR(50),
  winner_team_id   UUID REFERENCES tournament_teams(id),  -- NULL until decided, stays NULL for a draw
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_matches_tournament ON tournament_matches(tournament_id);
