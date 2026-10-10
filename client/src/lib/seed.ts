import type { Job, Priority, Status } from "./types";

const day = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();
const ahead = (d: number, h = 11) => {
  const t = new Date(Date.now() + d * day);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

type Row = [company: string, role: string, location: string, salary: string, status: Status, priority: Priority, appliedDaysAgo: number | null, tags: string[], interviewInDays?: number, notes?: string];

const ROWS: Row[] = [
  ["Razorpay", "Frontend Engineer II", "Bengaluru · Hybrid", "₹28–34 LPA", "interview", "high", 12, ["React", "TypeScript"], 2, "Round 2: system design for a payments dashboard. Revise React performance + caching."],
  ["Atlassian", "Software Engineer, Frontend", "Remote · India", "₹40–48 LPA", "interview", "high", 18, ["React", "Design systems"], 5, "Hiring manager chat went well. Next: pair-programming round."],
  ["Postman", "Senior UI Engineer", "Bengaluru", "₹35–42 LPA", "applied", "high", 4, ["React", "Redux"]],
  ["Swiggy", "SDE 2 — Web", "Bengaluru · Hybrid", "₹30–36 LPA", "applied", "medium", 6, ["React", "Node.js"]],
  ["Freshworks", "Frontend Developer", "Chennai", "₹22–26 LPA", "applied", "medium", 9, ["Ember", "React"]],
  ["Zoho", "Member Technical Staff", "Chennai", "₹14–18 LPA", "applied", "low", 15, ["JavaScript"]],
  ["CRED", "Frontend Engineer", "Bengaluru", "₹32–38 LPA", "offer", "high", 30, ["React", "Animations"], undefined, "Offer received 🎉 Joining bonus + ESOPs. Respond by Friday."],
  ["Microsoft", "Software Engineer II", "Hyderabad", "₹38–45 LPA", "wishlist", "high", null, ["TypeScript", "Azure"]],
  ["Vercel", "Design Engineer", "Remote", "$90–110k", "wishlist", "medium", null, ["Next.js", "Motion"]],
  ["Thoughtworks", "Application Developer", "Pune · Hybrid", "₹18–24 LPA", "rejected", "medium", 26, ["React", "TDD"], undefined, "Feedback: strong UI, practise more testing questions."],
  ["Flipkart", "UI Engineer 2", "Bengaluru", "₹28–33 LPA", "rejected", "low", 34, ["React", "Web perf"]],
  ["Notion", "Product Engineer", "Remote", "$120–140k", "wishlist", "medium", null, ["React", "Collaboration"]],
  ["Zomato", "Frontend Engineer", "Gurugram", "₹26–30 LPA", "applied", "medium", 2, ["React Native", "React"]],
  ["Uber", "Frontend Engineer", "Hyderabad", "₹40–50 LPA", "interview", "medium", 21, ["React", "GraphQL"], 9],
];

export function seedJobs(): Job[] {
  const counters: Partial<Record<Status, number>> = {};
  return ROWS.map(([company, role, location, salary, status, priority, appliedDaysAgo, tags, interviewIn, notes], i) => {
    const created = ago((appliedDaysAgo ?? 3) + 1);
    counters[status] = (counters[status] ?? 0) + 1;
    return {
      id: `seed-${i + 1}`,
      company, role, location, salary, status, priority, tags,
      url: "",
      order: counters[status]! - 1,
      appliedAt: appliedDaysAgo == null ? null : ago(appliedDaysAgo),
      interviewAt: interviewIn == null ? null : ahead(interviewIn, 10 + (i % 6)),
      notes: notes ?? "",
      createdAt: created,
      updatedAt: created,
    };
  });
}
