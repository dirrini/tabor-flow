# ProjectPulse

ProjectPulse is a full-stack project management dashboard built with modern web technologies.

The goal of this project is to demonstrate industry-standard frontend and backend development practices, including:

* React 19
* TypeScript
* GraphQL
* Apollo Client
* Apollo Server
* PostgreSQL
* Docker Compose
* Tailwind CSS

The application is being developed as a portfolio project focused on showcasing real-world SaaS architecture and development workflows.

---

## Features

### Current Features

* React + Vite frontend
* GraphQL API
* Apollo Client integration
* Apollo Server backend
* Dockerized development environment
* TypeScript end-to-end
* Dashboard with project cards
* Responsive layout
* Public landing page in Portuguese (Brazil) and English
* Email registration and Google sign-in
* Tenant-isolated workspaces

### Planned Features

* PostgreSQL persistence
* Prisma ORM
* Authentication (JWT)
* User management
* Task management
* Kanban board
* GraphQL subscriptions
* Real-time updates
* Analytics dashboard

---

## Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Apollo Client
* React Router
* Tailwind CSS

### Backend

* Node.js
* Express
* Apollo Server
* GraphQL

### Database

* PostgreSQL

### Infrastructure

* Docker
* Docker Compose

---

## Project Structure

<code><pre>
project-pulse/
  ├── frontend/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  │
  ├── backend/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  │
  ├── docker-compose.yml
  │
  └── README.md
</pre></code>

---

## Running the Project

### Requirements

* Docker
* Docker Compose

### Start

```bash
docker compose up --build
```

Frontend:

http://localhost:5173

Backend GraphQL API:

http://localhost:4000/graphql

---

## Development

The project is configured for hot reload development:

* Frontend updates automatically through Vite HMR
* Backend restarts automatically through tsx watch

No manual rebuilds are required during normal development.

For Google sign-in, create a Web OAuth client in Google Cloud and set the same client ID as `GOOGLE_CLIENT_ID` in the backend and `VITE_GOOGLE_CLIENT_ID` in the frontend. Add the local and production origins to the OAuth client's authorized JavaScript origins. Apply the Prisma migrations before starting an upgraded environment.

---

## Author

Developed by Diego S.
