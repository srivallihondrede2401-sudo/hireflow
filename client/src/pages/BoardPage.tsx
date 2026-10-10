import { useState } from "react";
import { CalendarClock, Plus, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/store";
import { selectStats, selectUpcoming, setPriority, setQuery } from "../features/jobs/jobsSlice";
import type { Job, Priority, Status } from "../lib/types";
import { Board } from "../components/Board";
import { JobModal } from "../components/JobModal";
import { CompanyAvatar, fmtDateTime } from "../components/JobCard";

export function BoardPage() {
  const dispatch = useAppDispatch();
  const { query, priority, loading, error } = useAppSelector((s) => s.jobs);
  const user = useAppSelector((s) => s.auth.session?.user);
  const stats = useAppSelector(selectStats);
  const upcoming = useAppSelector(selectUpcoming);
  const [editing, setEditing] = useState<{ job: Job | null; status?: Status } | null>(null);

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Hi {user?.name.split(" ")[0]} 👋</h1>
          <p className="muted">
            {stats.applied} applications · {stats.interviews} in interviews · {stats.offers} {stats.offers === 1 ? "offer" : "offers"}
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setEditing({ job: null })}><Plus size={16} /> Add job</button>
      </header>

      {upcoming.length > 0 && (
        <section className="upcoming">
          <h2><CalendarClock size={16} /> Upcoming interviews</h2>
          <div className="upcoming__list">
            {upcoming.slice(0, 4).map((j) => (
              <button key={j.id} className="upcoming__item" onClick={() => setEditing({ job: j })}>
                <CompanyAvatar name={j.company} size={32} />
                <span><strong>{j.company}</strong><small>{fmtDateTime(j.interviewAt!)}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input value={query} onChange={(e) => dispatch(setQuery(e.target.value))} placeholder="Search company, role or tag…" />
        </label>
        <div className="seg">
          {(["all", "high", "medium", "low"] as (Priority | "all")[]).map((p) => (
            <button key={p} className={priority === p ? "on" : ""} onClick={() => dispatch(setPriority(p))}>{p === "all" ? "All" : p}</button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && stats.total === 0 ? <div className="skeleton-board">{Array.from({ length: 5 }, (_, i) => <div key={i} />)}</div> : (
        <Board onOpen={(job) => setEditing({ job })} onAdd={(status) => setEditing({ job: null, status })} />
      )}

      {editing && <JobModal job={editing.job} initialStatus={editing.status} onClose={() => setEditing(null)} />}
    </div>
  );
}
