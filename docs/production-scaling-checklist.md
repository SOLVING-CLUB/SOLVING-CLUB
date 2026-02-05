# Production Scaling Checklist

Use this as a quick, practical guide for keeping the app stable under load. The sections below follow a "fix the biggest bottleneck first" order.

## 1) Database & Query Optimization
1. Add indexes for all columns used in `where`, `join`, and `order by`.
2. Run `EXPLAIN ANALYZE` for any query above ~100ms.
3. Avoid heavy joins in hot paths; precompute with views/materialized views when needed.
4. Keep payloads small:
   - Select only the columns you need.
   - Paginate early and consistently.
5. Re-check RLS policies for recursion or cross-table loops.

## 2) Architecture & Resource Management
1. Offload long tasks to background workers or Edge Functions.
2. Add caching for hot reads (Redis/Memcached):
   - Cache lists and summaries.
   - Use short TTLs for frequently changing data.
3. Add connection and rate limits at the API boundary.
4. Add request deduping and throttling on the client.

## 3) Realtime & Subscriptions
1. Subscribe to **scoped** channels (`project_id`, `room_id`) rather than global tables.
2. Use backoff and jitter on reconnect.
3. Disable realtime for non-critical data if the backend is under pressure.

## 4) Monitoring & Observability
1. Track DB load, API latency, error rates, and 5xx rates.
2. Use Supabase Logs Explorer + Query Performance.
3. Add client-side error monitoring (Sentry/Datadog).
4. Alert on rising error/latency thresholds.

## 5) UI Degradation Strategy
1. Show partial data instead of failing the whole page.
2. Add section-level retry buttons.
3. Cache the last known data and show it during failures (stale-while-revalidate).

---

## Implementation Guide (Practical Actions)
1. **Identify hot queries**:
   - Run `EXPLAIN ANALYZE` on all project list, task list, and notification queries.
2. **Add caching**:
   - Cache project list and profile summaries for 30–60 seconds.
3. **Add client resiliency**:
   - Retry network errors with exponential backoff + jitter.
   - Deduplicate concurrent requests.
4. **Limit fan-out**:
   - Load project list first, then lazy-load tasks/members per project.
5. **Realtime hardening**:
   - If realtime errors persist, disable non-critical channels temporarily.

If you want, I can turn this into a task list with assigned owners and dates.
