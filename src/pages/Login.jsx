import React, { useState } from "react";
import { api } from "../services/api.js";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isRegister && !acceptedTerms) {
      setError("You must accept the terms and conditions to create an account.");
      setLoading(false);
      return;
    }

    try {
      let data;
      if (isRegister) {
        data = await api.register({ name, email, password });
      } else {
        data = await api.login({ email, password });
      }

      localStorage.setItem("insureme_token", data.token);
      localStorage.setItem("insureme_user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else if (data.user.role === "verifier") {
        window.location.href = "/verifier";
      } else {
        window.location.href = "/chat";
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#ffffff_100%)] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-slate-200 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.1)] p-8 bg-white/80 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-red-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{isRegister ? "Create Account" : "Welcome Back"}</h1>
          <p className="text-sm text-slate-500 mt-2">
            {isRegister ? "Join Heirs Insurance today" : "Sign in to manage your insurance"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div className="flex items-start gap-3 mt-4">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(true);
                  }}
                  className="text-red-600 font-medium hover:underline focus:outline-none"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-red-700 text-white font-bold text-sm shadow-[0_12px_24px_-8px_rgba(185,28,28,0.4)] hover:bg-red-800 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              isRegister ? "Create Account" : "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register Now"}
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Terms and Conditions</h2>
            <div className="prose prose-sm text-slate-600 max-h-[60vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
              <p>Welcome to Heirs Insurance.</p>
              <p className="mt-2">By creating an account, you agree to the following terms:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You will provide accurate and truthful information during the application process.</li>
                <li>You agree to our privacy policy regarding the handling of your personal data.</li>
                <li>You acknowledge that submitting an application does not guarantee coverage until approved and paid.</li>
                <li>You agree not to misuse our AI services or attempt to submit fraudulent claims.</li>
              </ul>
              <p className="mt-4">Please read our full documentation on our main site for comprehensive details.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTerms(false);
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
