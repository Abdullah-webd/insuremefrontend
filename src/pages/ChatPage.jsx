import React, { useEffect, useRef, useState } from "react";
import { api, uploadToCloudinary } from "../services/api.js";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [tempUserId, setTempUserId] = useState("user_123");
  const [userId, setUserId] = useState("user_123");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [typingText, setTypingText] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const loadHistory = async (idToLoad) => {
    if (!idToLoad) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await api.getChatHistory(idToLoad);
      const msgs = (res.messages || []).map((m, i) => ({
        id: `${m.who || "bot"}-${i}-${Date.parse(m.time) || i}`,
        who: m.who || "bot",
        text: m.text || "",
        time: m.time ? new Date(m.time) : new Date(),
      }));
      setMessages(msgs);
      if (msgs.length === 0) {
        setHistoryError("No chat history found for this ID.");
      }
    } catch (err) {
      setHistoryError("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(userId);
  }, [userId]);

  const handleSaveId = () => {
    if (!tempUserId.trim()) return;
    setUserId(tempUserId.trim());
  };

  const sendMessage = async (content) => {
    const userMsg = { id: Date.now(), who: "user", text: content, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTypingText("Responding...");
    
    const typingTimer = setTimeout(() => {
      setTypingText("Typing...");
    }, 3000);

    try {
      const res = await api.sendChat(userId, content, selectedLanguage);
      
      // If the AI responded faster than the "typing" delay, we still want to make it look natural
      // But for now, we'll just show it once we have the reply.
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, who: "bot", text: res.reply, time: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          who: "bot",
          text: err.message || "Error connecting to AI",
          time: new Date(),
        },
      ]);
    } finally {
      clearTimeout(typingTimer);
      setLoading(false);
      setTypingText(""); 
    }
  };

  const handleSend = async () => {
    if (loading || uploading) return;
    if (imageUrl) {
      await sendMessage(`IMAGE: ${imageUrl}`);
      setImageUrl(null);
      return;
    }
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendMessage(text);
  };

  const handleUpload = async (file) => {
    if (loading) return;
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

  const handleRead = (text, lang) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }
    // Stop any current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map our language names to standard codes
    const langMap = {
      "English": "en-US",
      "Hausa": "ha-NG",
      "Igbo": "ig-NG",
      "Yoruba": "yo-NG",
      "Pidgin": "en-NG"
    };
    
    utterance.lang = langMap[lang] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">User Chat</h2>
        <p className="text-sm text-red-600">
          Chat with the Heirs Insurance assistant
        </p>
      </div>

      <div className="border border-slate-200 rounded-2xl shadow-card bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 flex items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Session ID:</span>
            <input
              value={tempUserId}
              onChange={(e) => setTempUserId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              placeholder="user_123"
            />
            <button 
              onClick={handleSaveId}
              disabled={historyLoading}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {historyLoading ? "Saving..." : "Save ID"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Language:</span>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all cursor-pointer font-medium"
            >
              <option value="English">English</option>
              <option value="Hausa">Hausa</option>
              <option value="Igbo">Igbo</option>
              <option value="Yoruba">Yoruba</option>
              <option value="Pidgin">Pidgin</option>
            </select>
          </div>
          
          {imageUrl && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
                Image ready to send
              </span>
            </div>
          )}
        </div>

        <div ref={logRef} className="p-4 h-[55vh] overflow-auto space-y-4 bg-white relative">
          {historyLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                <span className="text-xs font-medium text-slate-500">Fetching history...</span>
              </div>
            </div>
          )}

          {historyError && !historyLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📭</span>
              </div>
              <p className="text-sm font-medium text-slate-600">{historyError}</p>
              <p className="text-xs text-slate-400">Start typing to begin a new conversation.</p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[70%] group relative rounded-2xl px-4 py-3 text-sm shadow-sm ${
                m.who === "user"
                  ? "ml-auto bg-red-700 text-white ring-1 ring-red-800"
                  : "bg-slate-50 border border-slate-200 text-slate-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="flex items-center justify-between mt-1.5">
                <div className={`text-[10px] font-medium ${m.who === "user" ? "text-red-100" : "text-slate-400"}`}>
                  {m.time instanceof Date
                    ? m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {!loading && (
                  <button
                    onClick={() => handleRead(m.text, selectedLanguage)}
                    className={`text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ml-4 ${
                      m.who === "user" ? "text-red-200 hover:text-white" : "text-slate-400 hover:text-red-600"
                    }`}
                    title="Read aloud"
                  >
                    🔊 Speak
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && typingText && (
            <div className="flex items-center gap-2 max-w-[70%] rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 text-slate-500 italic shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>{typingText}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 bg-slate-50/30">
          {uploading && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs font-medium">
              <div className="w-3 h-3 border-2 border-blue-700/20 border-t-blue-700 rounded-full animate-spin"></div>
              Uploading image to insurance portal...
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={Boolean(imageUrl) || loading || uploading}
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-xl text-sm"
            placeholder={
              imageUrl
                ? "Image selected. Send to continue."
                : "Type your message"
            }
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            disabled={uploading || loading}
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
            disabled={uploading || loading || (!input.trim() && !imageUrl)}
            className="px-4 py-2 rounded-xl bg-red-700 text-white text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
