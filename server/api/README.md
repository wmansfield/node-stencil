# Stencil API

Multi-jurisdiction NestJS backend with React admin frontend, deployed as federated services across four AWS regions.

## Project Structure

```
server/api/
├── frontend/                      # React admin frontend (Vite)
├── backend/                       # NestJS backend API
│   ├── src/
│   │   ├── features/              # Feature modules (auth, federation, platform, etc.)
│   │   ├── entities/              # Data entities (generated from XML, see code-generation-workflow rule)
│   │   └── shared/                # Shared services (access control, config, storage)
│   └── test/                      # E2E tests
├── developers/                    # Deployment scripts, IaC, and ops documentation
│   └── README.md                  # Full deployment guide
├── Dockerfile.backend             # Backend container image
├── Dockerfile.frontend            # Frontend container image
└── docker-compose.federation.yml  # Local multi-instance federation dev
```

## Local Development

### Prerequisites

- Node.js 23+
- MongoDB Atlas connection strings in `backend/.env`
- Firebase service account credentials in `backend/.env`

### Setup

```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Copy and configure environment files
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env

# Start both frontend and backend
npm start
```

### Seed the database (local sample environment)

Before logging in for the first time, seed reference data (roles, timezones, jurisdictions):

```bash
curl http://localhost:3001/api/platform/bootstrap
```

Or open [http://localhost:3001/api/platform/bootstrap](http://localhost:3001/api/platform/bootstrap) in a browser.

This endpoint is idempotent — it returns `{ "status": "already_bootstrapped" }` on subsequent calls. It is only available when `NODE_ENV` is not `production` and requires no authentication.

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API prefix: `/api`
- Hot reload enabled for both

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start frontend + backend concurrently |
| `npm run start:frontend` | Frontend only |
| `npm run start:backend` | Backend only |
| `npm run build` | Build both |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |

### Federation Development Mode

By default, local dev runs in `FEDERATION_MODE=development` -- a single process handles all jurisdictions via direct Mongo connections.

To test cross-jurisdiction federation locally with four isolated instances:

```bash
docker compose -f docker-compose.federation.yml up --build
```

This starts US (:3010), CA (:3011), UK (:3012), EU (:3013), each with its own federation jurisdiction and HTTPS federation between them via the Docker network.

## Architecture

Each jurisdiction (eg: US, UK, EU) runs as an independent Fargate service with its own Atlas database. Cross-jurisdiction operations use authenticated HTTPS federation calls signed with HMAC-SHA256.

US also hosts the Shared database (global settings, timezones).

See [`developers/README.md`](./developers/README.md) for the full architecture diagram, deployment guide, and operations runbook.

## Production

Production runs on AWS ECS Fargate behind Cloudflare, deployed via GitHub Actions CI/CD. All infrastructure is defined as CloudFormation templates in `developers/`.

Key docs in `developers/`:
- **[README.md](./developers/README.md)** -- deployment, multi-region, CI/CD, monitoring
- **[VERIFICATION.md](./developers/VERIFICATION.md)** -- invariant checklist
- **[rate-limiting.md](./developers/rate-limiting.md)** -- rate limiting configuration

## Environment Configuration

- `backend/.env.sample` -- backend environment variables (Mongo URIs, Firebase, KMS, storage, federation)
- `frontend/.env.sample` -- frontend environment variables (Firebase client config, API URL)
