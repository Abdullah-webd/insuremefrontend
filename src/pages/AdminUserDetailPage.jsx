import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SectionHeading, StatCard, Surface } from "../components/AdminUi.jsx";
import { api } from "../services/api.js";
import {
  formatDate,
  formatMoney,
  formatPercent,
  isActivePolicy,
  isClaim,
  titleCase
} from "../utils/admin.js";

function buildMonthKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey) {
  if (!monthKey) return "-";
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit"
  });
}

function recentMonths(count = 6) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function miniLine(values) {
  const width = 280;
  const height = 92;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - (value / max) * height;
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  });
  return points.join(" ");
}

function UserTrendCard({ title, note, values, labels, stroke = "#0f172a" }) {
  return (
    <Surface className="p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
      <div className="mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#fbfdff,_#f4f8fc)] p-4">
        <svg viewBox="0 0 280 118" className="h-36 w-full">
          {[0.25, 0.5, 0.75, 1].map((step) => {
            const y = 92 - step * 92;
            return (
              <line
                key={step}
                x1="0"
                y1={y}
                x2="280"
                y2={y}
                stroke="#dbe4ef"
                strokeDasharray="4 8"
              />
            );
          })}
          <path d={miniLine(values)} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          {values.map((value, index) => {
            const x = (index / Math.max(values.length - 1, 1)) * 280;
            const max = Math.max(...values, 1);
            const y = 92 - (value / max) * 92;
            return <circle key={`${title}-${index}`} cx={x} cy={y} r="4" fill={stroke} />;
          })}
          {labels.map((label, index) => {
            const x = (index / Math.max(labels.length - 1, 1)) * 280;
            return (
              <text
                key={label}
                x={x}
                y="114"
                textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
                fontSize="12"
                fill="#64748b"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </Surface>
  );
}

function DistributionCard({ title, items }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Surface className="p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <span className="text-sm text-slate-500">{item.displayValue || item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.color || "bg-slate-900"}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [userResponse, submissionsResponse] = await Promise.all([
          api.getUser(userId),
          api.getSubmissions({ userId, limit: 100 })
        ]);
        setUser(userResponse.user);
        setItems(submissionsResponse.items || []);
      } catch (err) {
        setError(err.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const data = useMemo(() => {
    const applications = items.filter((item) => !isClaim(item));
    const claims = items.filter((item) => isClaim(item));
    const activePolicies = applications.filter((item) => isActivePolicy(item));
    const sourceApplication = applications.find(Boolean);
    const resolvedName =
      user?.profile?.full_name ||
      sourceApplication?.data?.full_name ||
      user?.userId ||
      "-";
    const resolvedPhone =
      user?.profile?.phone ||
      sourceApplication?.data?.phone ||
      "-";
    const avgRisk =
      applications.length > 0
        ? applications.reduce((sum, item) => sum + Number(item.riskScoreFinal || 0), 0) /
          applications.length
        : 0;
    const claimRate = activePolicies.length
      ? (claims.length / activePolicies.length) * 100
      : 0;
    const premiumVolume = applications.reduce(
      (sum, item) => sum + Number(item.premiumFinal?.amount || 0),
      0
    );

    const months = recentMonths(6);
    const appCounts = Object.fromEntries(months.map((month) => [month, 0]));
    const claimCounts = Object.fromEntries(months.map((month) => [month, 0]));

    items.forEach((item) => {
      const month = buildMonthKey(item.submittedAt || item.createdAt);
      if (!month || !months.includes(month)) return;
      if (isClaim(item)) {
        claimCounts[month] += 1;
      } else {
        appCounts[month] += 1;
      }
    });

    return {
      resolvedName,
      resolvedPhone,
      applications,
      claims,
      activePolicies,
      avgRisk,
      claimRate,
      premiumVolume,
      trendLabels: months.map(monthLabel),
      applicationTrend: months.map((month) => appCounts[month]),
      claimTrend: months.map((month) => claimCounts[month]),
      statusMix: [
        {
          label: "Applications",
          value: applications.length,
          color: "bg-slate-900"
        },
        {
          label: "Claims",
          value: claims.length,
          color: "bg-sky-500"
        },
        {
          label: "Active Policies",
          value: activePolicies.length,
          color: "bg-emerald-500"
        }
      ],
      riskMix: [
        {
          label: "Average Risk Rate",
          value: Number(avgRisk || 0),
          displayValue: formatPercent(Math.round(avgRisk)),
          color: "bg-amber-500"
        },
        {
          label: "Claim Rate",
          value: Number(claimRate || 0),
          displayValue: formatPercent(Math.round(claimRate)),
          color: "bg-rose-500"
        }
      ]
    };
  }, [items, user]);

  if (loading) {
    return (
      <Surface className="p-10 text-center text-sm text-slate-500">
        Loading user dashboard...
      </Surface>
    );
  }

  if (error || !user) {
    return (
      <Surface className="p-10 text-center text-sm text-rose-700">
        {error || "User not found"}
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="User Detail"
        title={data.resolvedName}
        description="See the full user picture at a glance: applications, claims, portfolio risk, and direct links into every record."
        action={
          <Link
            to="/admin/users"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Back to users
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="User ID"
          value={user.userId}
          note={`Joined ${formatDate(user.createdAt)}`}
          valueClassName="text-xl break-all leading-tight"
        />
        <StatCard
          label="Phone Number"
          value={data.resolvedPhone}
          valueClassName="text-xl break-all leading-tight"
        />
        <StatCard label="Applications" value={data.applications.length} />
        <StatCard label="Claims" value={data.claims.length} />
        <StatCard label="Premium Volume" value={formatMoney(data.premiumVolume)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">User Summary</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { label: "Full Name", value: data.resolvedName },
              { label: "Phone Number", value: data.resolvedPhone },
              { label: "Applications", value: data.applications.length },
              { label: "Claims", value: data.claims.length },
              { label: "Active Policies", value: data.activePolicies.length },
              { label: "Average Risk Rate", value: formatPercent(Math.round(data.avgRisk)) }
            ].map((item) => (
              <div key={item.label} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-4 break-words text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </Surface>

        <DistributionCard
          title="User Risk Snapshot"
          items={data.riskMix}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <UserTrendCard
          title="Application Trend"
          note="How often this user has started insurance applications in recent months."
          values={data.applicationTrend}
          labels={data.trendLabels}
          stroke="#0f172a"
        />
        <UserTrendCard
          title="Claim Trend"
          note="How often this user has submitted claims in recent months."
          values={data.claimTrend}
          labels={data.trendLabels}
          stroke="#0ea5e9"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DistributionCard
          title="Portfolio Mix"
          items={data.statusMix}
        />

        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">User Insights</p>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "Claim behaviour",
                body:
                  data.claimRate >= 100
                    ? "This user is claiming as often as, or more often than, their active policy count. Manual review should stay tight."
                    : data.claimRate > 0
                      ? "This user has an active claims history, but it remains below their total active policy count."
                      : "This user has not filed any claims yet."
              },
              {
                title: "Risk posture",
                body:
                  data.avgRisk >= 70
                    ? "Applications for this user lean high-risk and should keep manual underwriting in the loop."
                    : data.avgRisk >= 40
                      ? "This user sits in a moderate-risk band with balanced application quality."
                      : "This user currently trends low-risk across their applications."
              },
              {
                title: "Portfolio depth",
                body:
                  data.activePolicies.length > 1
                    ? "This user has multiple active policies, so cross-selling and retention prompts may be valuable."
                    : data.activePolicies.length === 1
                      ? "This user has one active policy and may be a good candidate for expansion."
                      : "This user does not yet have an active paid policy."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Insurance Applications</p>
              <p className="mt-2 text-sm text-slate-500">
                All insurance applications linked to this user.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
              {data.applications.length} total
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {data.applications.map((item) => (
              <div key={item._id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{titleCase(item.type || "Application")}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(item.submittedAt)} · Risk {formatPercent(item.riskScoreFinal || 0)}
                </p>
                <Link
                  to={`/admin/applications/${item._id}`}
                  className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  Go to insurance application
                </Link>
              </div>
            ))}
            {!data.applications.length ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No insurance applications found for this user.
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Claims</p>
              <p className="mt-2 text-sm text-slate-500">
                All claim records linked to this user.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
              {data.claims.length} total
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {data.claims.map((item) => (
              <div key={item._id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{titleCase(item.type || "Claim")}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(item.submittedAt)} · Status {titleCase(item.status || "-")}
                </p>
                <Link
                  to={`/admin/claims/${item._id}`}
                  className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  Go to claim
                </Link>
              </div>
            ))}
            {!data.claims.length ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No claims found for this user.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>
    </div>
  );
}
