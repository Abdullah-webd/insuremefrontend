import React, { useEffect, useMemo, useState } from "react";
import { SectionHeading, StatCard, Surface } from "../components/AdminUi.jsx";
import { api } from "../services/api.js";
import {
  formatMoney,
  formatPercent,
  isActivePolicy,
  isClaim,
  titleCase
} from "../utils/admin.js";

function getMonthKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey) {
  if (!monthKey) return "-";
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit"
  });
}

function buildLastMonths(count = 6) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function buildLinePath(points, width, height) {
  if (!points.length) return "";
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - point * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(points, width, height) {
  if (!points.length) return "";
  const line = buildLinePath(points, width, height);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function TrendChart({ title, subtitle, primary, secondary }) {
  const width = 520;
  const height = 220;
  const maxValue = Math.max(
    ...primary.values,
    ...(secondary?.values || []),
    1
  );
  const normalize = (values) => values.map((value) => value / maxValue);
  const primaryPoints = normalize(primary.values);
  const secondaryPoints = secondary ? normalize(secondary.values) : null;

  return (
    <Surface className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
            {primary.label}
          </span>
          {secondary ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              {secondary.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#fbfdff,_#f4f8fc)] p-4">
        <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-72 w-full">
          {[0.25, 0.5, 0.75, 1].map((step) => {
            const y = height - step * height;
            return (
              <line
                key={step}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="#dbe4ef"
                strokeDasharray="4 8"
              />
            );
          })}

          <path d={buildAreaPath(primaryPoints, width, height)} fill="rgba(15,23,42,0.08)" />
          <path
            d={buildLinePath(primaryPoints, width, height)}
            fill="none"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {secondaryPoints ? (
            <path
              d={buildLinePath(secondaryPoints, width, height)}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : null}

          {primaryPoints.map((point, index) => {
            const x = (index / Math.max(primaryPoints.length - 1, 1)) * width;
            const y = height - point * height;
            return <circle key={`${primary.label}-${index}`} cx={x} cy={y} r="4" fill="#0f172a" />;
          })}

          {secondaryPoints
            ? secondaryPoints.map((point, index) => {
                const x = (index / Math.max(secondaryPoints.length - 1, 1)) * width;
                const y = height - point * height;
                return (
                  <circle
                    key={`${secondary.label}-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#0ea5e9"
                  />
                );
              })
            : null}

          {primary.labels.map((label, index) => {
            const x = (index / Math.max(primary.labels.length - 1, 1)) * width;
            return (
              <text
                key={label}
                x={x}
                y={height + 22}
                textAnchor={index === 0 ? "start" : index === primary.labels.length - 1 ? "end" : "middle"}
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

function DistributionBars({ title, subtitle, items, colorClass = "bg-slate-900" }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Surface className="p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <span className="text-sm text-slate-500">{item.displayValue || item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.colorClass || colorClass}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function RiskGauge({ averageRisk, highRiskRate }) {
  const normalized = Math.min(Math.max(Number(averageRisk || 0), 0), 100);

  return (
    <Surface className="p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Risk Temperature</p>
      <p className="mt-2 text-sm text-slate-500">
        Overall risk posture across all insurance applications.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center">
        <div
          className="relative h-52 w-52 rounded-full"
          style={{
            background: `conic-gradient(#0f172a 0% ${normalized}%, #dbe4ef ${normalized}% 100%)`
          }}
        >
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white shadow-inner">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Average</p>
              <p className="mt-2 text-4xl font-semibold text-slate-950">
                {formatPercent(normalized)}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-500">
          High-risk applications: <span className="font-semibold text-slate-800">{formatPercent(highRiskRate)}</span>
        </p>
      </div>
    </Surface>
  );
}

export default function AdminAnalyticsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getSubmissions();
        setItems(response.items || []);
      } catch (err) {
        setError(err.message || "Unable to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const analytics = useMemo(() => {
    const applications = items.filter((item) => !isClaim(item));
    const claims = items.filter((item) => isClaim(item));
    const active = applications.filter((item) => isActivePolicy(item));
    const averageRisk =
      applications.length > 0
        ? applications.reduce((sum, item) => sum + Number(item.riskScoreFinal || 0), 0) /
          applications.length
        : 0;
    const highRiskCount = applications.filter((item) => Number(item.riskScoreFinal || 0) >= 70).length;
    const approvedApplications = applications.filter(
      (item) => item.status === "approved" || item.status === "paid"
    ).length;
    const paidApplications = applications.filter((item) => item.status === "paid").length;
    const premiumVolume = applications.reduce(
      (sum, item) => sum + Number(item.premiumFinal?.amount || 0),
      0
    );
    const averagePremium = applications.length ? premiumVolume / applications.length : 0;

    const months = buildLastMonths(6);
    const applicationCounts = Object.fromEntries(months.map((month) => [month, 0]));
    const claimCounts = Object.fromEntries(months.map((month) => [month, 0]));

    items.forEach((item) => {
      const monthKey = getMonthKey(item.submittedAt || item.createdAt);
      if (!monthKey || !months.includes(monthKey)) return;
      if (isClaim(item)) {
        claimCounts[monthKey] += 1;
      } else {
        applicationCounts[monthKey] += 1;
      }
    });

    const typeBuckets = {};
    applications.forEach((item) => {
      const label = titleCase(item.type || "Unknown");
      typeBuckets[label] = (typeBuckets[label] || 0) + 1;
    });

    const statusBuckets = {
      Submitted: applications.filter((item) => item.status === "submitted").length,
      Approved: applications.filter((item) => item.status === "approved").length,
      Paid: applications.filter((item) => item.status === "paid").length,
      Rejected: applications.filter((item) => item.status === "rejected").length
    };

    const riskBands = {
      "Low (0-39%)": applications.filter((item) => Number(item.riskScoreFinal || 0) < 40).length,
      "Moderate (40-69%)": applications.filter((item) => {
        const value = Number(item.riskScoreFinal || 0);
        return value >= 40 && value < 70;
      }).length,
      "High (70-100%)": highRiskCount
    };

    return {
      total: items.length,
      applications: applications.length,
      claims: claims.length,
      active: active.length,
      premiumVolume,
      averagePremium,
      averageRisk,
      highRiskRate: applications.length ? (highRiskCount / applications.length) * 100 : 0,
      approvalRate: applications.length ? (approvedApplications / applications.length) * 100 : 0,
      paidRate: applications.length ? (paidApplications / applications.length) * 100 : 0,
      claimRate: active.length ? (claims.length / active.length) * 100 : 0,
      trend: {
        labels: months.map(getMonthLabel),
        applications: months.map((month) => applicationCounts[month]),
        claims: months.map((month) => claimCounts[month])
      },
      typeMix: Object.entries(typeBuckets)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      statusMix: Object.entries(statusBuckets).map(([label, value]) => ({ label, value })),
      riskMix: Object.entries(riskBands).map(([label, value], index) => ({
        label,
        value,
        colorClass:
          index === 0 ? "bg-emerald-500" : index === 1 ? "bg-amber-500" : "bg-rose-500"
      }))
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Analytics"
        title="Insurance Intelligence"
        description="Track application momentum, claims movement, pricing exposure, and portfolio risk in one admin-ready overview."
      />

      {error ? (
        <Surface className="p-5 text-sm text-rose-700">{error}</Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Portfolio Records"
          value={loading ? "..." : analytics.total}
          note="All applications and claims in the system"
        />
        <StatCard
          label="Premium Volume"
          value={loading ? "..." : formatMoney(analytics.premiumVolume)}
          note={`Average premium ${formatMoney(analytics.averagePremium)}`}
        />
        <StatCard
          label="Approval Rate"
          value={loading ? "..." : formatPercent(Math.round(analytics.approvalRate))}
          note={`Paid conversion ${formatPercent(Math.round(analytics.paidRate))}`}
        />
        <StatCard
          label="Claim Pressure"
          value={loading ? "..." : formatPercent(Math.round(analytics.claimRate))}
          note={`${analytics.claims} claims against ${analytics.active} active policies`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <TrendChart
          title="Insurance Trends"
          subtitle="Applications and claims over the last six months."
          primary={{
            label: "Applications",
            labels: analytics.trend.labels,
            values: analytics.trend.applications
          }}
          secondary={{
            label: "Claims",
            values: analytics.trend.claims
          }}
        />
        <RiskGauge
          averageRisk={Math.round(analytics.averageRisk)}
          highRiskRate={Math.round(analytics.highRiskRate)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <DistributionBars
          title="Insurance Mix"
          subtitle="Which insurance products are attracting the most applications."
          items={
            analytics.typeMix.length
              ? analytics.typeMix
              : [{ label: "No applications yet", value: 0, displayValue: "-" }]
          }
        />
        <DistributionBars
          title="Application Status"
          subtitle="Current underwriting and payment distribution."
          items={analytics.statusMix}
          colorClass="bg-sky-500"
        />
        <DistributionBars
          title="Risk Distribution"
          subtitle="How the application book is split by risk intensity."
          items={analytics.riskMix}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Admin Signals</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                label: "Applications",
                value: analytics.applications,
                note: "Policies customers are trying to purchase"
              },
              {
                label: "Claims",
                value: analytics.claims,
                note: "Payout requests already submitted"
              },
              {
                label: "Active Policies",
                value: analytics.active,
                note: "Policies already paid or verified"
              },
              {
                label: "Overall Risk Rate",
                value: formatPercent(Math.round(analytics.averageRisk)),
                note: "Average underwriting risk across applications"
              }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{loading ? "..." : item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Trend Notes</p>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "Applications trend",
                body:
                  analytics.trend.applications.at(-1) > analytics.trend.applications.at(-2)
                    ? "Application intake is rising compared with the previous month."
                    : "Application intake is steady or softer than the previous month."
              },
              {
                title: "Claims trend",
                body:
                  analytics.trend.claims.at(-1) > analytics.trend.claims.at(-2)
                    ? "Claims are climbing this month and may need faster admin follow-up."
                    : "Claims are stable relative to the previous month."
              },
              {
                title: "Risk posture",
                body:
                  analytics.averageRisk >= 70
                    ? "The overall risk book is elevated. Expect more manual review pressure."
                    : analytics.averageRisk >= 40
                      ? "The overall risk book is moderate with a healthy mix of standard cases."
                      : "The overall risk book is relatively low-risk right now."
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
    </div>
  );
}
