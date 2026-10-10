import type { Job, JobInput, Session, Status, User } from "./types";
import { seedJobs } from "./seed";

/**
 * One interface, two backends:
 *  - HttpApi talks to the Express + MongoDB server (set VITE_API_URL)
 *  - LocalApi keeps everything in localStorage so the static demo works anywhere
 */
export interface Api {
  mode: "live" | "demo";
  register(name: string, email: string, password: string): Promise<Session>;
  login(email: string, password: string): Promise<Session>;
  me(token: string): Promise<User>;
  listJobs(token: string): Promise<Job[]>;
  createJob(token: string, input: JobInput): Promise<Job>;
  updateJob(token: string, id: string, patch: Partial<JobInput>): Promise<Job>;
  moveJob(token: string, id: string, status: Status, order: number): Promise<Job>;
  deleteJob(token: string, id: string): Promise<void>;
}

export class ApiError extends Error {}

/* ------------------------------------------------------------------ HTTP */
class HttpApi implements Api {
  mode = "live" as const;
  constructor(private base: string) {}

  private async req<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
    const res = await fetch(`${this.base}/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
    });
    if (res.status === 204) return undefined as T;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`);
    return body as T;
  }

  register = (name: string, email: string, password: string) =>
    this.req<Session>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  login = (email: string, password: string) =>
    this.req<Session>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  me = async (token: string) => (await this.req<{ user: User }>("/auth/me", { token })).user;
  listJobs = async (token: string) => (await this.req<{ jobs: Job[] }>("/jobs", { token })).jobs;
  createJob = async (token: string, input: JobInput) =>
    (await this.req<{ job: Job }>("/jobs", { method: "POST", token, body: JSON.stringify(input) })).job;
  updateJob = async (token: string, id: string, patch: Partial<JobInput>) =>
    (await this.req<{ job: Job }>(`/jobs/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) })).job;
  moveJob = async (token: string, id: string, status: Status, order: number) =>
    (await this.req<{ job: Job }>(`/jobs/${id}/move`, { method: "PATCH", token, body: JSON.stringify({ status, order }) })).job;
  deleteJob = (token: string, id: string) => this.req<void>(`/jobs/${id}`, { method: "DELETE", token });
}

/* ----------------------------------------------------------------- Local */
const JOBS_KEY = "hireflow.jobs.v1";
const USERS_KEY = "hireflow.users.v1";
const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));

class LocalApi implements Api {
  mode = "demo" as const;

  private jobs(): Job[] {
    try {
      const raw = localStorage.getItem(JOBS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* fall through to seed */ }
    const seeded = seedJobs();
    this.save(seeded);
    return seeded;
  }
  private save(jobs: Job[]) {
    try { localStorage.setItem(JOBS_KEY, JSON.stringify(jobs)); } catch { /* ignore */ }
  }
  private users(): (User & { password: string })[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); } catch { return []; }
  }

  async register(name: string, email: string, password: string) {
    await wait();
    if (password.length < 8) throw new ApiError("Password must be at least 8 characters");
    const users = this.users();
    if (users.some((u) => u.email === email.toLowerCase())) throw new ApiError("That email is already registered");
    const user = { id: crypto.randomUUID(), name, email: email.toLowerCase(), password };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    return { user: { id: user.id, name, email: user.email }, token: `demo.${user.id}` };
  }

  async login(email: string, password: string) {
    await wait();
    if (email.toLowerCase() === "demo@hireflow.app" && password === "demo1234") {
      return { user: { id: "demo", name: "Srivalli", email: "demo@hireflow.app" }, token: "demo.demo" };
    }
    const u = this.users().find((x) => x.email === email.toLowerCase() && x.password === password);
    if (!u) throw new ApiError("Invalid email or password");
    return { user: { id: u.id, name: u.name, email: u.email }, token: `demo.${u.id}` };
  }

  async me(token: string) {
    const id = token.split(".")[1];
    if (id === "demo") return { id, name: "Srivalli", email: "demo@hireflow.app" };
    const u = this.users().find((x) => x.id === id);
    if (!u) throw new ApiError("Session expired");
    return { id: u.id, name: u.name, email: u.email };
  }

  async listJobs() {
    await wait();
    return this.jobs();
  }

  async createJob(_t: string, input: JobInput) {
    await wait();
    const jobs = this.jobs();
    const now = new Date().toISOString();
    const job: Job = {
      ...input,
      appliedAt: input.appliedAt ?? (input.status !== "wishlist" ? now : null),
      id: crypto.randomUUID(),
      order: jobs.filter((j) => j.status === input.status).length,
      createdAt: now,
      updatedAt: now,
    };
    this.save([...jobs, job]);
    return job;
  }

  async updateJob(_t: string, id: string, patch: Partial<JobInput>) {
    await wait();
    let updated: Job | undefined;
    this.save(this.jobs().map((j) => (j.id === id ? (updated = { ...j, ...patch, updatedAt: new Date().toISOString() }) : j)));
    if (!updated) throw new ApiError("Job not found");
    return updated;
  }

  async moveJob(_t: string, id: string, status: Status, order: number) {
    const job = this.jobs().find((j) => j.id === id);
    if (!job) throw new ApiError("Job not found");
    const appliedAt = job.appliedAt ?? (status !== "wishlist" ? new Date().toISOString() : null);
    return this.updateJob(_t, id, { status, appliedAt, ...({ order } as object) });
  }

  async deleteJob(_t: string, id: string) {
    await wait();
    this.save(this.jobs().filter((j) => j.id !== id));
  }
}

const base = import.meta.env.VITE_API_URL as string | undefined;
export const api: Api = base ? new HttpApi(base.replace(/\/$/, "")) : new LocalApi();
