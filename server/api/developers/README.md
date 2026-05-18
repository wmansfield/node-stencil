# Production Architecture

This document describes the full production topology the API is designed to support.

## Overview

The API is a multi-jurisdiction NestJS backend with a React admin frontend. In full production mode it runs as independent federated services across multiple AWS regions, each owning its own database and handling its own jurisdiction's traffic.

## Topology

```
                              ┌────────────────────────────┐
                              │   Cloudflare (WAF + DNS)   │
                              │  SSL: Full (Strict)        │
                              └────────────┬───────────────┘
                                           │ HTTPS (edge TLS)
    ┌──────────┬──────────┬────────────────┼──────────┬──────────┐
 admin.*    api-us.*   api-ca.*        api-uk.*    api-eu.*
    │          │          │                │          │
    ▼          ▼          ▼                ▼          ▼
┌────────┐ ┌─────────┐ ┌─────────┐   ┌─────────┐ ┌─────────┐
│Frontend│ │ US ALB  │ │ CA ALB  │   │ UK ALB  │ │ EU ALB  │
│  ALB   │ │ :443    │ │ :443    │   │ :443    │ │ :443    │
└────────┘ └────┬────┘ └────┬────┘   └────┬────┘ └────┬────┘
                │           │             │           │
           ┌────▼────┐ ┌────▼────┐   ┌────▼────┐ ┌────▼────┐
           │ US API  │ │ CA API  │   │ UK API  │ │ EU API  │
           │ Fargate │ │ Fargate │   │ Fargate │ │ Fargate │
           └────┬────┘ └────┬────┘   └────┬────┘ └────┬────┘
                │           │             │           │
           ◄─── Federation HTTPS (HMAC-SHA256) ───►
                │           │             │           │
           ┌────┴────┐ ┌────┴────┐   ┌────┴────┐ ┌────┴────┐
           │Atlas US │ │Atlas CA │   │Atlas UK │ │Atlas EU │
           │+ Shared │ │         │   │         │ │         │
           └─────────┘ └─────────┘   └─────────┘ └─────────┘
              ▲ PrivateLink  ▲ PL         ▲ PL        ▲ PL
```

## Key Design Points

- **End-to-end TLS** — Cloudflare connects to ALBs via HTTPS using Cloudflare Origin Certificates (SSL mode: Full Strict). ALB security groups reference a Managed Prefix List of Cloudflare IPs, auto-updated daily by Lambda.
- **Federation** — Cross-jurisdiction API calls use HMAC-SHA256 signed HTTPS. Each region runs a `FederationRegistry` that routes outbound calls to peer regions. A HMAC key is shared across regions via Secrets Manager and rotated automatically by Lambda.
- **Database isolation** — Each region has its own MongoDB Atlas cluster accessed through PrivateLink (no public endpoints). US also hosts a Shared cluster (global accounts, reference data).
- **Tasks service** — A separate ECS service (same Docker image) runs scheduled and triggered background tasks (index sync, image resize, role sync, invalidation) without impacting API availability.
- **Admin panel** — The frontend is protected by Cloudflare Access (Zero Trust) in front of the CDN, an `X-Admin-Token` gate on all `/admin/*` API routes, and Firebase JWT + role checks at the application layer.
- **Rate limiting** — Redis-backed (ElastiCache, same VPC) per-user and per-IP rate limiting. See `rate-limiting.md`.
- **Observability** — Each Fargate task runs a Grafana Alloy sidecar that scrapes `/metrics` and remote-writes to Grafana Cloud.
- **CI/CD** — GitHub Actions deploys to all regions in parallel via AWS OIDC (no long-lived keys).

## Regions

| Region | AWS Region     | Federation Jurisdiction | Owns Shared DB |
| ------ | -------------- | ----------------------- | -------------- |
| US     | `us-east-1`    | `US,SHARED`             | Yes            |
| CA     | `ca-central-1` | `CA`                    | No             |
| UK     | `eu-west-2`    | `UK`                    | No             |
| EU     | `eu-central-1` | `EU`                    | No             |

## Deployment Modes

The federation layer is optional. The codebase supports three deployment topologies:

- **Single-tenant, single database** — Set `FEDERATION_MODE=development`. One process handles all jurisdictions via direct Mongo connections. Simplest deployment; no federation overhead.
- **Multi-tenant, shared database** — Multiple jurisdictions configured but pointing at the same Atlas cluster. Tenants are logically isolated by `jurisdiction_id` but share infrastructure. Useful for early-stage multi-region without the cost of per-region clusters.
- **Multi-tenant, isolated databases** (full production) — Each jurisdiction runs as an independent Fargate service with its own Atlas cluster. Cross-jurisdiction operations use authenticated HMAC-signed federation calls as described above.

The `tenant` attribute on XML entities (`Isolated` vs `Shared`) controls which database connection is used at the query level, so isolation granularity can be mixed within a single deployment.

## Local Development

Set `FEDERATION_MODE=development` in `backend/.env` to run in single-process mode: all jurisdictions are handled locally via direct Mongo connections with no inter-process federation calls.

To test cross-jurisdiction federation locally with four isolated instances:

```bash
docker compose -f docker-compose.federation.yml up --build
```

This starts US (:3010), CA (:3011), UK (:3012), EU (:3013), each with its own federation jurisdiction. Requests between instances use `http://api-us:3001` etc. within the Docker network.

## SHARED Database Network Access

Regional clusters connect via PrivateLink in their own AWS region. The SHARED cluster (us-east-1) is handled differently for non-US regions:

- **US** — PrivateLink (same region, fully private)
- **CA, UK, EU** — Standard MongoDB SRV over TLS 1.2, IP-restricted to NAT Gateway Elastic IPs

This is a cost trade-off: PrivateLink for sharded clusters requires M30+ (~$700–900/mo vs ~$175/mo for M10). SHARED entities are low-volume reference data so the performance difference is negligible at typical scale.
