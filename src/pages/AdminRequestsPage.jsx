import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function AdminRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      setItems(res.items || []);
    } catch (err) {
      alert(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Requests</h2>
        <div className="text-sm text-slate-500">{loading ? "Loading..." : `${items.length} requests`}</div>
      </div>

      <div className="space-y-2">
        {items.map((r) => (
          <Link
            key={r._id}
            to={`/admin/requests/${r._id}`}
            className="block p-4 border rounded-lg hover:shadow"
          >
            <div className="font-medium">{r.title || "User request"}</div>
            <div className="text-xs text-slate-500">{r.userName || r.userId} • {new Date(r.createdAt).toLocaleString()}</div>
            <div className="mt-2 text-sm text-slate-700">{r.message ? r.message.slice(0, 180) : "(no message)"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
