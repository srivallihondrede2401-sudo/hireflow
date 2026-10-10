import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Trash2, X } from "lucide-react";
import { STATUSES, STATUS_META, type Job, type JobInput, type Priority, type Status } from "../lib/types";
import { useAppDispatch } from "../app/store";
import { createJob, deleteJob, updateJob } from "../features/jobs/jobsSlice";

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const toLocalDate = (iso: string | null) => (iso ? toLocalInput(iso).slice(0, 10) : "");

const EMPTY: JobInput = {
  company: "", role: "", location: "", salary: "", url: "", status: "wishlist", priority: "medium",
  appliedAt: null, interviewAt: null, notes: "", tags: [],
};

export function JobModal({ job, initialStatus, onClose }: { job: Job | null; initialStatus?: Status; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<JobInput>(job ? { ...job } : { ...EMPTY, status: initialStatus ?? "wishlist" });
  const [tagText, setTagText] = useState((job?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: JobInput = { ...form, tags: tagText.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) };
    try {
      if (job) await dispatch(updateJob({ id: job.id, patch: payload })).unwrap();
      else await dispatch(createJob(payload)).unwrap();
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Couldn't save");
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!job || !confirm(`Delete ${job.role} at ${job.company}?`)) return;
    await dispatch(deleteJob(job.id));
    onClose();
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="job-title">
      <div className="modal__backdrop" onClick={onClose} />
      <form className="modal__panel" onSubmit={submit}>
        <header className="modal__head">
          <h2 id="job-title">{job ? "Edit application" : "Add application"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="grid2">
          <label>Company<input required value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Razorpay" autoFocus /></label>
          <label>Role<input required value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Frontend Engineer" /></label>
          <label>Location<input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bengaluru · Hybrid" /></label>
          <label>Salary<input value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="₹25–30 LPA" /></label>
          <label>Status
            <select value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </label>
          <label>Priority
            <div className="seg">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button type="button" key={p} className={form.priority === p ? `on prio-${p}` : ""} onClick={() => set("priority", p)}>{p}</button>
              ))}
            </div>
          </label>
          <label>Applied on<input type="date" value={toLocalDate(form.appliedAt)} onChange={(e) => set("appliedAt", e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
          <label>Interview<input type="datetime-local" value={toLocalInput(form.interviewAt)} onChange={(e) => set("interviewAt", e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
        </div>
        <label>Job link
          <div className="with-btn">
            <input type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
            {form.url && <a className="icon-btn" href={form.url} target="_blank" rel="noopener noreferrer" aria-label="Open link"><ExternalLink size={16} /></a>}
          </div>
        </label>
        <label><span>Tags <span className="hint">— comma separated</span></span><input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="React, TypeScript" /></label>
        <label>Notes<textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Recruiter name, prep topics, follow-ups…" /></label>

        {error && <p className="form-error">{error}</p>}

        <footer className="modal__foot">
          {job ? <button type="button" className="btn btn--danger" onClick={remove}><Trash2 size={15} /> Delete</button> : <span />}
          <div className="row">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? "Saving…" : job ? "Save changes" : "Add job"}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
