import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import peopleRoutes from "./routes/people.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Chrome DevTools probe endpoint handler to prevent Express default 404 CSP fallback
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).end();
});

app.use("/api/auth", authRoutes);
app.use("/api/people", peopleRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportsRoutes);

// Custom 404 handler (prevents Express default finalhandler from returning text/html with CSP default-src 'none')
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Basic error handler so unexpected errors don't crash silently
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ BuzzTech API running on http://localhost:${PORT}`);
});
