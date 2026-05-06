import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { formatDate, STATUS_STYLES } from "../utils/admin.js";

export default function VerifierDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("insureme_user") || "{}");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const verifierKey = user?._id || user?.userId;
      if (!verifierKey) throw new Error("Missing verifier identifier");

      const res = await api.getMyTasks(verifierKey);
      setTasks(res.items || []);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-serif">Assigned Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">Review and verify insurance submissions assigned to you.</p>
        </div>
        <button 
          onClick={fetchTasks}
          className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
        >
           <svg className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
           </svg>
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-[32px] animate-pulse"></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border border-dashed border-slate-300 rounded-[40px] text-slate-400">
           <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <p className="text-lg font-medium">All caught up!</p>
           <p className="text-sm">No pending verification tasks assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <Link 
              to={`/verifier/tasks/${task._id}`} 
              key={task._id}
              className="group bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  task.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  task.verificationStatus === 'suspicious' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                  task.verificationStatus === 'info_needed' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-sky-50 text-sky-700 border-sky-100'
                }`}>
                  {task.verificationStatus || 'Pending'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(task.createdAt)}</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                {task.claimant?.name || task.relatedApplication?.data?.full_name || task.data?.full_name || "Anonymous Applicant"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold opacity-60">
                {task.type?.replace("_", " ")}
              </p>
              {task.claimant?.phone || task.claimant?.email ? (
                <p className="mt-2 text-xs text-slate-500 font-medium truncate">
                  {task.claimant?.phone || task.claimant?.email}
                </p>
              ) : null}
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                    ID
                  </div>
                </div>
                <div className="text-sky-600 group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
