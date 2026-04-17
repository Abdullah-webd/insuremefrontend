import React, { useEffect, useMemo, useState } from "react";
import { api, uploadToCloudinary } from "../services/api.js";
import { getPresetForType } from "../config/insuranceFields.js";

const STATUS_STYLES = {
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200"
};

const ARRAY_FIELDS = new Set([
  "evidence",
  "documents",
  "property_images",
  "car_images"
]);

function titleCase(text = "") {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function isClaim(submission) {
  const t = (submission?.type || "").toLowerCase();
  const wf = (submission?.workflowId || "").toLowerCase();
  return t.includes("claim") || wf.includes("claim");
}

function isActivePolicy(submission) {
  return (
    (submission?.status === "paid" || submission?.paymentStatus === "success") &&
    !isClaim(submission)
  );
}

function isVideo(url = "") {
  return url.includes("/video/") || url.endsWith(".mp4") || url.endsWith(".webm");
}

function MediaPreview({ value }) {
  if (!value) return null;
  const urls = Array.isArray(value) ? value : [value];
  return (
    <div className="space-y-2">
      {urls.map((url) => (
        <div key={url} className="border border-slate-200 rounded-xl p-2">
          {isVideo(url) ? (
            <video src={url} controls className="w-full rounded-lg" />
          ) : (
            <img src={url} alt="media" className="w-full rounded-lg" />
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${
        STATUS_STYLES[status] || "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [verificationState, setVerificationState] = useState({});
  const [urlReplacements, setUrlReplacements] = useState([]);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("submissions");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getSubmissions();
      setSubmissions(data.items || []);
      if (!selected && data.items?.length) setSelected(data.items[0]);
      const u = await api.getUsers();
      setUsers(u.items || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected?.adminNotes?.manual_verifications) {
      setVerificationState(selected.adminNotes.manual_verifications);
    } else {
      setVerificationState({});
    }
  }, [selected]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, filterType, section]);

  const insuranceTypes = useMemo(() => {
    const types = new Set(submissions.map((s) => s.type).filter(Boolean));
    return ["all", ...types];
  }, [submissions]);

  const list = useMemo(() => {
    let listItems = submissions.filter((s) =>
      section === "claims" ? isClaim(s) : !isClaim(s)
    );

    if (tab === "approved") {
      listItems = listItems.filter(
        (s) => s.status === "approved" || s.status === "paid"
      );
    }
    if (tab === "pending") {
      listItems = listItems.filter(
        (s) => s.status === "submitted" || s.status === "pending"
      );
    }
    if (filterType !== "all") {
      listItems = listItems.filter((s) => s.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      listItems = listItems.filter(
        (s) =>
          s.userId.toLowerCase().includes(q) ||
          (s.type || "").toLowerCase().includes(q)
      );
    }
    return listItems;
  }, [submissions, section, tab, filterType, search]);

  const pagedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));

  const analytics = useMemo(() => {
    const total = submissions.length;
    const claims = submissions.filter((s) => isClaim(s)).length;
    const active = submissions.filter((s) => isActivePolicy(s)).length;
    const approved = submissions.filter((s) => s.status === "approved").length;
    return { total, claims, active, approved };
  }, [submissions]);

  const handleVerify = (field) => {
    setVerificationState((prev) => ({ ...prev, [field]: "verifying" }));
    setTimeout(() => {
      const ok = Math.random() > 0.2;
      setVerificationState((prev) => ({
        ...prev,
        [field]: ok ? "verified" : "failed"
      }));
    }, 800);
  };

  const handleUpload = async (file, currentValue) => {
    try {
      const url = await uploadToCloudinary(file);
      setUrlReplacements((prev) => [...prev, { from: currentValue, to: url }]);
    } catch (err) {
      alert(err.message || "Upload failed");
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const form = document.getElementById("detail-form");
    const raw = Object.fromEntries(new FormData(form).entries());

    const collected_fields = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (value === "") return;
      if (ARRAY_FIELDS.has(key)) {
        collected_fields[key] = value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      } else {
        collected_fields[key] = value;
      }
    });

    const body = {
      user: { workflow: { collected_fields } },
      submission_updates: {
        riskScoreFinal: raw.riskScoreFinal ? Number(raw.riskScoreFinal) : undefined,
        premiumFinal: raw.premiumAmount
          ? {
              amount: Number(raw.premiumAmount),
              currency: raw.premiumCurrency || "NGN",
              period: "year"
            }
          : undefined,
        adminNotes: { manual_verifications: verificationState },
        status: raw.status
      },
      url_replacements: { items: urlReplacements },
      require_cloudinary: true
    };

    try {
      const updated = await api.updateUserProfile(selected.userId, body);
      setSelected(updated.submission || selected);
      const refresh = await api.getSubmissions();
      setSubmissions(refresh.items || []);
      setUrlReplacements([]);
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveSubmission = async () => {
    if (!selected) return;
    if (selected.status === "approved" || selected.status === "paid") return;
    const premiumAmount = Number(
      document.getElementById("premiumAmount")?.value || 0
    );
    const premiumCurrency =
      document.getElementById("premiumCurrency")?.value || "NGN";

    try {
      await api.approveSubmission(selected._id, {
        premiumFinal: {
          amount: premiumAmount,
          currency: premiumCurrency,
          period: "year"
        }
      });
      const refresh = await api.getSubmissions();
      setSubmissions(refresh.items || []);
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handleApproveClaim = async () => {
    if (!selected) return;
    if (selected.status === "approved" || selected.status === "paid") return;

    try {
      await api.updateUserProfile(selected.userId, {
        user: { workflow: { collected_fields: {} } },
        submission_updates: {
          status: "approved",
          adminNotes: {
            manual_verifications: verificationState,
            claim_note:
              "Claim approved. Customer will be contacted and paid soon."
          }
        }
      });

      const user = users.find((u) => u.userId === selected.userId);
      const email = user?.profile?.email || selected.data?.email;
      if (email) {
        await api.sendEmail({
          to: email,
          subject: "Your claim has been approved",
          text: "Your claim has been approved. You will be contacted and paid soon."
        });
      }

      const refresh = await api.getSubmissions();
      setSubmissions(refresh.items || []);
    } catch (err) {
      alert(err.message || "Claim approval failed");
    }
  };

  const openProfile = async (userId) => {
    try {
      const data = await api.getUser(userId);
      setProfile(data.user);
      setProfileOpen(true);
    } catch (err) {
      alert(err.message || "Failed to load user profile");
    }
  };

  const selectedPreset = selected ? getPresetForType(selected.type) : null;
  const selectedData = selected?.data || {};
  const presetKeys = selectedPreset
    ? selectedPreset.fields.map((f) => f.key)
    : [];
  const extraKeys = Object.keys(selectedData).filter(
    (key) => !presetKeys.includes(key)
  );
  const fieldRows = selectedPreset
    ? [
        ...selectedPreset.fields,
        ...extraKeys.map((key) => ({ key, label: titleCase(key) }))
      ]
    : [];

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm h-fit">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Admin Console</h2>
            <p className="text-xs text-slate-500">Insurance management</p>
          </div>
          {["submissions", "claims", "users", "analytics"].map((item) => (
            <button
              key={item}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm border ${
                section === item
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-200 text-slate-600"
              }`}
              onClick={() => setSection(item)}
            >
              {titleCase(item)}
            </button>
          ))}
        </div>
      </aside>

      <main className="space-y-6">
        {error && (
          <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {loading && (
          <div className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
            Loading dashboard...
          </div>
        )}

        {(section === "submissions" || section === "claims") && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {["all", "approved", "pending"].map((t) => (
                <button
                  key={t}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    tab === t
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                  onClick={() => setTab(t)}
                >
                  {titleCase(t)}
                </button>
              ))}
              <select
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {insuranceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Types" : t}
                  </option>
                ))}
              </select>
              <input
                className="ml-auto px-3 py-2 border border-slate-200 rounded-xl text-sm"
                placeholder="Search by userId or type"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-6">
              <div className="border border-slate-200 rounded-2xl shadow-sm p-4 bg-white">
                <div className="space-y-3 max-h-[70vh] overflow-auto scrollbar-thin pr-1">
                  {pagedList.map((s) => (
                    <button
                      key={s._id}
                      className={`w-full text-left p-3 border rounded-xl transition ${
                        selected?._id === s._id
                          ? "border-slate-900"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                      onClick={() => setSelected(s)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{s.type}</p>
                          <p className="text-xs text-slate-500">{s.userId}</p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Submitted {formatDate(s.submittedAt)}
                      </p>
                    </button>
                  ))}
                  {pagedList.length === 0 && (
                    <p className="text-sm text-slate-500">No items found.</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                  <button
                    className="px-3 py-2 border border-slate-200 rounded-xl"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="px-3 py-2 border border-slate-200 rounded-xl"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl shadow-sm p-6 bg-white">
                {!selected ? (
                  <p className="text-sm text-slate-500">Select an item to view details.</p>
                ) : (
                  <form id="detail-form" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Detail</h3>
                        <p className="text-xs text-slate-500">{selected._id}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openProfile(selected.userId)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        >
                          View User Profile
                        </button>
                        <StatusBadge status={selected.status} />
                      </div>
                    </div>

                    <section>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {selectedPreset?.label || "Submission"} Fields
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        {fieldRows.map((field) => {
                          const value = selectedData[field.key];
                          const isMedia = field.media || ARRAY_FIELDS.has(field.key);
                          return (
                            <div key={field.key} className="space-y-2">
                              <label className="text-xs font-semibold text-slate-600">
                                {field.label}
                              </label>
                              <input
                                name={field.key}
                                defaultValue={Array.isArray(value) ? value.join(", ") : value ?? ""}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                              />
                              {isMedia && <MediaPreview value={value} />}
                              {isMedia && value && (
                                <div className="space-y-2">
                                  {(Array.isArray(value) ? value : [value]).map((url) => (
                                    <div key={url} className="flex items-center gap-2 text-xs">
                                      <span className="truncate max-w-[220px] text-slate-500">
                                        {url}
                                      </span>
                                      <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleUpload(file, url);
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {field.verify && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(field.key)}
                                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs"
                                >
                                  Verify {field.label}: {verificationState[field.key] || "pending"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Risk Score</label>
                        <input
                          id="riskScoreFinal"
                          name="riskScoreFinal"
                          defaultValue={selected.riskScoreFinal ?? ""}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Status</label>
                        <select
                          id="status"
                          name="status"
                          defaultValue={selected.status}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        >
                          <option value="submitted">submitted</option>
                          <option value="approved">approved</option>
                          <option value="paid">paid</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Premium Amount</label>
                        <input
                          id="premiumAmount"
                          name="premiumAmount"
                          defaultValue={selected.premiumFinal?.amount ?? ""}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Premium Currency</label>
                        <input
                          id="premiumCurrency"
                          name="premiumCurrency"
                          defaultValue={selected.premiumFinal?.currency ?? "NGN"}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                    </section>

                    <section className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Pending URL Replacements
                      </p>
                      <div className="text-xs text-slate-500 whitespace-pre-wrap">
                        {urlReplacements.length === 0
                          ? "No replacements yet"
                          : urlReplacements
                              .map((r) => `${r.from} ? ${r.to}`)
                              .join("\n")}
                      </div>
                    </section>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Updates"}
                      </button>
                      {section === "submissions" && (
                        <button
                          type="button"
                          onClick={handleApproveSubmission}
                          disabled={selected.status === "approved" || selected.status === "paid"}
                          className={`px-5 py-2 rounded-xl text-sm border ${
                            selected.status === "approved" || selected.status === "paid"
                              ? "border-slate-200 text-slate-400"
                              : "border-slate-200"
                          }`}
                        >
                          Approve + Send Paystack Link
                        </button>
                      )}
                      {section === "claims" && (
                        <button
                          type="button"
                          onClick={handleApproveClaim}
                          disabled={selected.status === "approved" || selected.status === "paid"}
                          className={`px-5 py-2 rounded-xl text-sm border ${
                            selected.status === "approved" || selected.status === "paid"
                              ? "border-slate-200 text-slate-400"
                              : "border-slate-200"
                          }`}
                        >
                          Approve Claim (Send Email)
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "users" && (
          <div className="border border-slate-200 rounded-2xl shadow-sm p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Users</h3>
              <span className="text-xs text-slate-500">{users.length} users</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {users.map((u) => (
                <div key={u._id} className="border border-slate-200 rounded-xl p-4">
                  <p className="font-medium">{u.userId}</p>
                  <p className="text-xs text-slate-500">{u.profile?.email || "No email"}</p>
                  <p className="text-xs text-slate-500 mt-2">Joined {formatDate(u.createdAt)}</p>
                  <button
                    type="button"
                    onClick={() => openProfile(u.userId)}
                    className="mt-3 text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    View User Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "analytics" && (
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: "Total Submissions", value: analytics.total },
              { label: "Total Claims", value: analytics.claims },
              { label: "Active Policies", value: analytics.active },
              { label: "Approved", value: analytics.approved }
            ].map((card) => (
              <div key={card.label} className="border border-slate-200 rounded-2xl shadow-sm p-4 bg-white">
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {profileOpen && profile && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm max-w-3xl w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Profile</h3>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="text-sm text-slate-500"
                >
                  Close
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500">User ID</p>
                  <p className="font-medium">{profile.userId}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Email: {profile.profile?.email || "-"}
                  </p>
                  <p className="text-xs text-slate-500">Phone: {profile.profile?.phone || "-"}</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Active Policies</p>
                  {submissions
                    .filter((s) => s.userId === profile.userId && isActivePolicy(s))
                    .map((s) => (
                      <p key={s._id} className="text-sm">{s.type}</p>
                    ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500">All Submissions</p>
                  {submissions
                    .filter((s) => s.userId === profile.userId && !isClaim(s))
                    .map((s) => (
                      <p key={s._id} className="text-sm">
                        {s.type} - {s.status}
                      </p>
                    ))}
                </div>
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Claims History</p>
                  {submissions
                    .filter((s) => s.userId === profile.userId && isClaim(s))
                    .map((s) => (
                      <p key={s._id} className="text-sm">
                        {s.type} - {s.status}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
