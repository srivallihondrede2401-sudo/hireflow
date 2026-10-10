import { CalendarClock, MapPin } from "lucide-react";
import type { Job } from "../lib/types";

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];

export function CompanyAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  return (
    <span className="avatar" style={{ width: size, height: size, background: PALETTE[hash % PALETTE.length], fontSize: size * 0.42 }}>
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}

export const relDays = (iso: string | null) => {
  if (!iso) return "";
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
};

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function JobCard({ job, dragging, onOpen }: { job: Job; dragging?: boolean; onOpen?: () => void }) {
  return (
    <div className={`card${dragging ? " card--dragging" : ""}`} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen?.()}>
      <div className="card__head">
        <CompanyAvatar name={job.company} />
        <div className="card__who">
          <strong>{job.role}</strong>
          <span>{job.company}</span>
        </div>
        <span className={`prio prio--${job.priority}`} title={`${job.priority} priority`} />
      </div>
      {job.location && <p className="card__line"><MapPin size={13} /> {job.location}</p>}
      {job.interviewAt && job.status === "interview" && (
        <p className="card__line card__line--accent"><CalendarClock size={13} /> {fmtDateTime(job.interviewAt)}</p>
      )}
      <div className="card__foot">
        <div className="card__tags">{job.tags.slice(0, 2).map((t) => <span key={t}>{t}</span>)}</div>
        <span className="card__meta">{job.salary || relDays(job.appliedAt ?? job.createdAt)}</span>
      </div>
    </div>
  );
}
