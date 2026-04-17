import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  InfoStrip,
  MediaCard,
  MediaLightbox,
  SectionHeading,
  StatusBadge,
  Surface
} from "../components/AdminUi.jsx";
import { api } from "../services/api.js";
import {
  formatDate,
  formatFieldValue,
  getApplicationFields,
  getPrimaryMediaInfo,
  isActivePolicy
} from "../utils/admin.js";

export default function AdminClaimDetailPage() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getSubmission(id);
        setClaim(response.submission);

        if (response.submission?.userId) {
          const [userResponse, submissionsResponse] = await Promise.all([
            api.getUser(response.submission.userId),
            api.getSubmissions()
          ]);
          setUserProfile(userResponse.user);
          setAllSubmissions(
            (submissionsResponse.items || []).filter(
              (item) => item.userId === response.submission.userId
            )
          );
        }
      } catch (err) {
        setError(err.message || "Failed to load claim details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const { fields } = useMemo(() => getApplicationFields(claim), [claim]);
  const evidence = claim?.data?.evidence || [];
  const primaryMedia = getPrimaryMediaInfo(claim);
  const activePolicies = allSubmissions.filter((item) => isActivePolicy(item));
  const supportingSubmission = allSubmissions.find(
    (item) => item._id !== claim?._id && !item.type?.toLowerCase().includes("claim")
  );
  const resolvedName =
    claim?.data?.full_name ||
    supportingSubmission?.data?.full_name ||
    userProfile?.profile?.full_name ||
    claim?.userId ||
    "-";
  const resolvedPhone =
    claim?.data?.phone ||
    supportingSubmission?.data?.phone ||
    userProfile?.profile?.phone ||
    "-";

  const handleApproveClaim = async () => {
    if (!claim || claim.status === "approved" || claim.status === "paid") return;

    setApproving(true);
    try {
      await api.updateUserProfile(claim.userId, {
        submissionId: claim._id,
        user: { workflow: { collected_fields: {} } },
        submission_updates: {
          status: "approved",
          adminNotes: {
            ...(claim.adminNotes || {}),
            claim_note: "Claim approved. Customer should be contacted for payout follow-up."
          }
        }
      });

      const recipientEmail = claim?.data?.email || userProfile?.profile?.email || "";
      if (recipientEmail) {
        await api.sendEmail({
          to: recipientEmail,
          subject: "Your insurance claim has been approved",
          text:
            `Hello ${resolvedName},\n\n` +
            "Your claim has been approved by our admin team. We will contact you shortly with the next payout steps.\n\nRegards,\nInsureMe Admin"
        });
      }

      const fresh = await api.getSubmission(claim._id);
      setClaim(fresh.submission);
      alert("Claim approved and user notified.");
    } catch (err) {
      alert(err.message || "Unable to approve claim");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Surface className="p-10 text-center text-sm text-slate-500">
        Loading claim details...
      </Surface>
    );
  }

  if (error || !claim) {
    return (
      <Surface className="p-10 text-center text-sm text-rose-700">
        {error || "Claim not found"}
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Claim Detail"
        title={resolvedName}
        description="Review the claim separately from policy applications, inspect supporting evidence, and confirm the customer history before approving payout processing."
        action={
          <Link
            to="/admin/claims"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Back to claims
          </Link>
        }
      />

      <InfoStrip submission={claim} />

      <Surface className="p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Claim Review</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Incident and claimant details
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={claim.status} />
            <button
              type="button"
              onClick={handleApproveClaim}
              disabled={approving || claim.status === "approved" || claim.status === "paid"}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                approving || claim.status === "approved" || claim.status === "paid"
                  ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                  : "border border-slate-900 bg-slate-900 text-white"
              }`}
            >
              {claim.status === "approved" || claim.status === "paid"
                ? "Claim Approved"
                : approving
                  ? "Approving..."
                  : "Approve Claim"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Full Name", value: resolvedName },
            { label: "Phone Number", value: resolvedPhone },
            { label: "Claim Type", value: claim.data?.policy_type || claim.type },
            { label: "Incident Date", value: claim.data?.incident_date },
            { label: "Submitted", value: formatDate(claim.submittedAt) },
            { label: "User ID", value: claim.userId }
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-4 break-words text-base font-semibold leading-7 text-slate-800">
                {formatFieldValue(item.value)}
              </p>
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Claim Data</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {fields
            .filter((field) => !field.media)
            .map((field) => (
              <div
                key={field.key}
                className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {field.label}
                </p>
                <p className="mt-4 break-words text-base font-semibold leading-7 text-slate-800">
                  {formatFieldValue(claim.data?.[field.key])}
                </p>
              </div>
            ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Surface className="overflow-hidden">
          {primaryMedia.value ? (
            <button
              type="button"
              onClick={() =>
                setPreviewMedia({ item: primaryMedia.value, title: primaryMedia.label })
              }
              className="block w-full"
            >
              {primaryMedia.value.includes("/video/") || primaryMedia.value.endsWith(".mp4") ? (
                <video
                  src={primaryMedia.value}
                  muted
                  playsInline
                  className="h-80 w-full bg-slate-950 object-cover"
                />
              ) : (
                <img src={primaryMedia.value} alt={primaryMedia.label} className="h-80 w-full object-cover" />
              )}
            </button>
          ) : (
            <div className="flex h-80 items-center justify-center bg-slate-100 text-sm text-slate-400">
              No primary claim media
            </div>
          )}
          <div className="border-t border-slate-200 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{primaryMedia.label}</p>
            <p className="mt-2 text-sm text-slate-500">
              {primaryMedia.value || "No primary claim media is attached yet"}
            </p>
          </div>
        </Surface>

        <MediaCard
          title="Claim Evidence"
          value={evidence}
          disabled
          editing={false}
          onPreview={(item) => setPreviewMedia({ item, title: "Claim Evidence" })}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">User Profile Snapshot</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: "User ID", value: claim.userId },
              { label: "Registered Name", value: resolvedName },
              { label: "Registered Phone", value: resolvedPhone },
              { label: "Created At", value: formatDate(userProfile?.createdAt) }
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {formatFieldValue(item.value)}
                </p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Active Policies</p>
          <div className="mt-5 space-y-3">
            {activePolicies.map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{item.type}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.data?.full_name || item.userId} · {formatDate(item.submittedAt)}
                </p>
              </div>
            ))}
            {!activePolicies.length ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No active policies found for this user.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>

      <MediaLightbox
        item={previewMedia?.item}
        title={previewMedia?.title}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}
