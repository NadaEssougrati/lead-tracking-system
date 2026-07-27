# Lead Tracking System

A streamlined web app for managing leads, reviewing activity, and controlling user access in a clean, modern interface.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Configure environment variables in `.env` (see `.env.example` & `local_setup_guide.md`)
3. Run database migrations:
   `npm run db:push`
4. Seed the database with mock data:
   `node seed.js`
5. Run the app:
   `npm run dev`

## Sandbox Test Accounts

The following test credentials are created when you seed the database (`node seed.js`):

*   **Administrateur (Admin)**: `admin@example.com` / `admin123`
*   **Manager**: `manager1@example.com` / `manager123`
*   **Commercial**: `commercial1@example.com` / `commercial123`
*   **Agent Marketing**: `marketing1@example.com` / `marketing123`
