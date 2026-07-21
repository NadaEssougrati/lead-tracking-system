# Local Setup Guide for KDE Neon

This guide walks you through installing **PostgreSQL**, setting up the `lead_man` database, configuring environment variables, running migrations, and launching the **LeadFlow** application on your local machine running **KDE Neon** (Ubuntu-based).

---

## 1. Install PostgreSQL on KDE Neon

Since KDE Neon is based on Ubuntu LTS, you can install PostgreSQL using the standard `apt` package manager:

```bash
# Update package repositories
sudo apt update

# Install PostgreSQL, its contrib utilities, and development libraries
sudo apt install postgresql postgresql-contrib libpq-dev -y
```

After installation, verify that the PostgreSQL service is active and running:

```bash
sudo systemctl status postgresql
```

*(If it is not started, run: `sudo systemctl enable --now postgresql`)*

---

## 2. Configure Database & Users

By default, PostgreSQL creates a system user named `postgres` with full administrative privileges. Let's switch to this user to set up your specific user credentials and create the database.

### Step 2.1: Log into the PostgreSQL interactive terminal
```bash
sudo -u postgres psql
```

### Step 2.2: Create the administrative user
Run the following SQL commands inside the `psql` shell. Replace `'your_secure_password'` with your desired password:

```sql
-- Create database admin user
CREATE USER lead_admin WITH PASSWORD 'your_secure_password';

-- Give the user capabilities to create databases if needed
ALTER USER lead_admin CREATEDB;
```

### Step 2.3: Create the database
Create the `lead_man` database and assign ownership to the newly created user:

```sql
-- Create the main database
CREATE DATABASE lead_man OWNER lead_admin;

-- Grant all privileges on the database to your user
GRANT ALL PRIVILEGES ON DATABASE lead_man TO lead_admin;
```

Exit the shell:
```sql
\q
```

---

## 3. Clone and Install App Dependencies

Once your repository files are downloaded or cloned to your local machine, open your terminal inside the project directory and run:

```bash
# Install node packages (Ensure Node.js v18+ is installed)
npm install
```

---

## 4. Set Up Local Environment Variables

Create a `.env` file in the root of your project:

```bash
cp .env.example .env
```

Open `.env` in your text editor (e.g., Kate, VS Code) and populate the values based on your local PostgreSQL configuration:

```env
# Server & Security Mappings
JWT_SECRET="a_very_long_secure_random_hash_for_jwt_signing_key"
PORT=3000

# Database Credentials (Local Drizzle & Runtime Pool)
SQL_HOST="127.0.0.1"
SQL_USER="lead_man_user"
SQL_PASSWORD="lead123" # Set your PostgreSQL user's password (e.g., lead123)
SQL_DB_NAME="lead_man"

# Admin Database Credentials (Drizzle-Kit Migrations)
SQL_ADMIN_USER="postgres"
SQL_ADMIN_PASSWORD="qwerty" # Replace with your admin (postgres) password (e.g., qwerty)
```

---

## 5. Generate and Run Database Migrations

With your `.env` configured and PostgreSQL active, use the custom `npm` scripts to let `drizzle-kit` automatically push the schema or apply migrations.

### Step 5.1: Install local dependencies
Ensure you have run `npm install` first! This installs all necessary tools, including the `tsx` and `drizzle-kit` engines locally:
```bash
npm install
```

### Step 5.2: Generate and apply migrations locally
Generate the migration files from your TypeScript schema:
```bash
npm run db:generate
```

Now, apply (push) the schema migrations to your local Postgres instance:
```bash
npm run db:push
```

*(Alternatively, you can run them directly via npx by specifying the config path: `npx drizzle-kit push --config=src/db/drizzle.config.ts`)*

---

## 6. Seed/Populate Default Sandbox Accounts

When you start the development server for the first time, LeadFlow automatically seeds 4 sandbox security accounts if the `users` table is empty:

*   **Administrator**: `admin` / `admin123`
*   **Manager**: `manager` / `manager123`
*   **Commercial**: `commercial` / `commercial123`
*   **Marketing**: `marketing` / `marketing123`

---

## 7. Run the Application

You can now start the full-stack development environment:

```bash
npm run dev
```

The application will bind to:
*   Local access: **`http://localhost:3000`**

Enjoy using LeadFlow locally on KDE Neon!
