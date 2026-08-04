# Lead Tracking System (LeadFlow)

This project is a unified CRM application built with a React frontend and an Express backend, using Prisma ORM with PostgreSQL.

## Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Docker** (for running PostgreSQL locally)

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Update any variables in `.env` as needed (e.g., database connection credentials).

### 3. Spin up PostgreSQL
Run the Docker Compose configuration to start your local PostgreSQL instance:
```bash
docker compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Generate Prisma Client & Migrate
Run the migrations to create the database schema and seed the database:
```bash
npx prisma generate
npx prisma migrate dev
npm run seed
```

### 6. Start Development Server
This runs the integrated Express server, which serves both the API endpoints and the React frontend (via Vite dev middleware) on port `5000`:
```bash
npm run dev
```
Open [http://localhost:5000](http://localhost:5000) in your browser.
