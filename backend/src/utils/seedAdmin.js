import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

dotenv.config();

async function seed() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error("Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  const existing = await pool.query("SELECT admin_id FROM admins WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    console.log(`Admin with email ${email} already exists. Skipping.`);
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)",
    [name, email, password_hash]
  );

  console.log(`✅ Admin created: ${email}`);
  console.log("You can now log in with this email and the password you set in .env.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
