# Deploying Mythmind to Vercel

This project is configured to deploy on Vercel out of the box. Connect the
GitHub repo to Vercel, add the environment variables below, and push — Vercel
will build with Vite + Nitro's `vercel` preset and serve the TanStack Start
SSR + server functions as Vercel Serverless Functions.

## 1. Vercel project settings

- **Framework preset:** Other (we already ship a `vercel.json`)
- **Build command:** `vite build` (already in `vercel.json`)
- **Output directory:** `.vercel/output` (already in `vercel.json`)
- **Install command:** `bun install` (already in `vercel.json`). If your team
  prefers npm/pnpm, change it in the Vercel dashboard — the lockfile is the
  one Bun writes, so Bun is recommended.
- **Node.js version:** 20.x (pinned in `package.json` and Nitro's Vercel
  output so Vercel does not auto-select a newer unsupported runtime)

## 2. Environment variables

Add these in **Vercel → Settings → Environment Variables**. Set each one for
**Production, Preview, and Development** unless noted otherwise.

### Supabase (Lovable Cloud) — required

| Variable                          | Where to get it                                         | Exposed to browser? |
| --------------------------------- | ------------------------------------------------------- | ------------------- |
| `VITE_SUPABASE_URL`               | Lovable Cloud → Backend → Settings (Project URL)        | Yes (publishable)   |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Lovable Cloud → Backend → Settings (Publishable key)    | Yes (publishable)   |
| `VITE_SUPABASE_PROJECT_ID`        | Lovable Cloud → Backend → Settings (Project ref)        | Yes                 |
| `SUPABASE_URL`                    | Same Project URL                                        | No                  |
| `SUPABASE_PUBLISHABLE_KEY`        | Same Publishable key                                    | No                  |
| `SUPABASE_PROJECT_ID`             | Same Project ref                                        | No                  |
| `SUPABASE_SERVICE_ROLE_KEY`       | Lovable Cloud → Backend → Settings (service-role key)   | **NO — keep secret**|

### AI gateway — required

| Variable           | Where to get it                              |
| ------------------ | -------------------------------------------- |
| `LOVABLE_API_KEY`  | Lovable Cloud → AI Gateway → API keys        |
| `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ → API keys    |

### Tool integrations — required for the matching feature to work

| Variable             | Used for                                | Where to get it                    |
| -------------------- | --------------------------------------- | ---------------------------------- |
| `COMPOSIO_API_KEY`   | Reyes' Composio toolset                 | https://app.composio.dev/          |
| `FIRECRAWL_API_KEY`  | Reyes' web research                     | https://www.firecrawl.dev/         |
| `E2B_API_KEY`        | Reyes' code sandbox + Vale's deck/PDF   | https://e2b.dev/dashboard?tab=keys |
| `AAKASH_SMS_TOKEN`   | Phone-number OTP sign-in (Nepal SMS)    | https://sms.aakashsms.com/         |

If a tool key is missing, the matching feature degrades gracefully (e.g. PDF
falls back to a basic generator when `E2B_API_KEY` is missing), but the rest
of the app keeps working.

### Payments (Dodo Payments) — required if you accept payments

| Variable                    | Notes                                              |
| --------------------------- | -------------------------------------------------- |
| `DODO_API_KEY`              | Dodo dashboard → Developer → API keys              |
| `DODO_ENV`                  | `test` or `live`                                   |
| `DODO_PRODUCT_ID_PRO`       | Product id for the Pro plan                        |
| `DODO_PRODUCT_ID_EVEREST`   | Product id for the Everest plan                    |
| `DODO_WEBHOOK_SECRET`       | Webhook signing secret from Dodo                   |

### Optional

| Variable        | Notes                                                                 |
| --------------- | --------------------------------------------------------------------- |
| `SESSION_SECRET`| Only set if you start using TanStack `useSession` cookies somewhere. |

## 3. Webhooks

After the first successful deploy, configure the Dodo webhook to point at:

```
https://www.mythmind.co/api/public/dodo-webhook
```

(or your Vercel preview URL while testing). Paste the same value into
`DODO_WEBHOOK_SECRET`.

## 4. Custom domain (mythmind.co)

1. In Vercel → Settings → Domains, add `mythmind.co` and `www.mythmind.co`.
2. Vercel will show DNS records to set on your registrar.
3. In **Lovable Cloud → Backend → Auth → URL Configuration**:
   - Site URL: `https://www.mythmind.co`
   - Redirect URLs (one per line):
     - `https://mythmind.co/**`
     - `https://www.mythmind.co/**`
     - `https://*.vercel.app/**` (for preview deploys)
     - `http://localhost:3000/**` (for local dev)
4. In **Google Cloud Console → Credentials → your OAuth client**:
   - Authorised redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
     (also shown in Lovable Cloud → Auth → Google provider).

## 5. Deploy

Push to `main` (or whichever branch Vercel watches). Vercel will:

1. Run `bun install`.
2. Run `vite build` — Vite + Nitro emit `.vercel/output/` (Build Output API v3).
3. Vercel serves the static client from `static/` and the SSR + server
   functions from a Node serverless function.

Server functions, the `/api/chat` streaming endpoint, the `/api/public/*`
webhook routes, OAuth callbacks, and phone OTP via Aakash SMS all run on
Vercel Node serverless — no Cloudflare Worker constraints apply.

## 6. Troubleshooting

- **`Missing Supabase environment variable(s)`** at runtime → one of the
  server `SUPABASE_*` vars is missing. Re-check Step 2.
- **OAuth redirect mismatch** → the URL you signed in from is not in the
  Supabase redirect allowlist. Re-check Step 4.3.
- **`AAKASH_SMS_TOKEN is not configured`** → add the secret in Vercel and
  redeploy.
- **`Invalid API key format: expected "e2b_"`** → your `E2B_API_KEY` is
  wrong or unset; PDF/deck features that need the code sandbox will fall
  back to the basic PDF generator until it's fixed.
- **Webhooks return 401** → the `DODO_WEBHOOK_SECRET` in Vercel does not
  match the one configured in Dodo dashboard.
