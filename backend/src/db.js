import pg from "pg";
import dotenv from "dotenv";
import dns from "node:dns";

// Force IPv4 DNS lookup first for environments (like Render) that do not support IPv6 outbound
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env — see .env.example");
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});
