import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage.jsx";
import AdminApplicationDetailPage from "./pages/AdminApplicationDetailPage.jsx";
import AdminApplicationsPage from "./pages/AdminApplicationsPage.jsx";
import AdminClaimDetailPage from "./pages/AdminClaimDetailPage.jsx";
import AdminClaimsPage from "./pages/AdminClaimsPage.jsx";

import ChatPage from "./pages/ChatPage.jsx";
import LoginPage from "./pages/Login.jsx";
import AdminUserDetailPage from "./pages/AdminUserDetailPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminChatsPage from "./pages/AdminChatsPage.jsx";
import VerifierLayout from "./components/VerifierLayout.jsx";
import VerifierDashboard from "./pages/VerifierDashboard.jsx";
import VerifierSubmissionDetail from "./pages/VerifierSubmissionDetail.jsx";
import PolicyPage from "./pages/PolicyPage.jsx";
import { Toaster } from "react-hot-toast";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("insureme_user") || "null");
  } catch {
    return null;
  }
};

const isAuthed = (allowedRoles) => {
  const user = getUser();
  if (!user) return false;
  if (!allowedRoles) return true;
  return allowedRoles.includes(user.role);
};

function ProtectedRoute({ children, roles }) {
  if (!isAuthed(roles)) return <Navigate to="/login" replace />;
  return children;
}

function ChatShell({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_60%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/admin/applications" replace />}
          />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route
            path="applications/:id"
            element={<AdminApplicationDetailPage />}
          />
          <Route path="claims" element={<AdminClaimsPage />} />
          <Route path="claims/:id" element={<AdminClaimDetailPage />} />

          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:userId" element={<AdminUserDetailPage />} />
          <Route path="chats" element={<AdminChatsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        <Route
          path="/verifier"
          element={
            <ProtectedRoute roles={["verifier"]}>
              <VerifierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/verifier/dashboard" replace />} />
          <Route path="dashboard" element={<VerifierDashboard />} />
          <Route path="tasks/:id" element={<VerifierSubmissionDetail />} />
        </Route>

        <Route
          path="/chat"
          element={
            <ProtectedRoute roles={["user", "admin", "verifier"]}>
              <ChatShell>
                <ChatPage />
              </ChatShell>
            </ProtectedRoute>
          }
        />

        <Route path="/policy/:type" element={<PolicyPage />} />

        <Route
          path="*"
          element={<Navigate to="/chat" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
