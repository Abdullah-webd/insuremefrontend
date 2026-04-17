import React from "react";
import { STATUS_STYLES, formatDate, isDocumentUrl, isVideoUrl } from "../utils/admin.js";

function normalizeDocumentUrl(url) {
  try {
    if (typeof url !== "string") return url;
    const lower = url.toLowerCase();
    if (!lower.includes(".pdf")) return url;
    if (url.includes("/raw/upload/")) return url;
    if (url.includes("/image/upload/")) return url.replace("/image/upload/", "/raw/upload/");
    if (url.includes("/auto/upload/")) return url.replace("/auto/upload/", "/raw/upload/");
    // fallback: if upload segment exists, try to switch the resource type
    return url.replace("/upload/", "/raw/upload/");
  } catch (err) {
    return url;
  }
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[status] || "border-slate-200 bg-slate-100 text-slate-700"}`}
    >
      {status || "unknown"}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-serif text-4xl leading-none text-slate-950">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Surface({ children, className = "" }) {
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, note, valueClassName = "" }) {
  return (
    <Surface className="p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p
        className={`mt-4 text-3xl font-semibold text-slate-950 ${valueClassName}`}
      >
        {value}
      </p>
      {note ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
    </Surface>
  );
}

export function ReadOnlyField({
  label,
  value,
  editing,
  disabled,
  onEdit,
  onCancel,
  onSave,
  onChange,
  type = "text"
}) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <label className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
          {label}
        </label>
        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!editing}
        className={`mt-4 w-full rounded-[22px] border px-4 py-4 text-base font-semibold ${
          editing
            ? "border-slate-300 bg-white text-slate-900"
            : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      />
    </div>
  );
}

export function MediaCard({
  title,
  value,
  editing,
  disabled,
  onEdit,
  onCancel,
  onFileChange,
  uploadingLabel,
  uploading = false,
  progress = null,
  onPreview,
  onDelete,
  onAddFile,
  accept = "image/*,video/*"
}) {
  const items = value ? (Array.isArray(value) ? value : [value]) : [];
  const numericProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, progress))
      : null;

  return (
    <Surface className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <p className="mt-1 text-sm text-slate-500">
            {items.length ? `${items.length} media item${items.length > 1 ? "s" : ""}` : "No upload yet"}
          </p>
        </div>
        {uploading ? (
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:flex">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-700" />
            Uploading{numericProgress !== null ? ` ${numericProgress}%` : ""}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          {editing && onAddFile ? (
            <label
              className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-2 text-xs font-medium ${
                disabled || uploading
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {uploading ? `Uploading ${numericProgress ?? 0}%` : "Add media"}
              <input
                type="file"
                accept={accept}
                className="hidden"
                disabled={disabled || uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Allow selecting the same file again.
                  event.target.value = "";
                  if (file) onAddFile?.(file);
                }}
              />
            </label>
          ) : null}

          {!editing ? (
            <button
              type="button"
              onClick={onEdit}
              disabled={disabled || uploading}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                disabled || uploading
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
            >
              Done
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">
            No media available
          </div>
        ) : (
          items.map((item) => (
            <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {isVideoUrl(item) ? (
                <button
                  type="button"
                  onClick={() => onPreview?.(item)}
                  className="block w-full"
                >
                  <video
                    src={item}
                    muted
                    playsInline
                    className="h-64 w-full bg-slate-950 object-cover"
                  />
                </button>
              ) : isDocumentUrl(item) ? (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-3 bg-white px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Document</p>
                  <a
                    href={normalizeDocumentUrl(item)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700"
                  >
                    Open document
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onPreview?.(item)}
                  className="block w-full"
                >
                  <img src={item} alt={title} className="h-64 w-full object-cover" />
                </button>
              )}
              <div className="border-t border-slate-200 p-3">
                <p className="truncate text-xs text-slate-500">{item}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {onPreview ? (
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      Open larger
                    </button>
                  ) : null}
                  {editing && onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={disabled}
                      className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-medium ${
                        disabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
                      }`}
                      aria-label="Delete media"
                      title="Delete"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                      Delete
                    </button>
                  ) : null}
                </div>
                {editing ? (
                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                    {uploading ? `Uploading ${numericProgress ?? 0}%` : uploadingLabel || "Replace media"}
                    <input
                      type="file"
                      accept={accept}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) onFileChange?.(file, item);
                      }}
                    />
                  </label>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {uploading && numericProgress !== null ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Upload progress</span>
            <span className="tabular-nums">{numericProgress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-[width] duration-150"
              style={{ width: `${numericProgress}%` }}
            />
          </div>
        </div>
      ) : null}
    </Surface>
  );
}

export function MediaLightbox({ item, title, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-700 bg-slate-950 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/70 text-white transition hover:bg-slate-800"
          aria-label="Close preview"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="flex max-h-[90vh] items-center justify-center bg-slate-950 p-6">
          {isVideoUrl(item) ? (
            <video
              src={item}
              controls
              autoPlay
              className="max-h-[78vh] w-full rounded-2xl bg-black object-contain"
            />
          ) : isDocumentUrl(item) ? (
            item.toLowerCase().endsWith(".pdf") ? (
              <iframe
                title={title || "Document preview"}
                src={normalizeDocumentUrl(item)}
                className="h-[78vh] w-full rounded-2xl bg-white"
              />
            ) : (
              <div className="w-full rounded-2xl bg-white p-10 text-center">
                <p className="text-lg font-semibold text-slate-900">Document preview</p>
                <p className="mt-2 text-sm text-slate-600">Open in a new tab to view.</p>
                <a
                  href={item}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                >
                  Open document
                </a>
              </div>
            )
          ) : (
            <img
              src={item}
              alt={title || "Media preview"}
              className="max-h-[78vh] w-full rounded-2xl object-contain"
            />
          )}
        </div>

        <div className="border-t border-slate-800 px-6 py-4 text-sm text-slate-300">
          <p className="font-medium text-white">{title || "Media preview"}</p>
          <p className="mt-1 truncate text-slate-400">{item}</p>
        </div>
      </div>
    </div>
  );
}

export function InfoStrip({ submission }) {
  return (
    <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,_#f8fbff,_#ffffff)] p-5 md:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Submission</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{submission?.type || "-"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">User</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{submission?.userId || "-"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Submitted</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(submission?.submittedAt)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Status</p>
        <div className="mt-2">
          <StatusBadge status={submission?.status} />
        </div>
      </div>
    </div>
  );
}
