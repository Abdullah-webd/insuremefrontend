import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading, StatCard, StatusBadge, Surface } from "../components/AdminUi.jsx";
import { api } from "../services/api.js";
import {
  formatDate,
  formatMoney,
  formatPercent,
  getSummaryMedia,
  isClaim,
  titleCase
} from "../utils/admin.js";

export default function AdminApplicationsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getSubmissions();
        setSubmissions((response.items || []).filter((item) => !isClaim(item)));
      } catch (err) {
        setError(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    let items = submissions;
    if (tab === "approved") {
      items = items.filter((item) => item.status === "approved" || item.status === "paid");
    }
    if (tab === "pending") {
      items = items.filter((item) => item.status === "pending" || item.status === "submitted");
    }
    if (!query.trim()) return items;

    const search = query.toLowerCase();
    return items.filter((item) => {
      const name = item.data?.full_name || "";
      return (
        item.userId?.toLowerCase().includes(search) ||
        item.type?.toLowerCase().includes(search) ||
        name.toLowerCase().includes(search)
      );
    });
  }, [query, submissions, tab]);

  const stats = useMemo(() => {
    const approved = submissions.filter(
      (item) => item.status === "approved" || item.status === "paid"
    ).length;
    const pending = submissions.filter(
      (item) => item.status === "pending" || item.status === "submitted"
    ).length;
    const value = submissions.reduce(
      (sum, item) => sum + Number(item.premiumFinal?.amount || 0),
      0
    );

    return {
      total: submissions.length,
      approved,
      pending,
      value
    };
  }, [submissions]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Applications"
        title="Insurance Applications"
        description="Browse every insurance application in a clean review queue, then open a dedicated detail page for deeper underwriting decisions."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="All Applications" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Pending Review" value={stats.pending} />
        <StatCard label="Quoted Value" value={formatMoney(stats.value)} />
      </div>

      <Surface className="p-5">
        <div className="flex flex-wrap items-center gap-3">
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

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, type, or user id"
            className="ml-auto w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 sm:w-80"
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            Loading applications...
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 lg:grid">
              <span>Applicant</span>
              <span>Insurance Type</span>
              <span>Risk Score</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-slate-200">
              {filtered.map((item) => {
                const preview = getSummaryMedia(item);
                return (
                  <Link
                    key={item._id}
                    to={`/admin/applications/${item._id}`}
                    className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr]"
                  >
                    <div className="flex items-center gap-4">
                      {preview ? (
                        <img
                          src={preview}
                          alt={item.data?.full_name || item.userId}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {item.type?.slice(0, 2) || "NA"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.data?.full_name || item.userId}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.data?.email || "No email"} · {formatDate(item.submittedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-slate-700">{titleCase(item.type || "-")}</div>
                    <div className="text-sm text-slate-700">
                      {formatPercent(item.riskScoreFinal)}
                    </div>
                    <div className="text-sm text-slate-700">
                      {formatMoney(item.premiumFinal?.amount, item.premiumFinal?.currency || "NGN")}
                    </div>
                    <div>
                      <StatusBadge status={item.status} />
                    </div>
                  </Link>
                );
              })}

              {!filtered.length ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  No applications match this filter yet.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}
