import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Github, KanbanSquare, LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/store";
import { logout } from "../features/auth/authSlice";
import { api } from "../lib/api";

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden><rect width="64" height="64" rx="16" fill="#4f46e5" /><path d="M18 20h8v24h-8zM30 28h8v16h-8zM42 14h8v30h-8z" fill="#fff" /></svg>
      HireFlow
    </span>
  );
}

export function Layout() {
  const user = useAppSelector((s) => s.auth.session?.user);
  const dispatch = useAppDispatch();
  return (
    <div className="shell">
      <aside className="nav">
        <Logo />
        <nav>
          <NavLink to="/" end><KanbanSquare size={18} /> <span>Board</span></NavLink>
          <NavLink to="/analytics"><BarChart3 size={18} /> <span>Analytics</span></NavLink>
        </nav>
        <div className="nav__bottom">
          {api.mode === "demo" && <p className="demo-note">Demo mode — data is saved in your browser.</p>}
          <a className="nav__gh" href="https://github.com/srivallihondrede2401-sudo/hireflow" target="_blank" rel="noopener noreferrer"><Github size={16} /> <span>Source code</span></a>
          <div className="me">
            <span className="me__avatar">{user?.name[0]?.toUpperCase()}</span>
            <div className="me__info"><strong>{user?.name}</strong><small>{user?.email}</small></div>
            <button className="icon-btn" onClick={() => dispatch(logout())} aria-label="Log out" title="Log out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
