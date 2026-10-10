import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors,
  pointerWithin, rectIntersection, type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { STATUSES, STATUS_META, type Job, type Status } from "../lib/types";
import { useAppDispatch, useAppSelector } from "../app/store";
import { moveJob, selectColumns } from "../features/jobs/jobsSlice";
import { JobCard } from "./JobCard";

function DraggableCard({ job, onOpen }: { job: Job; onOpen: (j: Job) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id, data: { status: job.status } });
  return (
    <div ref={setNodeRef} data-card-id={job.id} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }} {...listeners} {...attributes}>
      <JobCard job={job} onOpen={() => onOpen(job)} />
    </div>
  );
}

// Prefer the column under the pointer; fall back to overlap (keyboard dragging)
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

function Column({ status, jobs, onOpen, onAdd }: { status: Status; jobs: Job[]; onOpen: (j: Job) => void; onAdd: (s: Status) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const meta = STATUS_META[status];
  return (
    <section ref={setNodeRef} data-col={status} className={`column${isOver ? " column--over" : ""}`} style={{ ["--c" as string]: meta.color }}>
      <header className="column__head">
        <span className="column__dot" />
        <h3>{meta.label}</h3>
        <span className="column__count">{jobs.length}</span>
        <button className="column__add" onClick={() => onAdd(status)} aria-label={`Add job to ${meta.label}`}><Plus size={16} /></button>
      </header>
      <div className="column__list">
        {jobs.map((j) => <DraggableCard key={j.id} job={j} onOpen={onOpen} />)}
        {jobs.length === 0 && <p className="column__empty">Drop a card here</p>}
      </div>
    </section>
  );
}

export function Board({ onOpen, onAdd }: { onOpen: (j: Job) => void; onAdd: (s: Status) => void }) {
  const columns = useAppSelector(selectColumns);
  const items = useAppSelector((s) => s.jobs.items);
  const dispatch = useAppDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const active = items.find((j) => j.id === activeId);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const status = (e.over?.data.current as { status: Status } | undefined)?.status;
    const job = items.find((j) => j.id === e.active.id);
    const rect = e.active.rect.current.translated;
    if (!status || !job || !rect) return;
    // Index = number of other cards in the target column whose middle is above the dragged card's middle
    const middle = rect.top + rect.height / 2;
    const others = [...document.querySelectorAll<HTMLElement>(`[data-col="${status}"] [data-card-id]`)].filter((el) => el.dataset.cardId !== job.id);
    const at = others.findIndex((el) => { const r = el.getBoundingClientRect(); return middle < r.top + r.height / 2; });
    const index = at === -1 ? others.length : at;
    const current = job.status === status ? columns[status].findIndex((j) => j.id === job.id) : -1;
    if (current === index) return;
    dispatch(moveJob({ id: job.id, status, index }));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="board">
        {STATUSES.map((s) => <Column key={s} status={s} jobs={columns[s]} onOpen={onOpen} onAdd={onAdd} />)}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
        {active ? <JobCard job={active} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
