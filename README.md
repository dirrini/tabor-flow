# TaborFlow

TaborFlow is a bilingual, multi-tenant project management platform for organizing projects, tasks, people, products, and delivery timelines. Each organization receives an isolated workspace so users can only access data that belongs to their own tenant.

Production: [https://tabor-flow.dirrini.tech](https://tabor-flow.dirrini.tech)

## Features

### Public experience and authentication

- Responsive landing page in Portuguese (Brazil) and English
- TaborFlow SVG brand assets and favicon
- Email and password registration and login
- Email verification through Resend before workspace access
- Email invitations for workspace members with password setup on acceptance
- Sign in with Google through Google Identity Services
- Automatic access to the protected workspace after authentication

### Workspace

- Project portfolio dashboard
- Project, task, product, and user management
- Administrator role with inherited project manager capabilities
- Project status and progress tracking
- User assignment to projects and tasks
- Estimated start and end dates for assignments
- Interactive team Timeline with project, user, status, and date filters
- Responsive desktop and mobile navigation
- User profile and password management

### Security and data isolation

- Tenant-scoped users, projects, tasks, products, and dashboard statistics
- Server-side authorization for protected GraphQL operations
- Signed authentication tokens
- Password hashing with Node.js `scrypt`
- Google ID token verification on the backend
- Scoped integration clients for external systems
- PostgreSQL persistence with versioned Prisma migrations

## Technology stack

### Application

- Frontend: React 19, TypeScript, Vite, React Router, Apollo Client, Tailwind CSS, and vis-timeline
- Backend: Node.js 22, TypeScript, Express, Apollo Server, GraphQL, and Prisma ORM
- Database: PostgreSQL

### Production infrastructure

- Frontend hosting and CDN: Cloudflare Pages
- API container runtime: Google Cloud Run in `southamerica-east1`
- Container registry: Google Artifact Registry
- Database: Neon PostgreSQL
- Secrets: Google Cloud Secret Manager
- CI/CD: GitHub Actions with Google Cloud Workload Identity Federation
- Public application URL: `https://tabor-flow.dirrini.tech`
- Cloudflare Pages URL: `https://tabor-flow.pages.dev`
- GraphQL API: `https://taborflow-api-noihm2xs2q-rj.a.run.app/graphql`

No long-lived Google Cloud service account key is stored in GitHub. Production deployments use short-lived federated credentials.

## Project structure

```text
tabor-flow/
|-- .github/workflows/       # CI and production deployment
|-- backend/
|   |-- prisma/              # Schema, seed, and migrations
|   |-- src/graphql/         # GraphQL schemas, context, and resolvers
|   |-- src/lib/             # Authentication and Prisma helpers
|   |-- Dockerfile           # Production API image
|   `-- Dockerfile.dev       # Local development image
|-- frontend/
|   |-- public/brand/        # TaborFlow SVG brand assets
|   |-- src/components/      # Shared interface components
|   |-- src/pages/           # Landing, authentication, and workspace pages
|   `-- Dockerfile.dev       # Local development image
|-- docker-compose.yml
`-- README.md
```

## Running locally with Docker

### Requirements

- Docker Desktop or Docker Engine
- Docker Compose

Start the application:

```bash
docker compose up -d --build
```

The backend waits for PostgreSQL to become healthy and applies pending Prisma migrations before starting.

Local services:

- Frontend: <http://localhost:5173>
- GraphQL API: <http://localhost:4000/graphql>
- PostgreSQL: `localhost:5432`

View status and backend logs:

```bash
docker compose ps
docker compose logs -f backend
```

Stop the environment:

```bash
docker compose down
```

Remove the environment and all local database data:

```bash
docker compose down -v
```

## Local development without Docker

Create local environment files from the examples before starting each application.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Production builds can be validated with `npm run build` inside both `frontend` and `backend`.

## Environment variables

### Backend

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port used by the GraphQL API |
| `DATABASE_URL` | PostgreSQL connection string; production uses the pooled Neon URL |
| `AUTH_SECRET` | Secret used to sign authentication tokens |
| `GOOGLE_CLIENT_ID` | OAuth Web Client ID used to verify Google ID tokens |
| `CORS_ORIGIN` | Browser origin allowed to call the API |
| `APP_URL` | Public frontend URL used to generate email verification links |
| `RESEND_API_KEY` | Resend API key used for transactional email |
| `RESEND_FROM_EMAIL` | Sender name and address on a domain verified by Resend |
| `SEED_INTEGRATION_CLIENT_ID` | Optional external integration client identifier |
| `SEED_INTEGRATION_CLIENT_SECRET` | Optional external integration secret |
| `SEED_INTEGRATION_SCOPES` | Optional integration scopes |

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Complete GraphQL endpoint exposed to the browser |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Web Client ID used by Google Identity Services |

The frontend and backend must use the same Google OAuth Web Client ID. Add both local and production frontend origins to **Google Auth Platform > Clients > Authorized JavaScript origins**.

### Email verification

Email/password accounts receive a signed verification link that expires after 60 minutes. Until the address is confirmed, the authenticated user can only access the verification screen or request a new email. Accounts authenticated through Google are considered verified by the identity provider.

Users added by a workspace administrator do not receive a temporary password. They receive a signed invitation link that expires after seven days, confirm the invitation, and define their own password before accessing the workspace. If an invited email later authenticates with Google, the Google identity is linked to that existing account and tenant.

`RESEND_FROM_EMAIL` must use a sender address on a domain verified in Resend. In production, keep `RESEND_API_KEY` in Google Cloud Secret Manager and set `APP_URL=https://tabor-flow.dirrini.tech` on the Cloud Run service.

## Database migrations

Migrations are stored in `backend/prisma/migrations`.

Apply migrations in the Docker environment:

```bash
docker compose exec backend npx prisma migrate deploy
```

Create a migration during local development:

```bash
cd backend
npm run migrate
```

Production uses the `taborflow-migrate` Cloud Run job with the direct Neon connection. The deployment workflow updates the job image and waits for migrations to finish before updating the API service. A failed migration stops the release.

## Production deployment

The repository uses the following branch flow:

```text
feature branch -> develop -> pull request -> main -> production
```

- Pushes and pull requests targeting `develop` run application checks.
- Cloudflare Pages creates frontend previews for non-production branches.
- A merge into `main` publishes the frontend through Cloudflare Pages.
- Backend changes under `backend/**` on `main` trigger `.github/workflows/deploy-production.yml`.
- Backend images are tagged with the full Git commit SHA and pushed to Artifact Registry.
- The workflow runs migrations, updates Cloud Run, and verifies the GraphQL health query.

Required GitHub Actions repository variables:

| Variable | Purpose |
| --- | --- |
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_REGION` | Artifact Registry and Cloud Run region |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Federation provider resource |
| `GCP_SERVICE_ACCOUNT` | Federated deployment service account |

Production application secrets remain in Google Cloud Secret Manager and are not copied to GitHub Actions.

## Tenant model

Registration creates an organization tenant and its first administrator. The tenant identifier is stored with users and tenant-owned records and is included in signed authentication tokens. Backend resolvers scope queries and authorization checks to that tenant.

Signing in with Google using an email that already exists accesses the existing user and tenant instead of creating a duplicate workspace.

## Author

Developed by Diego S.
