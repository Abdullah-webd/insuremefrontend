import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  InfoStrip,
  MediaLightbox,
  MediaCard,
  ReadOnlyField,
  SectionHeading,
  StatusBadge,
  Surface,
} from "../components/AdminUi.jsx";
import { api, uploadToCloudinary } from "../services/api.js";
import {
  formatFieldValue,
  formatMoney,
  formatPercent,
  getApplicationFields,
  isLockedSubmission,
} from "../utils/admin.js";

const ARRAY_MEDIA_KEYS = new Set(["evidence", "property_images", "documents"]);

function coerceEditedValue(submission, key, rawValue) {
  const current = submission?.data?.[key];
  if (typeof current === "boolean") {
    const normalized = String(rawValue ?? "")
      .trim()
      .toLowerCase();
    if (normalized === "true" || normalized === "yes" || normalized === "1")
      return true;
    if (normalized === "false" || normalized === "no" || normalized === "0")
      return false;
    return Boolean(rawValue);
  }
  if (typeof current === "number") {
    const numeric = Number(rawValue);
    return Number.isNaN(numeric) ? rawValue : numeric;
  }
  return rawValue;
}

function buildUpdatePayload(submission, key, value, replacements = []) {
  const metaKeys = {
    riskScoreFinal: true,
    premiumAmount: true,
  };

  const body = {
    submissionId: submission._id,
    user: { workflow: { collected_fields: {} } },
    submission_updates: {},
    url_replacements: { items: replacements },
    require_cloudinary: true,
  };

  if (metaKeys[key]) {
    if (key === "riskScoreFinal") {
      body.submission_updates.riskScoreFinal = Number(value || 0);
    }
    if (key === "premiumAmount") {
      body.submission_updates.premiumFinal = {
        amount: Number(value || 0),
        currency: submission?.premiumFinal?.currency || "NGN",
        period: submission?.premiumFinal?.period || "year",
      };
    }
  } else {
    body.user.workflow.collected_fields[key] = value;
  }

  return body;
}

export default function AdminApplicationDetailPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: "", text: "" });
  const [previewMedia, setPreviewMedia] = useState(null);
  const [verifyingField, setVerifyingField] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getSubmission(id);
        setSubmission(response.submission);

        if (response.submission?.userId) {
          const userResponse = await api.getUser(response.submission.userId);
          setUserProfile(userResponse.user);
        }
      } catch (err) {
        setError(err.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const locked = isLockedSubmission(submission);
  const { fields } = useMemo(
    () => getApplicationFields(submission),
    [submission],
  );

  const overviewKeys = new Set(["full_name", "email", "phone", "bvn"]);
  const mediaFields = fields.filter((field) => field.media);
  const verifyableFields = new Set(["bvn", "nin", "plate_number"]);
  const manualVerifications =
    submission?.adminNotes?.manual_verifications || {};

  const fieldValues = {
    full_name:
      submission?.data?.full_name || userProfile?.profile?.full_name || "",
    email: submission?.data?.email || userProfile?.profile?.email || "",
    phone: submission?.data?.phone || userProfile?.profile?.phone || "",
    bvn: submission?.data?.bvn || "",
    nin: submission?.data?.nin || "",
    plate_number: submission?.data?.plate_number || "",
    riskScoreFinal: submission?.riskScoreFinal ?? "",
    premiumAmount: submission?.premiumFinal?.amount ?? "",
  };

  const editableFields = [
    { key: "full_name", label: "Full Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone Number" },
    { key: "bvn", label: "BVN" },
    { key: "nin", label: "NIN" },
    ...(fieldValues.plate_number
      ? [{ key: "plate_number", label: "Plate Number" }]
      : []),
    { key: "riskScoreFinal", label: "Risk Score", type: "number" },
    { key: "premiumAmount", label: "Amount", type: "number" },
  ];
  const recipientEmail =
    submission?.data?.email || userProfile?.profile?.email || "";

  const handleStartEdit = (scope, key, initialValue) => {
    setEditingField(`${scope}:${key}`);
    setDrafts((prev) => ({
      ...prev,
      [`${scope}:${key}`]: initialValue ?? "",
    }));
  };

  const handleSaveField = async (scope, key) => {
    if (!submission) return;
    setSaving(true);
    try {
      const editedValue = coerceEditedValue(
        submission,
        key,
        drafts[`${scope}:${key}`],
      );
      await api.updateUserProfile(
        submission.userId,
        buildUpdatePayload(submission, key, editedValue),
      );
      const fresh = await api.getSubmission(submission._id);
      setSubmission(fresh.submission);
      setEditingField(null);
    } catch (err) {
      alert(err.message || "Unable to save this field");
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceMedia = async (fieldKey, file, existingUrl) => {
    if (!submission) return;
    setUploadingField(fieldKey);
    setUploadProgress((prev) => ({ ...prev, [fieldKey]: 0 }));
    try {
      const newUrl = await uploadToCloudinary(file, {
        onProgress: (p) =>
          setUploadProgress((prev) => ({ ...prev, [fieldKey]: p })),
      });
      await api.updateUserProfile(submission.userId, {
        submissionId: submission._id,
        user: { workflow: { collected_fields: {} } },
        submission_updates: {},
        url_replacements: { items: [{ from: existingUrl, to: newUrl }] },
        require_cloudinary: true,
      });
      const fresh = await api.getSubmission(submission._id);
      setSubmission(fresh.submission);
    } catch (err) {
      alert(err.message || "Unable to replace media");
    } finally {
      setUploadingField(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const handleDeleteMediaUrl = async (fieldKey, url) => {
    if (!submission) return;
    if (locked) return;
    const current = submission.data?.[fieldKey];
    let nextValue = current;

    if (Array.isArray(current)) {
      nextValue = current.filter((item) => item !== url);
    } else if (typeof current === "string") {
      nextValue = current === url ? null : current;
    }

    setSaving(true);
    try {
      await api.updateUserProfile(submission.userId, {
        submissionId: submission._id,
        user: { workflow: { collected_fields: { [fieldKey]: nextValue } } },
        submission_updates: {},
        require_cloudinary: true,
      });
      const fresh = await api.getSubmission(submission._id);
      setSubmission(fresh.submission);
    } catch (err) {
      alert(err.message || "Unable to delete media");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMediaFile = async (fieldKey, file) => {
    if (!submission) return;
    if (locked) return;
    setUploadingField(fieldKey);
    setUploadProgress((prev) => ({ ...prev, [fieldKey]: 0 }));
    try {
      const newUrl = await uploadToCloudinary(file, {
        onProgress: (p) =>
          setUploadProgress((prev) => ({ ...prev, [fieldKey]: p })),
      });
      const current = submission.data?.[fieldKey];
      const shouldBeArray =
        Array.isArray(current) || ARRAY_MEDIA_KEYS.has(fieldKey);
      const nextValue = shouldBeArray
        ? [...(Array.isArray(current) ? current : []), newUrl]
        : newUrl;

      await api.updateUserProfile(submission.userId, {
        submissionId: submission._id,
        user: { workflow: { collected_fields: { [fieldKey]: nextValue } } },
        submission_updates: {},
        require_cloudinary: true,
      });
      const fresh = await api.getSubmission(submission._id);
      setSubmission(fresh.submission);
    } catch (err) {
      alert(err.message || "Unable to add media");
    } finally {
      setUploadingField(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const handleApprove = async () => {
    if (
      !submission ||
      submission.status === "approved" ||
      submission.status === "paid"
    ) {
      return;
    }

    try {
      await api.approveSubmission(submission._id, {
        premiumFinal: {
          amount: Number(submission.premiumFinal?.amount || 0),
          currency: submission.premiumFinal?.currency || "NGN",
          period: submission.premiumFinal?.period || "year",
        },
      });
      const fresh = await api.getSubmission(submission._id);
      setSubmission(fresh.submission);
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handleVerifyPayment = async () => {
    if (!submission) return;
    if (!submission.paymentReference) {
      alert("No payment reference found for this submission");
      return;
    }

    setVerifyingPayment(true);
    try {
      const res = await api.verifyPayment(submission._id);
      // Prefer the submission returned from the verify endpoint
      const updated =
        res?.submission || (await api.getSubmission(submission._id)).submission;
      setSubmission(updated);

      const status = res?.verify?.data?.status || updated?.paymentStatus;
      if (
        status === "success" ||
        updated?.status === "paid" ||
        updated?.paymentStatus === "success"
      ) {
        alert("Payment verified: SUCCESS — submission marked as paid.");
      } else {
        alert("Payment not successful. See updated submission for details.");
      }
    } catch (err) {
      alert(err.message || "Payment verification failed");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleVerifyField = async (fieldKey) => {
    if (!submission) return;
    if (locked) return;
    if (!verifyableFields.has(fieldKey)) return;

    setVerifyingField(fieldKey);
    try {
      const res = await api.verifySubmissionField(submission._id, {
        field: fieldKey,
      });
      if (res?.submission) setSubmission(res.submission);
    } catch (err) {
      alert(err.message || "Verification failed");
    } finally {
      setVerifyingField(null);
    }
  };

  const renderVerifyRow = (fieldKey) => {
    if (!verifyableFields.has(fieldKey)) return null;
    if (!submission?.data?.[fieldKey]) return null;

    const status = manualVerifications?.[fieldKey]?.status || "pending";
    const reason = manualVerifications?.[fieldKey]?.reason || "";

    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div className="min-w-0">
          <span className="font-semibold">Verification:</span>{" "}
          <span className="truncate">
            {status}
            {reason ? ` - ${reason}` : ""}
          </span>
        </div>
        <button
          type="button"
          disabled={locked || verifyingField === fieldKey}
          onClick={() => handleVerifyField(fieldKey)}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
            locked
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {verifyingField === fieldKey ? "Verifying..." : "Verify"}
        </button>
      </div>
    );
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      alert("This user does not have an email address on record yet.");
      return;
    }

    if (!emailForm.subject.trim() || !emailForm.text.trim()) {
      alert("Please add both a subject and message before sending.");
      return;
    }

    setEmailSending(true);
    try {
      await api.sendEmail({
        to: recipientEmail,
        subject: emailForm.subject.trim(),
        text: emailForm.text.trim(),
      });
      setShowEmailComposer(false);
      setEmailForm({ subject: "", text: "" });
      alert("Email sent successfully.");
    } catch (err) {
      alert(err.message || "Unable to send email");
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <Surface className="p-10 text-center text-sm text-slate-500">
        Loading application details...
      </Surface>
    );
  }

  if (error || !submission) {
    return (
      <Surface className="p-10 text-center text-sm text-rose-700">
        {error || "Application not found"}
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Application Detail"
        title={submission.data?.full_name || submission.userId}
        description="Review the application in a clean underwriting workspace. Fields stay read-only by default and can be edited one at a time when the application status allows it."
        action={
          <Link
            to="/admin/applications"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Back to applications
          </Link>
        }
      />

      <InfoStrip submission={submission} />

      <div className="space-y-6">
        <Surface className="p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Applicant Overview
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                Core application details
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={submission.status} />
              <button
                type="button"
                onClick={() => {
                  setEmailForm({
                    subject: `Update on your ${submission.type || "insurance"} application`,
                    text:
                      `Hello ${submission.data?.full_name || submission.userId},\n\n` +
                      "We are reaching out with an update on your insurance application.\n\nRegards,\nHeirs Insurance Admin",
                  });
                  setShowEmailComposer(true);
                }}
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800"
              >
                Send Email
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={
                  submission.status === "approved" ||
                  submission.status === "paid"
                }
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  submission.status === "approved" ||
                  submission.status === "paid"
                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                    : "border border-red-800 bg-red-800 text-white"
                }`}
              >
                {submission.status === "approved" ||
                submission.status === "paid"
                  ? "Payment Link Sent"
                  : "Approve Application"}
              </button>
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={verifyingPayment || !submission?.paymentReference}
                className={`rounded-full px-4 py-2 text-sm font-medium ml-2 ${
                  !submission?.paymentReference
                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                    : "border border-emerald-600 bg-emerald-50 text-emerald-800"
                }`}
              >
                {verifyingPayment ? "Verifying..." : "Verify Payment"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {editableFields.map((field) => (
              <div key={field.key} className="min-w-0">
                <ReadOnlyField
                  label={field.label}
                  type={
                    field.key === "riskScoreFinal" &&
                    editingField !== `core:${field.key}`
                      ? "text"
                      : field.type
                  }
                  value={
                    editingField === `core:${field.key}`
                      ? (drafts[`core:${field.key}`] ?? "")
                      : field.key === "riskScoreFinal"
                        ? formatPercent(fieldValues[field.key])
                        : fieldValues[field.key]
                  }
                  editing={editingField === `core:${field.key}`}
                  disabled={locked || saving}
                  onEdit={() =>
                    handleStartEdit(
                      "core",
                      field.key,
                      fieldValues[field.key] ??
                        submission?.data?.[field.key] ??
                        "",
                    )
                  }
                  onCancel={() => setEditingField(null)}
                  onChange={(value) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [`core:${field.key}`]: value,
                    }))
                  }
                  onSave={() => handleSaveField("core", field.key)}
                />
                {renderVerifyRow(field.key)}
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Captured Insurance Data
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {fields
              .filter((field) => !field.media && !overviewKeys.has(field.key))
              .map((field) => (
                <div key={field.key} className="min-w-0">
                  <ReadOnlyField
                    label={field.label}
                    type="text"
                    value={
                      editingField === `data:${field.key}`
                        ? (drafts[`data:${field.key}`] ?? "")
                        : formatFieldValue(submission.data?.[field.key])
                    }
                    editing={editingField === `data:${field.key}`}
                    disabled={locked || saving}
                    onEdit={() =>
                      handleStartEdit(
                        "data",
                        field.key,
                        (() => {
                          const current = submission.data?.[field.key];
                          if (typeof current === "boolean")
                            return current ? "true" : "false";
                          if (current === null || current === undefined)
                            return "";
                          return String(current);
                        })(),
                      )
                    }
                    onCancel={() => setEditingField(null)}
                    onChange={(value) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [`data:${field.key}`]: value,
                      }))
                    }
                    onSave={() => handleSaveField("data", field.key)}
                  />
                </div>
              ))}
          </div>
        </Surface>

        {mediaFields.length ? (
          <Surface className="p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Media & Evidence
            </p>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {mediaFields.map((field) => {
                const value = submission.data?.[field.key];
                const editingKey = `media:${field.key}`;
                return (
                  <MediaCard
                    key={field.key}
                    title={field.label}
                    value={value}
                    editing={editingField === editingKey}
                    disabled={locked || saving}
                    uploading={uploadingField === field.key}
                    progress={uploadProgress[field.key]}
                    onEdit={() => setEditingField(editingKey)}
                    onCancel={() => setEditingField(null)}
                    onFileChange={(file, url) =>
                      handleReplaceMedia(field.key, file, url)
                    }
                    uploadingLabel={
                      uploadingField === field.key
                        ? `Uploading ${uploadProgress[field.key] ?? 0}%`
                        : "Replace media"
                    }
                    onPreview={(item) =>
                      setPreviewMedia({ item, title: field.label })
                    }
                    onDelete={(url) => handleDeleteMediaUrl(field.key, url)}
                    onAddFile={(file) => handleAddMediaFile(field.key, file)}
                    accept={
                      field.key === "documents" || field.key === "evidence"
                        ? "application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,video/*"
                        : "image/*,video/*"
                    }
                  />
                );
              })}
            </div>
          </Surface>
        ) : null}

        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            System Status
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Status
              </p>
              <div className="mt-3">
                <StatusBadge status={submission.status} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Status is controlled by the system and cannot be edited
                manually.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Quoted Amount
              </p>
              <p className="mt-3 text-xl font-semibold text-slate-900">
                {formatMoney(
                  submission.premiumFinal?.amount,
                  submission.premiumFinal?.currency || "NGN",
                )}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Payment link sending is disabled after approval or payment
                confirmation.
              </p>
            </div>
          </div>
        </Surface>
      </div>

      {showEmailComposer ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <Surface className="w-full max-w-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Email User
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  Send application update
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Message will be sent to{" "}
                  {recipientEmail || "the email on file"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailComposer(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Subject
                </label>
                <input
                  value={emailForm.subject}
                  onChange={(event) =>
                    setEmailForm((prev) => ({
                      ...prev,
                      subject: event.target.value,
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Message
                </label>
                <textarea
                  rows="7"
                  value={emailForm.text}
                  onChange={(event) =>
                    setEmailForm((prev) => ({
                      ...prev,
                      text: event.target.value,
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEmailComposer(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-sm text-white"
              >
                {emailSending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </Surface>
        </div>
      ) : null}

      <MediaLightbox
        item={previewMedia?.item}
        title={previewMedia?.title}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}
