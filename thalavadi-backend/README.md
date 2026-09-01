# Thalavadi Directory — Architecture & Setup

## 1. System overview

```
┌────────────────────┐        HTTPS / JSON        ┌───────────────────────┐
│   Mobile App        │ ─────────────────────────▶ │   Express API Server  │
│ (React Native app,  │ ◀───────────────────────── │   (Node.js)           │
│  or the web mockup) │        JWT bearer auth      └──────────┬────────────┘
└────────────────────┘                                          │
                                                                  │ SQL (node-postgres)
                                                                  ▼
                                                        ┌───────────────────┐
                                                        │   PostgreSQL DB    │
                                                        │ users, otp_codes,  │
                                                        │ categories,        │
                                                        │ businesses         │
                                                        └───────────────────┘
```

**Why this stack:** Postgres gives relational integrity between categories and
businesses and full-text search out of the box; Express is minimal and easy to
extend; JWT keeps the API stateless so it scales horizontally without a
session store.

## 2. Open-source components

Every piece of this stack is free and open source — nothing here requires a
paid SaaS account:

| Component      | License    | Role                              |
|-----------------|-----------|------------------------------------|
| Node.js         | MIT        | JavaScript runtime                |
| Express          | MIT        | HTTP framework                    |
| PostgreSQL       | PostgreSQL License (permissive) | Database        |
| node-postgres (`pg`) | MIT   | Postgres driver                   |
| jsonwebtoken     | MIT        | JWT signing/verification          |
| Nodemailer       | MIT        | Email OTP delivery                |
| Kannel           | GPL v2     | Self-hosted SMS gateway (optional)|
| Docker / Compose | Apache 2.0 | Local dev + deployment            |

## 3. Folder structure

```
thalavadi-backend/
├── db/
│   ├── schema.sql        # table definitions
│   └── seed.sql          # sample categories & businesses
├── src/
│   ├── config/db.js      # PostgreSQL connection pool
│   ├── controllers/      # request handlers (business logic)
│   ├── middleware/       # auth guard, error handler
│   ├── routes/           # route → controller wiring
│   ├── utils/            # jwt.js, otp.js
│   └── server.js         # app entry point
├── .env.example
├── docker-compose.yml     # Postgres + API for local dev
├── Dockerfile
└── package.json
```

## 4. Data model

| Table         | Purpose                                                   |
|---------------|------------------------------------------------------------|
| `users`       | One row per verified phone number. `role` is `user` or `admin`. |
| `otp_codes`   | Short-lived login codes, expire after `OTP_EXPIRY_MINUTES`. |
| `categories`  | The dashboard tiles (Hospitals, Restaurants, ...).         |
| `businesses`  | Listings, each tied to one category.                       |
| `favorites`   | Optional — lets a logged-in user save businesses.           |

See `db/schema.sql` for full column definitions, indexes, and foreign keys.

## 5. Authentication flow (OTP-based, no passwords)

1. `POST /api/auth/send-otp { phone }` — generates a 4-digit code, stores it
   in `otp_codes` with a 5-minute expiry, and delivers it through an
   open-source channel (`utils/otp.js`), selected by `OTP_CHANNEL`:
   - **`kannel`** (default) — [Kannel](https://www.kannel.org) is a free,
     open-source SMS gateway you self-host on a Linux box with a GSM
     modem/SIM (or an SMPP-speaking provider). No SaaS lock-in.
   - **`email`** — sends the code by email via
     [Nodemailer](https://nodemailer.com) (MIT-licensed) against any SMTP
     server, including a self-hosted one like Postfix.
   - If neither is configured, it logs the code to the console so the login
     flow is fully testable with zero external services.
2. `POST /api/auth/verify-otp { phone, code }` — validates the code, creates
   the user row if it's their first login, and returns a JWT.
3. The app stores the JWT and sends it as `Authorization: Bearer <token>` on
   every subsequent request.
4. `GET /api/auth/me` returns the logged-in user's profile.

Rate limiting (`express-rate-limit`) caps OTP requests at 5 per 15 minutes per
IP to prevent SMS-cost abuse.

## 6. API reference

| Method | Endpoint                              | Auth       | Description                          |
|--------|----------------------------------------|-----------|---------------------------------------|
| POST   | `/api/auth/send-otp`                  | none       | Send OTP to a phone number            |
| POST   | `/api/auth/verify-otp`                | none       | Verify OTP, returns JWT               |
| GET    | `/api/auth/me`                        | user       | Current user profile                  |
| GET    | `/api/categories`                     | none       | List all categories + listing counts  |
| POST   | `/api/categories`                     | admin      | Create a category                     |
| GET    | `/api/categories/:slug/businesses`    | none       | List businesses in a category (`?search=`) |
| GET    | `/api/businesses/:id`                 | none       | Single business detail                |
| POST   | `/api/businesses`                     | admin      | Add a business                        |
| PUT    | `/api/businesses/:id`                 | admin      | Edit a business                       |
| DELETE | `/api/businesses/:id`                 | admin      | Remove a business                     |

## 7. Running it locally

**Option A — Docker (recommended):**
```bash
cp .env.example .env
docker compose up --build
```
This starts Postgres (auto-loading `schema.sql` and `seed.sql`) and the API on
`http://localhost:4000`.

**Option B — Manual:**
```bash
# 1. Create the database and load the schema
createdb thalavadi
psql thalavadi -f db/schema.sql
psql thalavadi -f db/seed.sql

# 2. Configure and run the API
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
npm install
npm run dev
```

## 8. Connecting the mobile app

Replace the mock data in the frontend with real API calls, for example:

```js
const res = await fetch(`${API_BASE_URL}/api/categories`);
const categories = await res.json();

const res2 = await fetch(`${API_BASE_URL}/api/categories/hospitals/businesses`);
const listings = await res2.json();
```

For login, call `send-otp` then `verify-otp`, store the returned `token`, and
attach it as a Bearer token on requests that need it.

## 9. Suggested next steps

- Turn the current React mockup into React Native (or Flutter) using these
  same endpoints.
- Add image uploads for business photos (S3 or Cloudinary + `image_url`).
- Add a simple admin web panel for adding/editing businesses.
- Add the `favorites` feature (table already included) for logged-in users.
