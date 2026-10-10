import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Job, PRIORITIES, STATUSES } from "../models/Job.js";
import { asyncRoute, HttpError } from "../middleware/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const jobInput = z.object({
  company: z.string().trim().min(1).max(80),
  role: z.string().trim().min(1).max(120),
  location: z.string().trim().max(80).optional(),
  salary: z.string().trim().max(40).optional(),
  url: z.string().trim().url().or(z.literal("")).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  appliedAt: z.coerce.date().nullable().optional(),
  interviewAt: z.coerce.date().nullable().optional(),
  notes: z.string().max(4000).optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).optional(),
});

const findOwned = async (id, owner) => {
  const job = await Job.findOne({ _id: id, owner });
  if (!job) throw new HttpError(404, "Job not found");
  return job;
};

// GET /api/jobs?status=applied&q=react
router.get("/", asyncRoute(async (req, res) => {
  const filter = { owner: req.userId };
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ company: rx }, { role: rx }, { tags: rx }];
  }
  const jobs = await Job.find(filter).sort({ status: 1, order: 1, updatedAt: -1 });
  res.json({ jobs });
}));

// GET /api/jobs/stats — counts per status + applications per week
router.get("/stats", asyncRoute(async (req, res) => {
  const owner = new mongoose.Types.ObjectId(req.userId);
  const [byStatus, perWeek] = await Promise.all([
    Job.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Job.aggregate([
      { $match: { owner, appliedAt: { $ne: null } } },
      { $group: { _id: { $dateTrunc: { date: "$appliedAt", unit: "week" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  res.json({
    byStatus: Object.fromEntries(STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.count ?? 0])),
    perWeek: perWeek.map((w) => ({ week: w._id, count: w.count })),
  });
}));

router.post("/", asyncRoute(async (req, res) => {
  const data = jobInput.parse(req.body);
  if (data.status && data.status !== "wishlist" && !data.appliedAt) data.appliedAt = new Date();
  const job = await Job.create({ ...data, owner: req.userId });
  res.status(201).json({ job });
}));

router.patch("/:id", asyncRoute(async (req, res) => {
  const data = jobInput.partial().parse(req.body);
  const job = await findOwned(req.params.id, req.userId);
  Object.assign(job, data);
  await job.save();
  res.json({ job });
}));

// PATCH /api/jobs/:id/move — drag & drop between columns
router.patch("/:id/move", asyncRoute(async (req, res) => {
  const { status, order } = z.object({ status: z.enum(STATUSES), order: z.number().int().min(0) }).parse(req.body);
  const job = await findOwned(req.params.id, req.userId);
  if (job.status === "wishlist" && status !== "wishlist" && !job.appliedAt) job.appliedAt = new Date();
  job.status = status;
  job.order = order;
  await job.save();
  res.json({ job });
}));

router.delete("/:id", asyncRoute(async (req, res) => {
  const job = await findOwned(req.params.id, req.userId);
  await job.deleteOne();
  res.status(204).end();
}));

export default router;
