import React, { useEffect, useRef, useState } from "react";
import { api, uploadToCloudinary } from "../services/api.js";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("user_123");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), who: "user", text: content, time: new Date() }
    ]);
    setLoading(true);
    try {
      const res = await api.sendChat(userId, content);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, who: "bot", text: res.reply, time: new Date() }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, who: "bot", text: err.message || "Error", time: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (uploading) return;
    if (imageUrl) {
      await sendMessage(`IMAGE_URL: ${imageUrl}`);
      setImageUrl(null);
      return;
    }
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendMessage(text);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">User Chat</h2>
        <p className="text-sm text-slate-500">Chat with the InsureMe assistant</p>
      </div>

      <div className="border border-slate-200 rounded-2xl shadow-card bg-white">
        <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            placeholder="user_123"
          />
          {imageUrl && (
            <span className="text-xs text-emerald-600">Image ready to send</span>
          )}
        </div>
        <div ref={logRef} className="p-4 h-[55vh] overflow-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-card ${
                m.who === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <div>{m.text}</div>
              <div className="text-[10px] opacity-60 mt-1">
                {m.time.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="max-w-[70%] rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200">
              Thinking...
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 p-4 flex flex-wrap gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={Boolean(imageUrl)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-xl text-sm"
            placeholder={imageUrl ? "Image selected. Send to continue." : "Type your message"}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="text-sm"
          />
          <button
            type="button"
            onClick={handleSpeech}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            Mic
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
