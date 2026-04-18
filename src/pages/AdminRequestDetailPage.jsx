import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getRequest(id);
      setRequest(res.request);
    } catch (err) {
      alert(err.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSendEmail = async () => {
    if (!request) return;
    setSending(true);
    try {
      await api.sendRequestEmail(id, { subject, html: body, text: body });
      alert("Email sent");
    } catch (err) {
      alert(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!request) return <div>No request found</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Request detail</h2>
      <div className="mt-4 p-4 border rounded-lg">
        <div className="text-sm text-slate-600">
          From: {request.userName || request.userId} •{" "}
          {request.userPhone || "-"}
        </div>
        <div className="font-medium mt-2">{request.title}</div>
        <div className="mt-2 text-sm text-slate-700">{request.message}</div>
        <div className="mt-4 text-xs text-slate-500">
          Submitted: {new Date(request.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium">Send email to user</h3>
        <input
          className="w-full p-2 border rounded mt-2"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded mt-2"
          rows={6}
          placeholder="Message body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-2">
          <button
            className="px-4 py-2 bg-slate-900 text-white rounded"
            onClick={handleSendEmail}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
