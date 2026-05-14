import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { Surface, MediaCard, MediaLightbox, StatusBadge } from "../components/AdminUi.jsx";
import { getApplicationFields, formatFieldValue, formatDate } from "../utils/admin.js";
import toast from "react-hot-toast";

export default function VerifierSubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [claimant, setClaimant] = useState(null);
  const [relatedApplication, setRelatedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("insureme_user") || "{}");
      const verifierKey = user?._id || user?.userId;
      if (!verifierKey) throw new Error("Missing verifier identifier");

      const res = await api.getVerifierTask(id, verifierKey);
      const nextSubmission = res.submission || null;
      setSubmission(nextSubmission);
      setClaimant(res.claimant || null);
      setRelatedApplication(res.relatedApplication || null);
      setNotes(nextSubmission?.verifierNotes || "");
      setStatus(nextSubmission?.verificationStatus || "pending");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.verifySubmission(id, { status, notes });
      toast.success("Verification status updated successfully.");
      navigate("/verifier/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const { fields } = useMemo(() => getApplicationFields(submission), [submission]);
  const mediaFields = fields.filter(f => f.media);

  if (loading) return <div className="p-10 text-center">Loading task details...</div>;
  if (!submission) return <div className="p-10 text-center text-rose-600">Task not found.</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link to="/verifier/dashboard" className="text-sm font-bold text-sky-700 flex items-center gap-2 hover:translate-x-1 transition-transform">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           Back to Tasks
        </Link>
        <div className="flex items-center gap-4">
           <StatusBadge status={submission.status} />
           <span className="text-xs font-bold text-slate-400 border-l pl-4 uppercase tracking-[0.2em]">{submission.type}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {(claimant || relatedApplication) ? (
            <Surface className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 border-b pb-4 mb-6">
                Claimant & Policy Info
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Full Name</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                    {claimant?.name || relatedApplication?.data?.full_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Phone</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                    {claimant?.phone || relatedApplication?.data?.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Email</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                    {claimant?.email || relatedApplication?.data?.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Related Application</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                    {relatedApplication?._id ? `${relatedApplication.type} (${relatedApplication.status})` : "-"}
                  </p>
                </div>
              </div>
            </Surface>
          ) : null}

          <Surface className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-4 mb-6">Applicant Data</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {fields.filter(f => !f.media).map(f => (
                <div key={f.key}>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">{f.label}</p>
                   <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                     {formatFieldValue(submission.data?.[f.key])}
                   </p>
                </div>
              ))}
            </div>
          </Surface>

          {mediaFields.length > 0 && (
             <Surface className="p-8">
               <h2 className="text-2xl font-bold text-slate-900 border-b pb-4 mb-6">Supporting Documents</h2>
               <div className="grid gap-6 sm:grid-cols-2">
                  {mediaFields.map(f => (
                    <MediaCard
                      key={f.key}
                      title={f.label}
                      value={submission.data?.[f.key]}
                      disabled={true}
                      onPreview={(item) => setPreviewMedia({ item, title: f.label })}
                    />
                  ))}
               </div>
             </Surface>
          )}
        </div>

        <aside className="space-y-6">
          <Surface className="p-6 sticky top-8 bg-sky-50/30 border-sky-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Verification Verdict</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Status Verdict</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="pending">Pending Review</option>
                  <option value="verified">Verified & Authentic</option>
                  <option value="suspicious">Suspicious / Fraud Risk</option>
                  <option value="info_needed">Further Info Needed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Audit Notes</label>
                <textarea 
                  rows="6"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain your verdict..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-sky-200 hover:bg-sky-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {saving ? "Saving..." : "Submit Verdict"}
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-sky-100 italic text-slate-500 text-[10px] text-center">
              Your verdict will be logged and visible to administrators. Please ensure accuracy before submitting.
            </div>
          </Surface>
        </aside>
      </div>

      <MediaLightbox 
        item={previewMedia?.item} 
        title={previewMedia?.title} 
        onClose={() => setPreviewMedia(null)} 
      />
    </div>
  );
}
