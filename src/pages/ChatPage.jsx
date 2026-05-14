import React, { useEffect, useRef, useState } from "react";
import { api, uploadToCloudinary } from "../services/api.js";
import toast from "react-hot-toast";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [tempUserId, setTempUserId] = useState("user_123");
  const [userId, setUserId] = useState("user_123");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePack, setImagePack] = useState([]);
  const [documentPack, setDocumentPack] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [typingText, setTypingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
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
    const user = JSON.parse(localStorage.getItem("insureme_user") || "{}");
    if (user.userId) {
      setUserId(user.userId);
      setTempUserId(user.userId);
    }
  }, []);

  useEffect(() => {
    loadHistory(userId);
  }, [userId]);

  const sendMessage = async (content) => {
    const userMsg = { id: Date.now(), who: "user", text: content, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTypingText("🔄 Initializing system...");
    
    const botMsgId = Date.now() + 1;
    let initializedBotMsg = false;
    let currentText = "";

    await api.sendChatStream(
      userId,
      content,
      selectedLanguage,
      (chunkText) => {
        if (!initializedBotMsg) {
          setTypingText("");
          setMessages((prev) => [
            ...prev,
            { id: botMsgId, who: "bot", text: chunkText, time: new Date() },
          ]);
          initializedBotMsg = true;
          currentText += chunkText;
        } else {
          currentText += chunkText;
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: currentText } : m))
          );
        }
      },
      (statusText) => {
        setTypingText(statusText);
      },
      (doneData) => {
        setLoading(false);
        setTypingText("");
      },
      (err) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            who: "bot",
            text: err.message || "Error connecting to AI",
            time: new Date(),
          },
        ]);
        setLoading(false);
        setTypingText("");
      }
    );
  };

  const handleSend = async () => {
    if (loading || uploading) return;
    
    let finalContent = input.trim();
    
    if (imagePack.length > 0) {
      const imageList = imagePack.map(url => `IMAGE: ${url}`).join(" ");
      finalContent = finalContent ? `${finalContent}\n\n${imageList}` : imageList;
    }

    if (documentPack.length > 0) {
      const docList = documentPack.map((url) => `DOCUMENT: ${url}`).join(" ");
      finalContent = finalContent ? `${finalContent}\n\n${docList}` : docList;
    }
    
    if (finalContent) {
      setInput("");
      setImagePack([]);
      setDocumentPack([]);
      await sendMessage(finalContent);
    }
  };

  const handleUpload = async (file) => {
    if (loading) return;
    const total = imagePack.length + documentPack.length;
    if (total >= 10) {
      toast.error("You can upload up to 10 files at a time.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const lowerName = String(file?.name || "").toLowerCase();
      const isDoc =
        String(file?.type || "").toLowerCase().includes("pdf") ||
        String(file?.type || "").toLowerCase().includes("msword") ||
        String(file?.type || "").toLowerCase().includes("officedocument") ||
        lowerName.endsWith(".pdf") ||
        lowerName.endsWith(".doc") ||
        lowerName.endsWith(".docx");

      if (isDoc) setDocumentPack((prev) => [...prev, url]);
      else setImagePack((prev) => [...prev, url]);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImagePack(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveDocument = (index) => {
    setDocumentPack((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpeech = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (e) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput((prev) => (prev ? `${prev.trim()} ${finalTranscript}` : finalTranscript));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleRead = (text, lang) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
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
        <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</p>
              <p className="text-sm font-semibold text-slate-800">
                {JSON.parse(localStorage.getItem("insureme_user") || "{}").name || "User"}
              </p>
            </div>
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
          
          {imagePack.length + documentPack.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
                {imagePack.length + documentPack.length} file{imagePack.length + documentPack.length > 1 ? 's' : ''} ready
              </span>
            </div>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("insureme_token");
              localStorage.removeItem("insureme_user");
              window.location.href = "/login";
            }}
            className="ml-4 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
          >
            Log Out
          </button>
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
              <div className="whitespace-pre-wrap space-y-2">
                {m.text.split(/((?:IMAGE|DOCUMENT|LINK): (?:https?:\/\/[^\s\)]+|\/[^\s\)]+)|https?:\/\/[^\s\)]+)/g).map((part, idx) => {
                  if (part.startsWith("LINK: ")) {
                    const url = part.replace("LINK: ", "").trim();
                    return (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 underline font-semibold block mt-1 hover:text-blue-800 transition-colors"
                      >
                        Click here to view the policy
                      </a>
                    );
                  }
                  if (part.startsWith("IMAGE: ")) {
                    const url = part.replace("IMAGE: ", "").trim();
                    return (
                      <img 
                        key={idx} 
                        src={url} 
                        alt="Upload" 
                        className="max-w-[240px] w-full h-auto rounded-xl object-cover bg-black/5 shadow-sm border border-black/5 block" 
                      />
                    );
                  }
                  if (part.startsWith("DOCUMENT: ")) {
                    const url = part.replace("DOCUMENT: ", "").trim();
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                          m.who === "user"
                            ? "border-red-200 bg-red-600/30 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                          </svg>
                        </span>
                        Open document
                      </a>
                    );
                  }
                  return part.trim() ? <div key={idx}>{part}</div> : null;
                })}
              </div>
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
          {(uploading || imagePack.length > 0 || documentPack.length > 0) && (
            <div className="mb-4 flex flex-col gap-3">
              {uploading && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-[10px] font-bold uppercase tracking-wider animate-pulse font-mono">
                  <div className="w-3 h-3 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                  Uploading media to portal...
                </div>
              )}
              {imagePack.length > 0 && (
                <div className="flex gap-3 overflow-auto pb-2">
                  {imagePack.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-red-100 shadow-sm transition-transform hover:scale-105">
                      <img src={url} alt="Pending" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {documentPack.length > 0 && (
                <div className="flex gap-3 overflow-auto pb-2">
                  {documentPack.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative flex h-20 w-48 shrink-0 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-3 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 underline decoration-slate-200 underline-offset-4"
                        title={url}
                      >
                        Document link
                      </a>
                      <button
                        onClick={() => handleRemoveDocument(idx)}
                        className="absolute top-1 right-1 bg-slate-900 text-white rounded-full p-1 shadow-md hover:bg-black transition-colors"
                        title="Remove"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                rows="1"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none min-h-[44px] max-h-[150px]"
                placeholder={uploading ? "Waiting for upload..." : "Type your message..."}
              />
            </div>
            
            <div className="flex gap-2 shrink-0 pt-1">
              <label className={`cursor-pointer group ${uploading || loading ? "pointer-events-none opacity-40" : ""}`}>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,video/*,application/pdf,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(handleUpload);
                  }}
                  disabled={uploading || loading}
                />
                <div className="p-3 rounded-xl border border-slate-200 bg-white group-hover:bg-red-50 group-hover:border-red-200 transition-all shadow-sm">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </label>

              <button
                type="button"
                onClick={handleSpeech}
                disabled={uploading || loading}
                className={`p-3 rounded-xl border transition-all shadow-sm disabled:opacity-40 ${
                  isRecording 
                    ? "bg-red-500 border-red-600 text-white animate-pulse shadow-red-200" 
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                }`}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   {isRecording ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
                   ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                   )}
                </svg>
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={uploading || loading || (!input.trim() && imagePack.length === 0 && documentPack.length === 0)}
                className="px-6 py-3 rounded-2xl bg-red-800 text-white text-sm font-bold shadow-lg shadow-red-100 hover:bg-red-900 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
