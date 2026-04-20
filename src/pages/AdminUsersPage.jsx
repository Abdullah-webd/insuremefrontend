import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading, Surface } from "../components/AdminUi.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../utils/admin.js";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getUsers()
      .then((response) => setUsers(response.items || []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Users"
        title="Customer Directory"
        description="A lightweight directory keeps personal details easy to scan without crowding the underwriting flow."
      />

      <Surface className="p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((user) => (
            <Link
              key={user._id}
              to={`/admin/users/${user.userId}`}
              className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
            >
              <p className="text-base font-semibold text-slate-900 sm:text-lg break-all">
                {user.profile?.full_name || "User " + user.userId.slice(-4)}
              </p>
              <p className="mt-0.5 text-[10px] font-mono text-slate-400 uppercase tracking-[0.1em]">
                ID: {user.userId}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {user.profile?.email || "No email available"}
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p className="truncate" title={user.profile?.phone || "-"}>
                  Phone: {user.profile?.phone || "-"}
                </p>
                <p className="truncate" title={formatDate(user.createdAt)}>
                  Joined: {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                Open user dashboard
              </div>
            </Link>
          ))}
        </div>
      </Surface>
    </div>
  );
}
