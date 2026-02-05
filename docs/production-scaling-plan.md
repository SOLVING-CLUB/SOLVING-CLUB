# Production Scaling Plan

This plan turns the checklist into actionable tasks. Fill in owners/dates as you assign.

## P0 (This Week)
1. Add client‑side retry with exponential backoff + jitter for 5xx/timeouts.  
   Owner: TBD | Due: TBD
2. Deduplicate in‑flight requests to avoid bursts.  
   Owner: TBD | Due: TBD
3. Reduce fan‑out on Projects page (load list first, lazy‑load per project).  
   Owner: TBD | Due: TBD
4. Confirm RLS policies do not recurse (projects/members).  
   Owner: TBD | Due: TBD

## P1 (Next 2 Weeks)
1. Add caching for hot lists (projects, profiles) with short TTL.  
   Owner: TBD | Due: TBD
2. Add server‑side rate limits for write‑heavy endpoints.  
   Owner: TBD | Due: TBD
3. Add error monitoring (Sentry/Datadog) for frontend.  
   Owner: TBD | Due: TBD
4. Add realtime fallback (disable non‑critical channels on error).  
   Owner: TBD | Due: TBD

## P2 (Next Month)
1. Introduce materialized views for heavy dashboards.  
   Owner: TBD | Due: TBD
2. Add background queues for exports, notifications, file ops.  
   Owner: TBD | Due: TBD
3. Build internal load tests for key flows.  
   Owner: TBD | Due: TBD

## Operational Metrics
- API error rate
- P95 latency
- DB CPU/IO
- Realtime disconnect rate
- Frontend error rate

When you want, I can fill in owners/dates and convert this into a GitHub issue list.
