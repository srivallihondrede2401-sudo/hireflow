import jwt from "jsonwebtoken";
import { HttpError } from "./errors.js";

export const signToken = (userId) => jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

/** Requires `Authorization: Bearer <jwt>`; sets req.userId. */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Not authenticated"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, "Session expired — please log in again"));
  }
}
