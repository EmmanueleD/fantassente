# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jabu is the primary user. He is physically present during a live Fantacalcio auction and needs to act as Miglio's proxy without seeing Miglio's secret strategy.

Miglio is the secondary user. Before the auction, he records his candidate strategy while absent from the live event.

## Product Purpose

Fantacalcio Proxy Bidder is a private, single-use web tool for today's live auction. It lets Miglio preload a secret bidding strategy and lets Jabu query that strategy during the auction to receive only an actionable verdict and next bid.

The product is expected to be deleted after the auction, so long-term extensibility and broad product positioning are non-goals.

## Positioning

This is a purpose-built proxy-bidding tool for one Fantacalcio auction, optimized for secrecy and live-use practicality rather than reusable product growth.

## Operating Context

Jabu uses `/auction` during the live draft to check player names, receive bidding guidance, register purchases, and monitor Miglio's roster and budget.

Miglio uses `/setup` before the auction to enter candidates, maximum prices, priorities, and slot-specific strategy. Miglio accesses the app through `/m`.

The root route redirects users based on their role session cookie: `miglio` to `/setup`, `jabu` to `/auction`, and unauthenticated users to `/login`.

## Capabilities and Constraints

- The interface language is Italian.
- Miglio's access password is hardcoded as `m` by design.
- Jabu's password is configured through the server-only `JABU_PASSWORD` environment variable.
- Session cookies are signed with `SESSION_SECRET`.
- Supabase is used as the backing store with server-only access through the service role key.
- The app must not expose Miglio's secret `max_price` or `priority` values to Jabu or to the browser.
- `/auction` must fetch only client-safe candidate fields for autocomplete.
- Bid-check responses must expose only the verdict/status and next bid, never upstream strategy fields.
- Purchases must respect filled-slot and budget-reserve constraints.
- The project is intentionally short-lived and may be removed after the auction.

## Brand Commitments

The product name and domain language are tied to Fantacalcio auction terminology. Existing role names, route names, and Italian UI labels should be preserved unless the user explicitly changes them.

## Evidence on Hand

- `README.md` documents the product purpose, roles, setup, Supabase requirements, deployment flow, and secrecy-critical architecture.
- `app/auction/page.tsx` implements the Jabu auction surface and explicitly avoids fetching `max_price` and `priority`.
- `app/setup/page.tsx` implements the Miglio strategy setup surface.
- `app/m/page.tsx` implements Miglio's dedicated access path.
- `lib/bidding/evaluate-bid.ts` contains the pure bid-evaluation algorithm.
- `tests/evaluate-bid.test.ts` and `tests/bid-check-contract.test.ts` cover bidding behavior and response secrecy.
- `supabase/schema.sql` defines the database schema and security posture.

No public marketing claims, testimonials, customer evidence, or reusable brand assets are established.

## Product Principles

1. Preserve secrecy over convenience: Jabu must never receive or infer Miglio's hidden prices or priorities from app responses or client data.
2. Optimize for live auction speed: the primary surface should keep decisions fast, direct, and low-friction under time pressure.
3. Keep the tool private and disposable: avoid product-growth complexity that does not help today's auction.
4. Make state explicit: roster, purchases, remaining budget, and filled slots should stay visible enough for Jabu to avoid mistakes.
5. Preserve existing Italian Fantacalcio terminology unless there is a concrete reason to change it.
