import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, CalendarCheck, PartyPopper, Percent } from "lucide-react";
import { useAppSelector } from "../app/store";
import { selectStats } from "../features/jobs/jobsSlice";
import { STATUS_META } from "../lib/types";

function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function AnalyticsPage() {
  const items = useAppSelector((s) => s.jobs.items);
  const stats = useAppSelector(selectStats);

  // Applications per week for the last 8 weeks
  const weekly = useMemo(() => {
    const now = weekStart(new Date());
    return Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setDate(start.getDate() - (7 - i) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const count = items.filter((j) => j.appliedAt && new Date(j.appliedAt) >= start && new Date(j.appliedAt) < end).length;
      return { week: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count };
    });
  }, [items]);

  // Funnel: how many reached each stage (offer ⊂ interview ⊂ applied)
  const funnel = [
    { stage: "Applied", value: stats.applied },
    { stage: "Responded", value: stats.byStatus.filter((b) => ["interview", "offer", "rejected"].includes(b.status)).reduce((a, b) => a + b.count, 0) },
    { stage: "Interview", value: stats.interviews + stats.offers },
    { stage: "Offer", value: stats.offers },
  ];

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((j) => j.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);

  const kpis = [
    { icon: Briefcase, label: "Applications", value: stats.applied, color: "#6366f1" },
    { icon: Percent, label: "Response rate", value: `${stats.responseRate}%`, color: "#0ea5e9" },
    { icon: CalendarCheck, label: "Interviews", value: stats.interviews, color: "#f59e0b" },
    { icon: PartyPopper, label: "Offers", value: stats.offers, color: "#10b981" },
  ];

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Analytics</h1>
          <p className="muted">How your search is trending.</p>
        </div>
      </header>

      <div className="kpis">
        {kpis.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="kpi" style={{ ["--k" as string]: color }}>
            <span className="kpi__icon"><Icon size={20} /></span>
            <div><strong>{value}</strong><small>{label}</small></div>
          </div>
        ))}
      </div>

      <div className="charts">
        <section className="panel panel--wide">
          <h2>Applications per week</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekly} margin={{ left: -20, right: 8, top: 10 }}>
              <defs>
                <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8f0" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="count" name="Applications" stroke="#6366f1" strokeWidth={2.5} fill="url(#fillA)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Pipeline</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.byStatus.filter((b) => b.count)} dataKey="count" nameKey="status" innerRadius={58} outerRadius={90} paddingAngle={3}>
                {stats.byStatus.filter((b) => b.count).map((b) => <Cell key={b.status} fill={STATUS_META[b.status].color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, STATUS_META[n as keyof typeof STATUS_META]?.label ?? n]} contentStyle={{ borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="legend">
            {stats.byStatus.map((b) => (
              <li key={b.status}><i style={{ background: STATUS_META[b.status].color }} />{STATUS_META[b.status].label}<b>{b.count}</b></li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Conversion funnel</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 13, fill: "#334155" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="value" name="Jobs" radius={[0, 8, 8, 0]} barSize={26}>
                {funnel.map((_, i) => <Cell key={i} fill={["#6366f1", "#0ea5e9", "#f59e0b", "#10b981"][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Most-applied skills</h2>
          <ul className="bars">
            {topTags.map(([tag, n]) => (
              <li key={tag}>
                <span>{tag}</span>
                <div className="bars__track"><div style={{ width: `${(n / (topTags[0]?.[1] ?? 1)) * 100}%` }} /></div>
                <b>{n}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
