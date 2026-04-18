import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage.jsx";
import AdminApplicationDetailPage from "./pages/AdminApplicationDetailPage.jsx";
import AdminApplicationsPage from "./pages/AdminApplicationsPage.jsx";
import AdminClaimDetailPage from "./pages/AdminClaimDetailPage.jsx";
import AdminClaimsPage from "./pages/AdminClaimsPage.jsx";
import AdminRequestsPage from "./pages/AdminRequestsPage.jsx";
import AdminRequestDetailPage from "./pages/AdminRequestDetailPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import LoginPage from "./pages/Login.jsx";
import AdminUserDetailPage from "./pages/AdminUserDetailPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";

const isAuthed = () => localStorage.getItem("insureme_admin_auth") === "true";

function ProtectedRoute({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
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
      <Routes>
        <Route path="/" element={<Navigate to="/admin/applications" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/applications" replace />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="applications/:id" element={<AdminApplicationDetailPage />} />
          <Route path="claims" element={<AdminClaimsPage />} />
          <Route path="claims/:id" element={<AdminClaimDetailPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="requests/:id" element={<AdminRequestDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:userId" element={<AdminUserDetailPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        <Route
          path="/chat"
          element={
            <ChatShell>
              <ChatPage />
            </ChatShell>
          }
        />

        <Route path="*" element={<Navigate to="/admin/applications" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
