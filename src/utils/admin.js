import { getPresetForType } from "../config/insuranceFields.js";

export const STATUS_STYLES = {
  submitted: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-sky-200 bg-sky-50 text-sky-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  pending: "border-slate-200 bg-slate-100 text-slate-700"
};

export const ADMIN_NAV_ITEMS = [
  { to: "/admin/applications", label: "Applications", icon: "folder" },
  { to: "/admin/claims", label: "Claims", icon: "shield" },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/analytics", label: "Analytics", icon: "chart" },
  { to: "/chat", label: "User Chat", icon: "chat" }
];

export function titleCase(text = "") {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
}

export function formatMoney(amount, currency = "NGN") {
  if (amount === null || amount === undefined || amount === "") return "-";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount));
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  return `${numeric}%`;
}

export function isClaim(submission) {
  const type = (submission?.type || "").toLowerCase();
  const workflowId = (submission?.workflowId || "").toLowerCase();
  return type.includes("claim") || workflowId.includes("claim");
}

export function isLockedSubmission(submission) {
  // Allow admin edits while the application is still under review.
  // Lock edits once it's approved (payment link sent) or paid.
  return ["approved", "paid"].includes(submission?.status);
}

export function isActivePolicy(submission) {
  return (
    !isClaim(submission) &&
    (submission?.status === "paid" || submission?.paymentStatus === "success")
  );
}

export function isVideoUrl(url = "") {
  return (
    url.includes("/video/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov")
  );
}

export function isDocumentUrl(url = "") {
  const lower = String(url || "").toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.includes("application/pdf")
  );
}

export function getApplicationFields(submission) {
  const preset = getPresetForType(submission?.type || "");
  const submissionData = submission?.data || {};
  const knownKeys = new Set(preset.fields.map((field) => field.key));
  const extraFields = Object.keys(submissionData)
    .filter((key) => !knownKeys.has(key))
    .map((key) => ({ key, label: titleCase(key) }));

  return {
    preset,
    fields: [...preset.fields, ...extraFields]
  };
}

export function formatFieldValue(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return String(value);
}

export function getPrimaryMediaInfo(submission) {
  const data = submission?.data || {};

  if (data.profile_image) {
    return {
      key: "profile_image",
      label: "Profile Image",
      value: data.profile_image
    };
  }

  if (data.car_image) {
    return {
      key: "car_image",
      label: "Car Image",
      value: data.car_image
    };
  }

  if (Array.isArray(data.property_images) && data.property_images.length) {
    return {
      key: "property_images",
      label: "Property Image",
      value: data.property_images[0]
    };
  }

  if (Array.isArray(data.evidence) && data.evidence.length) {
    return {
      key: "evidence",
      label: "Evidence Preview",
      value: data.evidence[0]
    };
  }

  return {
    key: null,
    label: "Media Preview",
    value: null
  };
}

export function getSummaryMedia(submission) {
  return getPrimaryMediaInfo(submission).value;
}
