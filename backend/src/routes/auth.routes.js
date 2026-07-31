import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const result = await pool.query(
    "SELECT * FROM admins WHERE email = $1 AND is_active = TRUE",
    [email]
  );
  const admin = result.rows[0];

  if (!admin) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const validPassword = await bcrypt.compare(password, admin.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign(
    { admin_id: admin.admin_id, email: admin.email, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );

  res.json({
    token,
    admin: { admin_id: admin.admin_id, name: admin.name, email: admin.email },
  });
});

// GET /api/auth/me  — verify token / fetch current admin
router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
