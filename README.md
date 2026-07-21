# TaborFlow

TaborFlow is a multi-tenant project management platform that gives teams a shared view of projects, tasks, people, products, and delivery timelines.

The application combines a bilingual public website and authentication experience with a protected workspace for day-to-day project execution. Each organization receives an isolated tenant so users only access their own environment and data.

## Features

### Public experience

- Responsive TaborFlow landing page
- Portuguese (Brazil) and English localization
- Dedicated product, workflow, and Timeline sections
- Custom SVG brand assets and favicon
- Email and password registration
- Email and password login
- Google Identity Services authentication

### Workspace

- Project portfolio dashboard
- Project, task, product, and user management
- Project status and progress tracking
- Assignment of users to projects and tasks
- Estimated start and end dates for assignments
- Interactive team Timeline
- Timeline filtering by project, user, status, and date range
- Responsive desktop and mobile navigation
- User profile and password management

### Architecture and security

- Tenant-isolated users, projects, tasks, and dashboard statistics
- Server-side authorization for protected GraphQL operations
- Signed authentication tokens
- Password hashing with Node.js `scrypt`
- Google ID token verification on the backend
- Scoped integration clients for external systems
- PostgreSQL persistence with Prisma migrations
- Automatic migration execution when Docker services start
- PostgreSQL health check before backend startup

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Apollo Client
- Tailwind CSS
- Lucide React
- vis-timeline

### Backend

- Node.js 22
- TypeScript
- Express
- Apollo Server
- GraphQL
- Prisma ORM
- Google Auth Library

### Infrastructure

- PostgreSQL 16
- Docker
- Docker Compose
- Kubernetes manifests for local and AWS-oriented deployments

## Project structure

```text
tabor-flow/
├── frontend/
│   ├── public/brand/       # TaborFlow SVG brand assets
│   ├── src/components/     # Shared interface components
│   ├── src/pages/          # Landing, authentication, and workspace pages
│   └── Dockerfile.dev
├── backend/
│   ├── prisma/             # Schema, seed, and database migrations
│   ├── src/graphql/        # GraphQL schemas, context, and resolvers
│   ├── src/lib/            # Authentication and Prisma helpers
│   └── Dockerfile.dev
├── k8s/                    # Kubernetes manifests
├── docker-compose.yml
└── README.md
```

## Running with Docker

### Requirements

- Docker Desktop or Docker Engine
- Docker Compose

### Start the application

```bash
docker compose up -d --build
```

The backend waits for PostgreSQL to become healthy and applies all pending Prisma migrations before starting the GraphQL API.

Available services:

- Frontend: <http://localhost:5173>
- GraphQL API: <http://localhost:4000/graphql>
- PostgreSQL: `localhost:5432`

### View service status and logs

```bash
docker compose ps
docker compose logs -f backend
```

### Stop the application

```bash
docker compose down
```

To also remove the local PostgreSQL volume and all development data:

```bash
docker compose down -v
```

## Local development

The Docker development environment provides hot reload for both applications:

- Vite updates the frontend as files change.
- `tsx watch` restarts the backend as files change.
- Prisma migrations run automatically when the backend container starts.

Production builds can be checked independently:

```bash
cd frontend
npm install
npm run build
```

```bash
cd backend
npm install
npx prisma generate
npm run build
```

## Environment variables

Copy the provided `.env.example` files and configure values appropriate for the environment.

### Backend

| Variable | Description |
| --- | --- |
| `PORT` | GraphQL API port |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign authentication tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID used to verify ID tokens |
| `SEED_INTEGRATION_CLIENT_ID` | Optional external integration client identifier |
| `SEED_INTEGRATION_CLIENT_SECRET` | Optional external integration secret |
| `SEED_INTEGRATION_SCOPES` | Allowed integration scopes |

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_GRAPHQL_URL` | GraphQL API URL exposed to the browser |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID used by Google Identity Services |

The frontend and backend must use the same Google OAuth Web Client ID. Add local and production application URLs to the authorized JavaScript origins in Google Cloud Console.

## Database migrations

Migrations are stored in `backend/prisma/migrations` and are automatically applied by the Docker startup command.

To apply them manually:

```bash
docker compose exec backend npx prisma migrate deploy
```

To create a new migration during local development:

```bash
cd backend
npm run migrate
```

## Tenant model

Registration creates an organization workspace and its first administrator. The tenant identifier is stored with users and projects and is included in signed authentication tokens. Backend queries and authorization checks use this identifier to keep organization data separated.

## Author

Developed by Diego S.
