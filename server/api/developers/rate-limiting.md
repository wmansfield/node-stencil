# API Rate Limiting

Identity-based rate limiting protects the API from abuse and runaway clients. Limits are **per user** (JWT `sub`) for authenticated endpoints and **per IP** for public/unauthenticated endpoints.

## How it works

- **Guard + decorator:** Use `@RateLimit({ points, duration })` and `@UseGuards(RateLimitGuard)` on any endpoint (see `backend/src/shared/access-control/rate-limit.*`). Key = JWT `sub` when authenticated, or real client IP when unauthenticated.
- **IP resolution (Cloudflare):** Behind Cloudflare, the guard reads `CF-Connecting-IP` (set/overwritten by Cloudflare, not spoofable). Falls back to `X-Forwarded-For` first entry, then `request.ip` for local dev.
- **Store:** Redis when `REDIS_URL` is set (shared across instances); in-memory when unset (per-instance only). Same (points, duration) limiters are reused per endpoint config.
- **Fail-open:** On Redis errors we allow the request and log a warning; limits are not enforced until Redis recovers.
- **Federation:** When Region A calls Region B via API, identify server-to-server calls and exempt them or use a separate bucket so only end-user requests count against the user.

## Configuration

- **REDIS_URL** — Optional. When set, rate limits use Redis (shared). When unset, in-memory store is used (single-instance behavior).
- Limits are **per endpoint** (each route has its own bucket per user). Duration is in seconds; `points` = number of requests allowed in that window.

## Deployment (Redis)

The Fargate stack creates an ElastiCache Redis instance (single node, `cache.t4g.micro`, Redis 7) in the same VPC. After deploying, get the `RedisUrl` from stack outputs and set `REDIS_URL=<value>` in the backend environment secrets.

**Note:** ElastiCache subnet group requires at least 2 subnets in different AZs. If Redis is omitted, leave `REDIS_URL` unset; the API uses in-memory rate limiting per task.

## Limits by area (requests per 60 seconds)

| Area                  | Endpoint        | Limit   | Notes                           |
| --------------------- | --------------- | ------- | ------------------------------- |
| **Auth**              | self            | 20      | Session / launch                |
|                       | register        | 10      | One-time; strict                |
| **Media**             | prepare         | 30      | Init upload                     |
|                       | complete        | 30      | Finalize upload                 |
| **Profile**           | avatar, name    | 30 each | Account edits                   |
| **Public (IP-based)** | health          | 120     | Docker/ALB polling; generous    |
|                       | platform/health | 30      | Detailed health; ops/monitoring |

## Redis: latency and outages

- **Latency:** ~1–5 ms typical (same region). One or two Redis ops per request.
- **Outage behavior:** We **fail open** (allow request, log warning). Fail closed is not used for rate limiting.

## Reference: alternatives not used

- **In-memory only:** No Redis; zero cost but per-instance limits (user gets N× limit with N tasks). Used automatically when `REDIS_URL` is unset.
- **Cloudflare (edge):** IP-based or Worker + header for identity. Optional complement for unauthenticated routes; we rely on in-app identity limits.
- **Redis cost:** Upstash (serverless) or ElastiCache (e.g. cache.t4g.micro ~$12–15/mo) when you need shared limits.
