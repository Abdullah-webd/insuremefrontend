import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ADMIN_NAV_ITEMS } from "../utils/admin.js";

function Icon({ kind, className = "h-5 w-5" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (kind === "folder") {
    return (
      <svg {...props}>
        <path d="M3 7.5h5l2 2H21v9A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5z" />
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5" />
      </svg>
    );
  }

  if (kind === "shield") {
    return (
      <svg {...props}>
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
        <path d="M9.5 12.5l1.7 1.7 3.3-3.7" />
      </svg>
    );
  }

  if (kind === "users") {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="8" r="3.5" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M15.5 4.2a3.5 3.5 0 0 1 0 6.6" />
      </svg>
    );
  }

  if (kind === "chart") {
    return (
      <svg {...props}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19v-4" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h16" />
    </svg>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,235,238,0.35),_transparent_30%),linear-gradient(180deg,_#fff7f7_0%,_#fff_60%)] text-red-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:block">
          <div className="flex h-full flex-col">
            <div className="rounded-[28px] border border-red-200 bg-red-700 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.35em] text-red-100">Heirs Insurance</p>
              <h1 className="mt-3 font-serif text-3xl leading-none">Admin Console</h1>
              <p className="mt-3 text-sm text-red-100">
                Underwriting, approvals, and claim follow-up in one place.
              </p>
            </div>

            <nav className="mt-8 space-y-2">
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-red-800 text-white shadow-[0_16px_30px_rgba(139,0,0,0.16)]"
                          : "text-slate-600 hover:bg-red-50 hover:text-red-800"
                    }`
                  }
                >
                  <Icon kind={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto rounded-[28px] border border-red-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-red-400">Admin Access</p>
              <p className="mt-2 text-sm text-red-600">
                Signed in with the demo admin workspace.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("insureme_admin_auth");
                  navigate("/login");
                }}
                className="mt-4 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-800 transition hover:border-red-300 hover:text-red-900"
              >
                Log Out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 xl:hidden">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-red-400">Heirs Insurance</p>
                <h1 className="mt-2 font-serif text-3xl leading-none">Admin Console</h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("insureme_admin_auth");
                  navigate("/login");
                }}
                className="rounded-2xl border border-red-200 px-4 py-2 text-sm text-red-800"
              >
                Log Out
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2 xl:hidden">
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                      isActive
                        ? "border-red-800 bg-red-800 text-white"
                          : "border-slate-200 bg-white text-slate-600"
                    }`
                  }
                >
                  <Icon kind={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
