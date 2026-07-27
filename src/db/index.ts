import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";
import * as dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const sqlHost = process.env.SQL_HOST;
const sqlUser = process.env.SQL_ADMIN_USER ?? process.env.SQL_USER;
const sqlPassword = process.env.SQL_ADMIN_PASSWORD ?? process.env.SQL_PASSWORD;
const sqlDbName = process.env.SQL_DB_NAME;

if (!sqlHost) {
  throw new Error("SQL_HOST must be set in environment variables.");
}

if (!sqlUser) {
  throw new Error("SQL_USER or SQL_ADMIN_USER must be set in environment variables.");
}

if (typeof sqlPassword !== "string") {
  throw new Error("SQL_PASSWORD or SQL_ADMIN_PASSWORD must be set in environment variables.");
}

if (!sqlDbName) {
  throw new Error("SQL_DB_NAME must be set in environment variables.");
}

export const createPool = () => {
  const poolConfig: any = {
    host: sqlHost,
    user: sqlUser,
    database: sqlDbName,
    connectionTimeoutMillis: 15000,
  };

  poolConfig.password = sqlPassword;

  return new Pool(poolConfig);
};

export const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

export const db = drizzle(pool, { schema });
