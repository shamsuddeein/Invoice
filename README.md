# Invoice & Receipt App

A private, single-user invoicing app for a Nigerian business: manage clients, create
invoices with line items, record full or partial payments (statuses update
automatically), and download branded **PDF** and **PNG** invoices and receipts — the PNG
is sized for sharing on WhatsApp.

Built with Next.js 14 (App Router, JavaScript), Turso/libSQL + Drizzle ORM, NextAuth v5
(single owner login), `@react-pdf/renderer` (PDF) and `html2canvas` (PNG). Design system:
an indigo/purple `#6366F1` accent on a light UI, **mobile-first** (bottom tab bar + center
"new" button) scaling up to a desktop sidebar, DM Sans for text, DM Mono for all money and
numbers.

---

## 1. Run it locally

You need **Node 20+** and **npm**.

```bash
npm install
```

Create your local environment file from the template:

```bash
cp .env.example .env.local
```

For local development you can leave the Turso lines as-is and just set a database URL to a
local file. A minimal working `.env.local` for local use:

```
TURSO_DATABASE_URL=file:local.db
AUTH_SECRET=<paste a random string>
NEXTAUTH_SECRET=<paste the same random string>
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
OWNER_USERNAME=admin
OWNER_PASSWORD=<choose a strong password>
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the database tables and the single settings row:

```bash
npm run db:push
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000 and log in with the `OWNER_USERNAME` / `OWNER_PASSWORD` you set.

First stop: **Settings** — enter your business name, contact details, bank details (these
print on invoices/receipts), an optional **logo** (PNG/JPEG, embedded on every document),
tax rate, and the invoice/receipt number prefixes.

---

## 2. How it works (quick tour)

- **Dashboard** — total revenue, collected this month, and outstanding, plus your most
  recent invoices.
- **Clients** — add/edit/delete clients. A client with invoices can't be deleted until
  those invoices are removed.
- **Invoices** — create with multiple line items (totals calculate live), save as a draft
  or mark as sent. Invoice numbers auto-generate as `INV-2026-001`, `INV-2026-002`, … Each
  invoice carries a single **issue date**.
- **Payments** — record full or partial payments against an invoice. Status moves to
  `partially_paid` then `paid` automatically; each payment gets a receipt number
  (`RCPT-2026-001`, …). The Payments page is a ledger of everything received.
- **Documents** — from any invoice (or a payment's receipt) download a branded **PDF** or
  **PNG**. The PNG is rendered at 2× for crisp sharing on WhatsApp.

Money always shows the ₦ symbol with no kobo decimals; dates display as DD/MM/YYYY.

---

## 3. Deploy to production (Vercel + Turso)

The app is ready to deploy; you run the deployment yourself.

### a. Create a Turso database

1. Install the Turso CLI and sign in (see https://docs.turso.tech).
2. Create a database and get its URL and an auth token:
   ```bash
   turso db create invoice-app
   turso db show invoice-app --url          # → libsql://invoice-app-<you>.turso.io
   turso db tokens create invoice-app       # → the auth token
   ```
3. Create the tables in the remote database from your machine:
   ```bash
   TURSO_DATABASE_URL=libsql://invoice-app-<you>.turso.io \
   TURSO_AUTH_TOKEN=<token> \
   npm run db:push

   TURSO_DATABASE_URL=libsql://invoice-app-<you>.turso.io \
   TURSO_AUTH_TOKEN=<token> \
   npm run db:seed
   ```

### b. Deploy on Vercel

1. Push this project to a GitHub repo and import it into Vercel (framework preset:
   **Next.js** — no extra config needed).
2. In the Vercel project's **Environment Variables**, add all of the variables listed in
   section 4 (using the Turso URL + token from above, a fresh secret, your production
   `NEXTAUTH_URL`, and your owner login).
3. Deploy. After the first deploy, open the site and log in.

`local.db` is git-ignored and never leaves your machine — production uses Turso only.

---

## 4. Environment variables

| Variable | Required | What it is |
|---|---|---|
| `TURSO_DATABASE_URL` | yes | `file:local.db` for local dev; `libsql://…turso.io` in production |
| `TURSO_AUTH_TOKEN` | prod only | Turso database token (omit for the local file) |
| `AUTH_SECRET` | yes | Random 32-byte string used to sign sessions |
| `NEXTAUTH_SECRET` | yes | Set to the same value as `AUTH_SECRET` |
| `NEXTAUTH_URL` | yes | The app's base URL (`http://localhost:3000` in dev, your domain in prod) |
| `AUTH_TRUST_HOST` | yes | `true` (required behind Vercel's proxy) |
| `OWNER_USERNAME` | yes | The one login username |
| `OWNER_PASSWORD` | yes | The one login password — choose a strong one |

There is no sign-up. The single login is whatever you set in `OWNER_USERNAME` /
`OWNER_PASSWORD`; change the password by updating the env var and redeploying.

---

## 5. Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run db:push` | Create/update database tables from the schema |
| `npm run db:seed` | Insert the single settings row (id=1) if missing — safe to re-run |
| `npm run db:generate` | Generate SQL migration files from the schema (optional) |
| `npm run db:migrate` | Apply generated migrations (alternative to `db:push`) |

---

## 6. Notes

- **PDF/PNG generation is client-side.** `@react-pdf/renderer` and `html2canvas` load only
  in the browser when you click a download button, so they never run on the server.
- **A build warning about `jose` / Edge Runtime is expected and harmless.** It comes from
  NextAuth's encrypted-JWT code path, which this app doesn't use (sessions are signed, not
  encrypted). The build succeeds and login works normally.
- **Invoice status is managed for you.** Recording payments moves an invoice to
  `partially_paid` then `paid` automatically; you can't move a paid invoice back to draft —
  the app manages those transitions.

# Invoice
