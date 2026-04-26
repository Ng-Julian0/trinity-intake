# Trinity Solutions — Vercel Setup Guide

## File Structure
```
trinity-intake/
├── api/
│   └── send-intake-email.js   ← Vercel serverless function (Node.js, no Deno)
├── src/
│   ├── main.jsx               ← React entry point
│   └── Insurance.jsx          ← The form (unchanged UI)
├── index.html
├── vite.config.js
├── package.json
└── .env                       ← created from .env.example
```

---

## 1. One-time: Supabase Database Setup
You're already linked to project `bgqxfueqvbtulecshymc`.
Go to **Supabase Dashboard → SQL Editor → New Query**, paste `schema.sql`, hit Run.

---

## 2. Install dependencies
```bash
npm install
```

---

## 3. Create your .env file
Copy `.env.example` to `.env` and fill in your keys:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` → Supabase → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase → Settings → API (service_role key, keep secret)
- `RESEND_API_KEY` → resend.com dashboard
- `FROM_EMAIL` → must be a verified domain in Resend (use `onboarding@resend.dev` for testing)

---

## 4. Run locally
```bash
npm run dev
```
The form opens at `http://localhost:5173`.
The `/api/send-intake-email` route runs automatically via Vite's dev proxy.

---

## 5. Deploy to Vercel (one time)

### Option A: GitHub (recommended)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Vercel auto-detects Vite — no config needed
4. Add all env vars under **Settings → Environment Variables** (the non-VITE_ ones too)
5. Click Deploy — done

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```
Then add env vars in the Vercel dashboard.

---

## How it works after deploy

```
User fills form → clicks Submit
  │
  ├─ 1. Photos uploaded to Supabase Storage (intake-photos bucket)
  ├─ 2. Form data saved to Supabase Postgres (submissions table)
  └─ 3. POST /api/send-intake-email
          ├─ Fetch submission from DB
          ├─ Generate PDF (pdf-lib)
          └─ Send email via Resend
                ├─ HTML body with embedded photos
                └─ PDF attachment
```

No Deno. No Supabase CLI after initial setup. Just push to GitHub and Vercel handles the rest.
