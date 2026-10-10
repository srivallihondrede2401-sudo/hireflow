import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/store";
import { clearError, login, register } from "../features/auth/authSlice";
import { api } from "../lib/api";
import { Logo } from "../components/Layout";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { pending, error } = useAppSelector((s) => s.auth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(api.mode === "demo" ? "demo@hireflow.app" : "");
  const [password, setPassword] = useState(api.mode === "demo" ? "demo1234" : "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(mode === "login" ? login({ email, password }) : register({ name, email, password }));
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    dispatch(clearError());
  };

  return (
    <div className="auth">
      <section className="auth__pitch">
        <Logo />
        <h1>Your job hunt,<br /><span>organised.</span></h1>
        <p>Track every application on a drag-and-drop board, never miss an interview, and see what's working with live analytics.</p>
        <ul>
          {["Kanban board with drag & drop", "Interview reminders & notes", "Response-rate and funnel analytics", "Secure JWT auth with a MongoDB API"].map((f) => (
            <li key={f}><CheckCircle2 size={18} /> {f}</li>
          ))}
        </ul>
      </section>

      <form className="auth__card" onSubmit={submit}>
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">{mode === "login" ? "Log in to see your board." : "It takes less than a minute."}</p>

        {api.mode === "demo" && mode === "login" && (
          <div className="demo-banner"><Sparkles size={16} /> Demo account is pre-filled — just hit <strong>Log in</strong>.</div>
        )}

        {mode === "register" && <label>Name<input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>}
        <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={mode === "register" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn--primary btn--block" disabled={pending}>
          {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"} <ArrowRight size={16} />
        </button>
        <p className="auth__switch">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode}>{mode === "login" ? "Create an account" : "Log in"}</button>
        </p>
      </form>
    </div>
  );
}
