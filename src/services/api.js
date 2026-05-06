import { CONFIG } from "../config.js";

async function request(path, options = {}) {
  const token = localStorage.getItem("insureme_token");
  const headers = { 
    "Content-Type": "application/json", 
    ...(options.headers || {}) 
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${CONFIG.API_BASE}${path}`, {
    headers,
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = data?.error;
    const message =
      typeof raw === "string"
        ? raw
        : typeof raw?.message === "string"
          ? raw.message
          : "Request failed";
    throw new Error(message);
  }
  return data;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const api = {
  getSubmissions: (params = {}) =>
    request(`/admin/submissions${buildQuery(params)}`),
  getSubmission: (id) => request(`/admin/submissions/${id}`),
  getUsers: () => request("/admin/users"),
  getUser: (userId) => request(`/admin/users/${userId}`),
  uploadAdminMedia: ({ dataUrl, url, folder } = {}) =>
    request("/admin/media/upload", {
      method: "POST",
      body: JSON.stringify({ dataUrl, url, folder }),
    }),
  updateUserProfile: (userId, body) =>
    request(`/admin/users/${userId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  approveSubmission: (id, body) =>
    request(`/admin/submissions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyPayment: (id) =>
    request(`/admin/submissions/${id}/verify-payment`, {
      method: "POST",
    }),
  rejectSubmission: (id, body) =>
    request(`/admin/submissions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),
  verifySubmissionField: (id, body) =>
    request(`/admin/submissions/${id}/verify-field`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getVerifiers: () => request("/admin/verifiers"),
  assignVerifier: (id, body) =>
    request(`/admin/submissions/${id}/assign`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMyTasks: (verifierId) =>
    request(`/verifier/my-tasks${buildQuery({ verifierId })}`),
  getVerifierTask: (id, verifierId) =>
    request(`/verifier/submissions/${id}${buildQuery({ verifierId })}`),
  verifySubmission: (id, body) => request(`/verifier/submissions/${id}/verify`, { method: "POST", body: JSON.stringify(body) }),
  sendEmail: (body) =>
    request("/admin/email", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  sendChat: (userId, message, language = "English") =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ userId, message, language }),
    }),
  sendChatStream: async (userId, message, language, onChunk, onDone, onError) => {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message, language, stream: true }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n\n");
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const data = JSON.parse(line.trim().substring(6));
              if (data.error) throw new Error(data.error);
              if (data.text && onChunk) onChunk(data.text);
              if (data.done && onDone) onDone(data);
            } catch (err) {
              if (err.message !== "Unexpected end of JSON input") {
                throw err;
              }
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  },
  getChatHistory: (userId) => request(`/chat/history/${userId}`),
};

function uploadViaXhr({ url, formData, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) return resolve(data);

        const raw = data?.error;
        const message =
          typeof raw === "string"
            ? raw
            : typeof raw?.message === "string"
              ? raw.message
              : xhr.responseText || "Upload failed";
        return reject(new Error(message));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

export async function uploadToCloudinary(file, options = {}) {
  const onProgress =
    typeof options.onProgress === "function" ? options.onProgress : null;
  const uploadViaBackend = async () => {
    if (onProgress) onProgress(5);
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    if (onProgress) onProgress(35);
    const uploaded = await api.uploadAdminMedia({ dataUrl });
    if (!uploaded?.url) throw new Error("Upload failed");
    if (onProgress) onProgress(100);
    return uploaded.url;
  };

  // If frontend Cloudinary env vars are missing, fall back to backend upload.
  if (!CONFIG.CLOUDINARY_CLOUD_NAME || !CONFIG.CLOUDINARY_UPLOAD_PRESET) {
    return uploadViaBackend();
  }

  try {
    // Use auto upload so PDFs/docs can be uploaded too.
    const url = `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/auto/upload`;

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CONFIG.CLOUDINARY_UPLOAD_PRESET);
    // Don't set `access_mode` for unsigned/browser uploads — Cloudinary rejects it.

    const data = await uploadViaXhr({ url, formData: form, onProgress });
    if (!data?.secure_url) throw new Error("Upload failed");
    if (onProgress) onProgress(100);
    return data.secure_url;
  } catch (err) {
    // Common hackathon/dev issue: preset is signed-only, so browser upload fails.
    // Fallback to our backend uploader (uses server-side credentials).
    const msg = String(err?.message || err || "");
    const shouldFallback =
      msg.toLowerCase().includes("unsigned") ||
      msg.toLowerCase().includes("upload preset") ||
      msg.toLowerCase().includes("not allowed") ||
      msg.toLowerCase().includes("unauthorized") ||
      msg.toLowerCase().includes("forbidden");

    if (!shouldFallback) throw err;
    return uploadViaBackend();
  }
}
