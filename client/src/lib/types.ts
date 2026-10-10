export const STATUSES = ["wishlist", "applied", "interview", "offer", "rejected"] as const;
export type Status = (typeof STATUSES)[number];
export type Priority = "low" | "medium" | "high";

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  wishlist: { label: "Wishlist", color: "#94a3b8" },
  applied: { label: "Applied", color: "#6366f1" },
  interview: { label: "Interview", color: "#f59e0b" },
  offer: { label: "Offer", color: "#10b981" },
  rejected: { label: "Rejected", color: "#f43f5e" },
};

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  url: string;
  status: Status;
  priority: Priority;
  order: number;
  appliedAt: string | null;
  interviewAt: string | null;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type JobInput = Omit<Job, "id" | "createdAt" | "updatedAt" | "order">;

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  user: User;
  token: string;
}
