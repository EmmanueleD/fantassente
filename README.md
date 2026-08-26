# excel-assente-fantacalcio

Proxy-bidder webapp for a Fantacalcio live auction.

Status: scaffold + pure bidding logic only (PR1). Auth, Supabase wiring,
and `/setup` / `/auction` UI land in later PRs.

## Sections (placeholders, filled in the final delivery slice)

- Local setup
- Supabase configuration
- Environment variables — see `.env.example`; `SUPABASE_SERVICE_ROLE_KEY`
  must never reach the client or be prefixed `NEXT_PUBLIC_`.
- Deployment
