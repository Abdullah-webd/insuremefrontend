import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api.js";
import { STATUS_STYLES, formatDate } from "../utils/admin.js";

export default function AdminChatsPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get("userId");
    fetchUsers(userIdFromUrl);
  }, []);

  const fetchUsers = async (autoSelectId) => {
    setLoadingUsers(true);
    try {
      const res = await api.getUsers();
      const items = res.items || [];
      setUsers(items);
      if (autoSelectId) {
        const found = items.find(u => u.userId === autoSelectId);
        if (found) setSelectedUser(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchChat(selectedUser.userId);
    }
  }, [selectedUser]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const fetchChat = async (userId) => {
    setLoadingChat(true);
    try {
      const res = await api.getChatHistory(userId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 font-serif">Chat Logs</h1>
        <p className="text-sm text-slate-500">Monitor AI conversations with users</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* User Sidebar */}
        <div className="w-80 bg-white border border-slate-200 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users</h2>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {loadingUsers ? (
              <div className="p-4 text-center text-sm text-slate-400">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">No users found</div>
            ) : (
              users.map(user => (
                <button
                  key={user.userId}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${
                    selectedUser?.userId === user.userId 
                      ? "bg-red-50 text-red-700 ring-1 ring-red-100 shadow-sm" 
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{user.name || "Anonymous User"}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.userId}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Viewer */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[32px] overflow-hidden flex flex-col shadow-sm relative">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Select a user to view chat history</p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{selectedUser.name || "Anonymous"}</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Current Session: {selectedUser.userId}</p>
                </div>
                <button 
                  onClick={() => fetchChat(selectedUser.userId)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Refresh Chat"
                >
                  <svg className={`w-4 h-4 text-slate-600 ${loadingChat ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div ref={chatRef} className="flex-1 overflow-auto p-6 space-y-4 bg-white">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                    No messages in this conversation.
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        m.who === "user"
                          ? "ml-auto bg-slate-900 text-white"
                          : "mr-auto bg-slate-50 border border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {m.text.startsWith("IMAGE: ") ? (
                          <div className="space-y-2">
                             <p className="text-[10px] uppercase font-bold opacity-60">Uploaded Image</p>
                             <img src={m.text.replace("IMAGE: ", "")} alt="Chat Media" className="max-w-full h-auto rounded-lg" />
                          </div>
                        ) : m.text}
                      </div>
                      <div className={`mt-2 text-[10px] ${m.who === "user" ? "text-slate-400" : "text-slate-500"}`}>
                        {new Date(m.time).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {loadingChat && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
