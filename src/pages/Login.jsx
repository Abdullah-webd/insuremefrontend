import React, { useState } from "react";

const DUMMY = {
  email: "admin@heirsinsurance.com",
  password: "Heirs123"
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === DUMMY.email && password === DUMMY.password) {
      localStorage.setItem("insureme_admin_auth", "true");
      window.location.href = "/admin";
      return;
    }
    setError("Invalid credentials. Use admin@heirsinsurance.com / Heirs123");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-slate-200 rounded-2xl shadow-card p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
          <p className="text-sm text-red-600">Sign in to manage Heirs Insurance</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              placeholder="admin@heirsinsurance.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              placeholder="Heirs123"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-red-700 text-white text-sm"
          >
            Sign In
          </button>
        </form>
        <p className="text-xs text-red-400 mt-4">
          Dummy login only. Use admin@heirsinsurance.com / Heirs123
        </p>
      </div>
    </div>
  );
}
