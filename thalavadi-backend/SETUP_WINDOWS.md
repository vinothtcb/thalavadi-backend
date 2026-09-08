# Running Thalavadi Directory on Windows — Step by Step

## Part 1 — Install prerequisites

1. **Docker Desktop** (runs Postgres + the API without installing them separately)
   - Download: https://www.docker.com/products/docker-desktop/
   - Run the installer, accept defaults, restart your laptop when it asks.
   - Docker Desktop requires WSL 2 — if it prompts you to install WSL, click
     yes and let it finish, then reboot again.
   - Open Docker Desktop and make sure it says "Engine running" (green) before
     continuing.

2. **Node.js LTS** (needed to run the frontend, and useful for testing)
   - Download: https://nodejs.org (choose the **LTS** version)
   - Run the installer with default options.
   - Verify it worked — open **PowerShell** and run:
     ```powershell
     node -v
     npm -v
     ```
     Both should print version numbers.

3. **A code editor** (optional but helpful) — VS Code: https://code.visualstudio.com

4. **Postman** (optional, for testing the API without writing code)
   - Download: https://www.postman.com/downloads/

## Part 2 — Get the project onto your laptop

1. Unzip `thalavadi-backend.zip` somewhere easy to find, e.g. `C:\Projects\thalavadi-backend`.
2. Open **PowerShell** and go to that folder:
   ```powershell
   cd C:\Projects\thalavadi-backend
   ```

## Part 3 — Configure environment variables

1. Copy the example env file:
   ```powershell
   copy .env.example .env
   ```
2. Open `.env` in a text editor and set a real `JWT_SECRET` — any long random
   string works, for example:
   ```
   JWT_SECRET=change_this_to_something_long_and_random_39fj29fj2
   ```
3. Leave SMTP settings blank for now — with nothing configured, OTP
   codes will just print to the terminal, which is perfect for local testing.

## Part 4 — Start the backend

1. In the same PowerShell window, run:
   ```powershell
   docker compose up --build
   ```
2. Wait for the logs to settle — you should see:
   ```
   Thalavadi API running on port 4000
   ```
3. Leave this window open — it's your running server. Closing it stops the app.

4. **Check it worked**: open a browser to
   http://localhost:4000/health — you should see `{"status":"ok"}`.

## Part 5 — Test the API

Open a **second** PowerShell window (keep the first one running the server)
and try these:

```powershell
# List categories
curl http://localhost:4000/api/categories

# Send an OTP (watch the first PowerShell window — the code prints there)
curl -X POST http://localhost:4000/api/auth/send-otp `
  -H "Content-Type: application/json" `
  -d '{\"phone\":\"9876543210\"}'

# Verify it (replace 1234 with the code that printed in the server logs)
curl -X POST http://localhost:4000/api/auth/verify-otp `
  -H "Content-Type: application/json" `
  -d '{\"phone\":\"9876543210\",\"code\":\"1234\"}'
```

The verify step should return a `token` — that confirms login works end to end.
(If `curl` gives you trouble with the quoting above, do the same three
requests in Postman instead — it's easier on Windows.)

## Part 6 — Run the mobile app frontend

The frontend is a single React component. To preview it in a browser on your
laptop:

1. Create a React project with Vite:
   ```powershell
   cd C:\Projects
   npm create vite@latest thalavadi-app -- --template react
   cd thalavadi-app
   npm install
   npm install lucide-react
   ```
2. Replace the contents of `src\App.jsx` with the code from
   `thalavadi-directory.jsx` (the file shared earlier in this chat).
3. Start it:
   ```powershell
   npm run dev
   ```
4. Open the URL it prints (usually http://localhost:5173) in your browser.

5. To make the app use your real backend instead of the sample data, replace
   the hard-coded `CATEGORIES` array with a `fetch("http://localhost:4000/api/categories")`
   call — see section 8 of `README.md` for the exact snippet.

## Part 7 — Before publishing, change these

- [ ] Set a strong, unique `JWT_SECRET` (never reuse the example one).
- [ ] Set real SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) —
      don't ship with OTPs only printing to a console.
- [ ] Change the Postgres password in `docker-compose.yml` / `.env` from
      `postgres` to something strong, or use a managed database.
- [ ] Set `NODE_ENV=production` and run behind HTTPS (e.g. a reverse proxy
      like Caddy or Nginx, or a platform that terminates TLS for you).
- [ ] Review the rate limit in `authRoutes.js` — tune it for your expected
      traffic.
- [ ] Point the frontend's API calls at your real deployed backend URL
      instead of `localhost`.

## Troubleshooting

- **"docker compose" not recognized** — you have an older Docker Desktop;
  use `docker-compose up --build` (with a hyphen) instead.
- **Port 4000 or 5432 already in use** — another program is using it; either
  stop that program or change the port in `docker-compose.yml`.
- **WSL 2 errors on Docker startup** — run `wsl --update` in PowerShell
  (as Administrator), then restart Docker Desktop.
