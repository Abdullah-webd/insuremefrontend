import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function VerifierLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("insureme_user") || "{}");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(240,249,255,0.4),_transparent_40%),_#f8fafc] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 overflow-hidden rounded-[32px] border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md xl:block">
          <div className="flex h-full flex-col">
            <div className="rounded-[28px] border border-sky-100 bg-sky-600 p-5 text-white shadow-lg shadow-sky-200">
              <p className="text-[10px] uppercase tracking-[0.4em] text-sky-100 font-bold">
                Assurance Hub
              </p>
              <h1 className="mt-3 font-serif text-2xl leading-tight">
                Verifier Portal
              </h1>
              <p className="mt-3 text-xs text-sky-50 text-balance opacity-80">
                Independent verification and data integrity audits.
              </p>
            </div>

            <nav className="mt-8 space-y-2">
              <NavLink
                to="/verifier/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                      : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Tasks</span>
              </NavLink>
            </nav>

            <div className="mt-auto rounded-[28px] border border-slate-100 bg-white/50 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">
                Verifier ID
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-700 truncate">
                {user.name || "Officer"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("insureme_token");
                  localStorage.removeItem("insureme_user");
                  navigate("/login");
                }}
                className="mt-4 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
