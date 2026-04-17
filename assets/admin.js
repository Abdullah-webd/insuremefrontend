import { CONFIG } from "./config.js";

const submissionsEl = document.getElementById("submissions");
const usersEl = document.getElementById("users");
const detailEl = document.getElementById("detail");
const searchEl = document.getElementById("search");

let submissions = [];
let users = [];
let selectedSubmission = null;
let manualVerifications = {};
let urlReplacements = [];

function badge(status) {
  if (status === "paid") return '<span class="badge ok">paid</span>';
  if (status === "approved") return '<span class="badge warn">approved</span>';
  if (status === "rejected") return '<span class="badge danger">rejected</span>';
  return '<span class="badge">submitted</span>';
}

function renderSubmissions(list) {
  submissionsEl.innerHTML = "";
  list.forEach((s) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>${s.type}</strong><br />
          <span class="pill">${s.userId}</span>
        </div>
        ${badge(s.status)}
      </div>
      <div class="section-title">Premium: ${s.premiumFinal?.amount || "-"} ${s.premiumFinal?.currency || ""}</div>
    `;
    div.addEventListener("click", () => openSubmission(s));
    submissionsEl.appendChild(div);
  });
}

function renderUsers(list) {
  usersEl.innerHTML = "";
  if (!list.length) {
    usersEl.innerHTML = '<div class="section-title">No users endpoint available.</div>';
    return;
  }
  list.forEach((u) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div><strong>${u.userId}</strong></div>
      <div class="section-title">${u.profile?.email || ""}</div>
    `;
    usersEl.appendChild(div);
  });
}

function addVerificationToggle(key) {
  if (!manualVerifications[key]) manualVerifications[key] = "pending";
  manualVerifications[key] = manualVerifications[key] === "verified" ? "pending" : "verified";
  renderDetail();
}

function addUrlReplacement(from, to) {
  if (!from || !to) return;
  urlReplacements.push({ from, to });
  renderDetail();
}

function renderDetail() {
  if (!selectedSubmission) {
    detailEl.innerHTML = '<div class="section-title">Select a submission</div>';
    return;
  }
  const s = selectedSubmission;
  const data = s.data || {};

  const fields = Object.keys(data).map((k) => {
    const v = data[k];
    const inputType = typeof v === "string" ? "text" : "text";
    return `
      <div class="field">
        <label>${k}</label>
        <input data-field="${k}" type="${inputType}" value="${Array.isArray(v) ? v.join(", ") : v ?? ""}" />
      </div>
    `;
  }).join("");

  const verificationButtons = ["bvn", "nin", "plate_number", "car_image"].map((k) => `
      <button class="btn secondary" data-verify="${k}">Verify ${k}</button>
      <span class="pill">${manualVerifications[k] || "pending"}</span>
  `).join("");

  detailEl.innerHTML = `
    <div class="section-title">Submission: ${s._id}</div>
    <div class="section-title">Status: ${s.status}</div>
    <div class="row">
      <div>
        <h3>Collected Fields</h3>
        ${fields}
      </div>
      <div>
        <h3>Verification</h3>
        ${verificationButtons}
        <div class="section-title">Replace Evidence/Image URL</div>
        <div class="field"><input id="fromUrl" placeholder="Old URL" /></div>
        <div class="field"><input id="toUrl" placeholder="New URL (Cloudinary)" /></div>
        <button id="addReplace" class="btn secondary">Add Replacement</button>
        <div class="section-title">Pending Replacements: ${urlReplacements.length}</div>
      </div>
    </div>
    <div class="section-title">Admin Updates</div>
    <div class="row">
      <div class="field">
        <label>Risk Score</label>
        <input id="riskScore" type="number" value="${s.riskScoreFinal ?? ""}" />
      </div>
      <div class="field">
        <label>Premium Amount</label>
        <input id="premiumAmount" type="number" value="${s.premiumFinal?.amount ?? ""}" />
      </div>
    </div>
    <div class="field">
      <label>Premium Currency</label>
      <input id="premiumCurrency" type="text" value="${s.premiumFinal?.currency ?? "NGN"}" />
    </div>
    <div class="row">
      <button id="saveBtn" class="btn">Save Updates</button>
      <button id="approveBtn" class="btn secondary">Approve + Send Paystack Link</button>
    </div>
  `;

  detailEl.querySelectorAll("[data-verify]").forEach((btn) => {
    btn.addEventListener("click", () => addVerificationToggle(btn.dataset.verify));
  });

  const addReplaceBtn = detailEl.querySelector("#addReplace");
  addReplaceBtn?.addEventListener("click", () => {
    const from = detailEl.querySelector("#fromUrl")?.value;
    const to = detailEl.querySelector("#toUrl")?.value;
    addUrlReplacement(from, to);
  });

  detailEl.querySelector("#saveBtn")?.addEventListener("click", saveUpdates);
  detailEl.querySelector("#approveBtn")?.addEventListener("click", approveSubmission);
}

async function saveUpdates() {
  const s = selectedSubmission;
  if (!s) return;
  const fieldInputs = detailEl.querySelectorAll("[data-field]");
  const collected_fields = {};
  fieldInputs.forEach((inp) => {
    const key = inp.getAttribute("data-field");
    let val = inp.value;
    if (val.includes(",")) {
      val = val.split(",").map((v) => v.trim()).filter(Boolean);
    }
    collected_fields[key] = val;
  });

  const body = {
    user: { workflow: { collected_fields } },
    submission_updates: {
      riskScoreFinal: Number(detailEl.querySelector("#riskScore")?.value || 0),
      premiumFinal: {
        amount: Number(detailEl.querySelector("#premiumAmount")?.value || 0),
        currency: detailEl.querySelector("#premiumCurrency")?.value || "NGN",
        period: "year"
      },
      adminNotes: { manual_verifications: manualVerifications }
    },
    url_replacements: { items: urlReplacements },
    require_cloudinary: true
  };

  const res = await fetch(`${CONFIG.API_BASE}/admin/users/${s.userId}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    alert("Save failed");
    return;
  }

  urlReplacements = [];
  await loadSubmissions();
}

async function approveSubmission() {
  const s = selectedSubmission;
  if (!s) return;
  const res = await fetch(`${CONFIG.API_BASE}/admin/submissions/${s._id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      premiumFinal: {
        amount: Number(detailEl.querySelector("#premiumAmount")?.value || 0),
        currency: detailEl.querySelector("#premiumCurrency")?.value || "NGN",
        period: "year"
      }
    })
  });

  if (!res.ok) {
    alert("Approval failed");
    return;
  }
  await loadSubmissions();
}

async function loadSubmissions() {
  const res = await fetch(`${CONFIG.API_BASE}/admin/submissions`);
  const data = await res.json();
  submissions = data.items || [];
  renderSubmissions(filterList());
  if (submissions.length && !selectedSubmission) {
    openSubmission(submissions[0]);
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/admin/users`);
    if (!res.ok) return renderUsers([]);
    const data = await res.json();
    users = data.items || [];
    renderUsers(users);
  } catch {
    renderUsers([]);
  }
}

function filterList() {
  const q = (searchEl.value || "").toLowerCase();
  if (!q) return submissions;
  return submissions.filter(
    (s) => s.userId.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)
  );
}

function openSubmission(s) {
  selectedSubmission = s;
  manualVerifications = s.adminNotes?.manual_verifications || {};
  renderDetail();
}

searchEl.addEventListener("input", () => renderSubmissions(filterList()));

loadSubmissions();
loadUsers();

