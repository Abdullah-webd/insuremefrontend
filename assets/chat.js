import { CONFIG } from "./config.js";

const chatLog = document.getElementById("chatLog");
const userIdInput = document.getElementById("userId");
const messageInput = document.getElementById("message");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const uploadInfo = document.getElementById("uploadInfo");

let uploading = false;
let queuedImageUrl = null;
let recognition = null;

function addMsg(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setInputDisabled(disabled) {
  messageInput.disabled = disabled;
  sendBtn.disabled = disabled && !queuedImageUrl;
}

async function uploadToCloudinary(file) {
  if (!CONFIG.CLOUDINARY_CLOUD_NAME || !CONFIG.CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary config missing");
  }
  const url = `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CONFIG.CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const data = await res.json();
  return data.secure_url;
}

async function sendMessage(text) {
  const userId = userIdInput.value || "user_123";
  addMsg(text, "user");

  const res = await fetch(`${CONFIG.API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, message: text })
  });

  const data = await res.json();
  addMsg(data.reply || "(no reply)", "bot");
}

sendBtn.addEventListener("click", async () => {
  if (uploading) return;
  if (queuedImageUrl) {
    const msg = `Here is the image: ${queuedImageUrl}`;
    queuedImageUrl = null;
    uploadInfo.textContent = "";
    setInputDisabled(false);
    await sendMessage(msg);
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = "";
  await sendMessage(text);
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  uploading = true;
  setInputDisabled(true);
  uploadInfo.textContent = "Uploading image...";
  try {
    const url = await uploadToCloudinary(file);
    queuedImageUrl = url;
    uploadInfo.textContent = "Image ready to send.";
  } catch (err) {
    uploadInfo.textContent = "Upload failed.";
    console.error(err);
  } finally {
    uploading = false;
    setInputDisabled(!!queuedImageUrl);
  }
});

micBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser.");
    return;
  }
  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      messageInput.value = transcript;
    };
    recognition.onerror = () => {};
  }
  recognition.start();
});

