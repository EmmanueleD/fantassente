# excel-assente-fantacalcio

Proxy-bidder webapp for a Fantacalcio live auction: Miglio (absent) registers a
secret bidding strategy ahead of time (`/setup`), Jabu (present at the draft)
queries it live during the auction (`/auction`) and gets back only a verdict
and a next bid — never the underlying secret price or priority.

Status: feature-complete (PR1–PR4, all 8 implementation slices landed on `main`).

## Local setup

```bash
npm install
npm run dev
```

The app boots without any Supabase env vars set (the Supabase client is a lazy
singleton that only fails when actually used), but no page will function
correctly until you configure a Supabase project and the environment
variables below.

Other useful scripts: `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`.

## Supabase setup

1. Create a new Supabase project (free tier is sufficient).
2. Open the project's **SQL Editor** and run the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql). The script is idempotent
   (`create table if not exists`, `on conflict do nothing`) so it is safe to
   re-run.
3. This creates three tables (`candidates`, `purchases`, `app_config`), a
   seeded singleton config row, and locks down Row Level Security with zero
   permissive policies plus column-level grants — see the schema file and the
   design notes inside it for the full rationale. The app never uses the
   Supabase anon key or a browser-side Supabase client; RLS/grants are
   defense-in-depth, not the load-bearing secrecy control.
4. Copy the project's **Project URL** and **service_role key** (Project
   Settings → API) — you'll need them for the environment variables below.

## Environment variables

Copy `.env.example` to `.env.local` (for local dev) and fill in all five
variables:

| Variable | Purpose |
|---|---|
| `MIGLIO_PASSWORD` | Miglio's login secret (server-only). |
| `JABU_PASSWORD` | Jabu's login secret (server-only). |
| `SESSION_SECRET` | HMAC-SHA256 key for signing the role session cookie. Use ≥32 random bytes, e.g. `openssl rand -base64 32`. |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase **service role** key. |

**`SUPABASE_SERVICE_ROLE_KEY` must never be prefixed `NEXT_PUBLIC_` and must
never be exposed to the client.** It is the only Supabase credential this app
uses, it bypasses Row Level Security, and it is read exclusively from
server-only modules (`lib/supabase/server-client.ts`, guarded by the
`server-only` package which throws a build error if ever imported from a
Client Component). There is no `NEXT_PUBLIC_SUPABASE_*` variable anywhere in
this project — no browser-side Supabase client exists.

## Deployment (Vercel)

1. Import the repository into a new Vercel project (framework preset:
   Next.js — auto-detected).
2. In **Project Settings → Environment Variables**, add all five variables
   from the table above for both the Production and Preview environments.
3. `middleware.ts` declares `export const runtime = "nodejs"` because session
   verification uses Node's `crypto` module (HMAC + timing-safe comparison).
   Vercel supports the Node.js middleware runtime; no extra configuration is
   required, but if you fork/adapt this project onto a platform that only
   supports the Edge runtime for middleware, you will need to port
   `lib/auth/session.ts` to Web Crypto first.
4. Deploy. On first request, `/` redirects by role cookie: `miglio` → `/setup`,
   `jabu` → `/auction`, no session → `/login`.

## Architecture notes

See the project's SDD design artifact for the full technical rationale
(directory layout, auth design, RLS/grants reasoning, bidding algorithm,
testing plan). In short:

- `lib/bidding/evaluate-bid.ts` is a pure function with zero dependencies
  beyond `lib/types.ts`/`lib/slots.ts`/`lib/normalize.ts` — it is the single
  source of truth for the bid-evaluation algorithm and is covered by
  `tests/evaluate-bid.test.ts` (all 7 mandatory acceptance cases plus edge
  cases).
- `app/api/bid/check/route.ts` is the secrecy-critical boundary: its response
  is always constructed field-by-field (`{status, nextBid}`), never spread
  from an upstream object, and this is proven by an adversarial "pollution"
  test in `tests/bid-check-contract.test.ts` that mocks the service layer to
  return extra/leaked fields and asserts they never reach the HTTP response.
- `app/api/purchase/route.ts` + `lib/purchases/purchase-service.ts` implement
  slot assignment: reject an already-filled slot (`409 SLOT_FILLED`), reject a
  price above the budget-reserve-adjusted ceiling (`422
  PRICE_EXCEEDS_BUDGET`, returning the safe, publicly-derivable
  `maxAffordable`), and translate a unique-constraint race (two simultaneous
  assignment attempts for the same slot) into the same `409` response.
- `/auction`'s Server Component (`app/auction/page.tsx`) selects only
  `slot, player_name` from `candidates` — `max_price` and `priority` are
  never fetched on this code path, so the client-side autocomplete index is
  structurally incapable of leaking Miglio's secret prices.
