import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../lib/api";
import { STATUSES, type Job, type JobInput, type Priority, type Status } from "../../lib/types";
import type { RootState } from "../../app/store";

interface JobsState {
  items: Job[];
  loading: boolean;
  error: string | null;
  query: string;
  priority: Priority | "all";
}

const initialState: JobsState = { items: [], loading: false, error: null, query: "", priority: "all" };

const token = (s: RootState) => s.auth.session?.token ?? "";

export const fetchJobs = createAsyncThunk<Job[], void, { state: RootState }>("jobs/fetch", (_, { getState }) =>
  api.listJobs(token(getState())),
);
export const createJob = createAsyncThunk<Job, JobInput, { state: RootState }>("jobs/create", (input, { getState }) =>
  api.createJob(token(getState()), input),
);
export const updateJob = createAsyncThunk<Job, { id: string; patch: Partial<JobInput> }, { state: RootState }>(
  "jobs/update",
  ({ id, patch }, { getState }) => api.updateJob(token(getState()), id, patch),
);
export const deleteJob = createAsyncThunk<string, string, { state: RootState }>("jobs/delete", async (id, { getState }) => {
  await api.deleteJob(token(getState()), id);
  return id;
});

/** Optimistic drag & drop: reorder locally first, then persist; reload on failure. */
export const moveJob = createAsyncThunk<void, { id: string; status: Status; index: number }, { state: RootState }>(
  "jobs/move",
  async ({ id, status, index }, { getState, dispatch }) => {
    dispatch(jobsSlice.actions.movedLocally({ id, status, index }));
    try {
      await api.moveJob(token(getState()), id, status, index);
    } catch (e) {
      dispatch(fetchJobs());
      throw e;
    }
  },
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setQuery: (s, a: PayloadAction<string>) => { s.query = a.payload; },
    setPriority: (s, a: PayloadAction<Priority | "all">) => { s.priority = a.payload; },
    movedLocally: (s, a: PayloadAction<{ id: string; status: Status; index: number }>) => {
      const job = s.items.find((j) => j.id === a.payload.id);
      if (!job) return;
      const from = job.status;
      job.status = a.payload.status;
      if (from === "wishlist" && a.payload.status !== "wishlist" && !job.appliedAt) job.appliedAt = new Date().toISOString();
      const column = s.items.filter((j) => j.status === a.payload.status && j.id !== job.id).sort((x, y) => x.order - y.order);
      column.splice(a.payload.index, 0, job);
      column.forEach((j, i) => { j.order = i; });
      if (from !== a.payload.status) {
        s.items.filter((j) => j.status === from).sort((x, y) => x.order - y.order).forEach((j, i) => { j.order = i; });
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchJobs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchJobs.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchJobs.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? "Couldn't load jobs"; })
      .addCase(createJob.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateJob.fulfilled, (s, a) => {
        const i = s.items.findIndex((j) => j.id === a.payload.id);
        if (i >= 0) s.items[i] = { ...a.payload, order: s.items[i].order };
      })
      .addCase(deleteJob.fulfilled, (s, a) => { s.items = s.items.filter((j) => j.id !== a.payload); });
  },
});

export const { setQuery, setPriority } = jobsSlice.actions;
export default jobsSlice.reducer;

/* ------------------------------------------------------------ selectors */
const selectItems = (s: RootState) => s.jobs.items;
const selectQuery = (s: RootState) => s.jobs.query;
const selectPriority = (s: RootState) => s.jobs.priority;

export const selectFilteredJobs = createSelector([selectItems, selectQuery, selectPriority], (items, query, priority) => {
  const q = query.trim().toLowerCase();
  return items.filter(
    (j) =>
      (priority === "all" || j.priority === priority) &&
      (!q || [j.company, j.role, j.location, ...j.tags].some((v) => v.toLowerCase().includes(q))),
  );
});

export const selectColumns = createSelector([selectFilteredJobs], (jobs) =>
  Object.fromEntries(STATUSES.map((s) => [s, jobs.filter((j) => j.status === s).sort((a, b) => a.order - b.order)])) as Record<Status, Job[]>,
);

export const selectStats = createSelector([selectItems], (items) => {
  const count = (s: Status) => items.filter((j) => j.status === s).length;
  const applied = items.filter((j) => j.status !== "wishlist").length;
  const responded = count("interview") + count("offer") + count("rejected");
  return {
    total: items.length,
    applied,
    interviews: count("interview"),
    offers: count("offer"),
    responseRate: applied ? Math.round((responded / applied) * 100) : 0,
    byStatus: STATUSES.map((s) => ({ status: s, count: count(s) })),
  };
});

export const selectUpcoming = createSelector([selectItems], (items) =>
  items
    .filter((j) => j.interviewAt && new Date(j.interviewAt).getTime() > Date.now() - 3_600_000)
    .sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime()),
);
