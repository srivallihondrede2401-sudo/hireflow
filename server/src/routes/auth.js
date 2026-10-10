import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { asyncRoute, HttpError } from "../middleware/errors.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

router.post("/register", asyncRoute(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await User.create(data);
  res.status(201).json({ user: user.toPublic(), token: signToken(user.id) });
}));

router.post("/login", asyncRoute(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.checkPassword(password))) throw new HttpError(401, "Invalid email or password");
  res.json({ user: user.toPublic(), token: signToken(user.id) });
}));

router.get("/me", requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, "Account not found");
  res.json({ user: user.toPublic() });
}));

export default router;
