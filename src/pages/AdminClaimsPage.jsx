import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading, StatusBadge, Surface } from "../components/AdminUi.jsx";
import { api } from "../services/api.js";
import { formatDate, isClaim, titleCase } from "../utils/admin.js";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    const load = async () => {
      const response = await api.getSubmissions();
      setClaims((response.items || []).filter((item) => isClaim(item)));
    };

    load().catch(() => setClaims([]));
  }, []);

  const filtered = useMemo(() => {
    if (tab === "approved") {
      return claims.filter((item) => item.status === "approved" || item.status === "paid");
    }
    if (tab === "pending") {
      return claims.filter((item) => item.status === "submitted" || item.status === "pending");
    }
    return claims;
  }, [claims, tab]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Claims"
        title="Claims Queue"
        description="Claims now have their own review path, with claimant history and supporting evidence kept separate from the original insurance application."
      />

      <Surface className="p-5">
        <div className="flex flex-wrap gap-2">
          {["all", "approved", "pending"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full border px-4 py-2 text-sm ${
                tab === item
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {titleCase(item)}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((claim) => (
            <Link
              key={claim._id}
              to={`/admin/claims/${claim._id}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 px-5 py-4 transition hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{claim.data?.full_name || claim.userId}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {claim.type} - {formatDate(claim.submittedAt)}
                </p>
              </div>
              <StatusBadge status={claim.status} />
            </Link>
          ))}

          {!filtered.length ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              No claims in this tab yet.
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
