# Ideal ICP

Diagnostic tool at [idealicp.com](https://idealicp.com). B2B marketing teams answer a short questionnaire and get a scored ICP health report with ranked fixes, reviewed by a media buyer.

**Stack:** Next.js 14 (App Router), Supabase (Postgres + Auth), Anthropic Claude, Paystack (KES), Resend, hosted on Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key (login codes) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database access. Never expose to the browser |
| `JWT_SECRET` | Signs the `icp_session` login cookie |
| `ANTHROPIC_API_KEY` | AI diagnosis, briefings, chat |
| `PAYSTACK_SECRET_KEY` | Payments and webhook signature check |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack client key |
| `RESEND_API_KEY` | Transactional email |
| `CRON_SECRET` | Vercel sends this to `/api/cron/*`; requests without it are rejected |
| `ADMIN_SECRET` | `x-admin-key` header for `/api/admin/*` and `/api/email/send` |
| `NEXT_PUBLIC_APP_URL` | Public site URL, e.g. `https://idealicp.com` |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container (GTM-PPF3ZCLQ). All pixels live in GTM. Funnel steps are pushed to `dataLayer`: `landing_view`, `questionnaire_started`, `questionnaire_completed`, `report_viewed`, `call_requested`, `checkout_started`, `purchase` |
| `NEXT_PUBLIC_BUYER_CALENDAR_URL` | Optional. Booking link for media buyer review calls |
| `RE_ENGAGE_DELAY_HOURS`, `RE_ENGAGE_REPEAT_DAYS` | Optional. Timing for the re-engagement emails |

Missing Supabase variables now fail loudly at runtime instead of silently.

## How it fits together

- **Login:** email one-time code (`/api/auth/send-otp`, `/api/auth/verify-otp`) or Google (`/api/auth/callback`). Only those routes issue a 30-day session. Accounts created from the questionnaire get a 2-hour unverified session.
- **Diagnosis:** `/questionnaire` saves answers (`/api/questionnaire`), then `/api/diagnostic` runs Claude. Limits come from the questionnaire owner's plan, one diagnosis per questionnaire, max 5 new diagnoses per IP per day.
- **Payments:** every Paystack charge is recorded in `paystack_payments` with the amount and tier the server chose. `/api/paystack/verify` and the webhook each claim a payment once and ignore Paystack metadata.
- **Crons** (`vercel.json`): reminders and plan expiry, weekly intelligence, smart alerts, post-diagnosis follow-up, re-engagement.

## Database

Schema changes live in `supabase/migrations/`. Apply new ones in the Supabase SQL editor (or with the Supabase CLI) **before** deploying code that depends on them. Row Level Security is on for every table with no public policies, so all access goes through the server.

## Deploying

Push or merge to `main`. Vercel builds production from `main`, and every other branch gets a preview URL.
