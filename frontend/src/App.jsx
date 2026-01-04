import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import ContactUsPage from "./pages/ContactUsPage";

import TeamPage from "./pages/TeamPage";
import Events from "./pages/Events"
import SponsorshipPage  from "./pages/SponserUsPage"

/* ===== ADMIN AUTH ===== */
import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";
import ChangePassword from "./pages/admin/ChangePassword";
import AdminGuard from "./auth/AdminGuard";

/* ===== ADMIN PAGES ===== */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminTeamPage from "./pages/admin/AdminTeamPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage";
import AdminGalleryPage from "./pages/admin/AdminGalleryPage";
import AnnouncementsPage from "./pages/AnnouncementsPage"
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage"
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminEventForm from "./pages/admin/AdminEventForm";
import AdminSponsorshipMessages from "./pages/admin/AdminSponsorship"

// ERROR PAGES
import Error404 from "./pages/Error404";
import Error403 from "./pages/Error403";
import Error500 from "./pages/Error500";
import Offline from "./pages/Offline"

function App() {
  return (
    <Routes>
      {/* ===== PUBLIC ===== */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/events" element={<Events />} />

      <Route path="/team" element={<TeamPage />} />
      <Route path="/contactUs" element={<ContactUsPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
       <Route path="/sponsorship" element={<SponsorshipPage />} />

      {/* ===== ADMIN AUTH ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password/:token" element={<ResetPassword />} />

      {/* ===== ADMIN (PROTECTED) ===== */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        }
      />

      <Route
        path="/admin/change-password"
        element={
          <AdminGuard>
            <ChangePassword />
          </AdminGuard>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <AdminGuard>
            <AdminAuditLogs />
          </AdminGuard>
        }
      />

      <Route
        path="/admin/contactMessages"
        element={
          <AdminGuard>
            <AdminContactMessages />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/sponsorship"
        element={
          <AdminGuard>
            <AdminSponsorshipMessages />
          </AdminGuard>
        }
      />

      <Route
        path="/admin/team"
        element={
          <AdminGuard>
            <AdminTeamPage />
          </AdminGuard>
        }
      />

      {/* ===== NEW: LANDING PAGE CMS ===== */}
      <Route
        path="/admin/projects"
        element={
          <AdminGuard>
            <AdminProjectsPage />
          </AdminGuard>
        }
      />

      <Route
        path="/admin/gallery"
        element={
          <AdminGuard>
            <AdminGalleryPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <AdminGuard>
            <AdminAnnouncementsPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/events"
        element={
          <AdminGuard>
           <AdminEvents />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <AdminGuard>
           <AdminEventForm />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/events/:id"
        element={
          <AdminGuard>
           <AdminEventForm />
          </AdminGuard>
        }
      />

      {/* Errors pages */}
     
      <Route path="/403" element={<Error403 />} />
      <Route path="/500" element={<Error500 />} />
      <Route path="/offline" element={<Offline />} />
       <Route path="*" element={<Error404 />} />


      
    </Routes>
  );
}

export default App;
