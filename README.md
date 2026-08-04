# Tracking Lead System Backend

## Installation

```bash
npm install
```

Start PostgreSQL

```bash
docker compose up -d
```

Generate Prisma

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

Run

```bash
npm run dev
```