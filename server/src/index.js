import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const { PORT = 4000, MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN = "http://localhost:5173" } = process.env;

if (!MONGODB_URI || !JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET — copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN.split(","), credentials: true }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use(notFound);
app.use(errorHandler);

await mongoose.connect(MONGODB_URI);
console.log("MongoDB connected");
app.listen(PORT, () => console.log(`HireFlow API listening on http://localhost:${PORT}`));
