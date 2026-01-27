import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AnnouncementFormModal from "../../components/AnnouncementFormModal";
import AnnouncementStatusBadge from "../../components/AnnouncementStatusBadge";

export default function AdminAnnouncementsPage() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  /* ===== DELETE STATE ===== */
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ===== TOAST STATE ===== */
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info", // info | success | error
  });

  /* ================= FETCH ================= */

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const res = await api.get("/announcements/");
      setAnnouncements(res.data.results || res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  /* ================= TOAST ================= */

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  /* ================= DELETE (MODAL) ================= */

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.delete(`/announcements/${deleteId}/`);
      setDeleteId(null);
      fetchAnnouncements();
      showToast("Announcement deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete announcement.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ... inside render ... 
  // Update publish URL
  // <button onClick={() => api.post(`/announcements/${a.id}/publish/`).then(fetchAnnouncements)} ... >  (I can't replace inside JSX with this block)
  // I will replace the fetch and delete blocks first. Then handle publish in another call or include it here if contiguous? 
  // The jsx is further down. I'll stick to function definitions first.

  /* ================= UI ================= */

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">

      {/* ===== BACK NAV ===== */}
      <button
        onClick={() => navigate("/portal/dashboard")}
        className="text-sm text-cyan-400 hover:underline mb-4 w-fit flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      {/* ===== HEADER ===== */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-tight">
            Broadcast Control
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Dispatch announcements to the public terminals.
          </p>
        </div>

        <button
          onClick={() => setActiveItem({})}
          className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition uppercase tracking-widest text-[10px] whitespace-nowrap"
        >
          + Initialize Broadcast
        </button>
      </div>

      {/* ===== LIST ===== */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 sm:h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            No announcements yet
          </h2>
          <p className="text-gray-400 text-sm">
            Create your first announcement to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="
                rounded-xl border border-white/10 bg-white/5
                p-4 sm:p-5
                flex flex-col sm:flex-row
                sm:items-center sm:justify-between
                gap-4
              "
            >
              {/* LEFT */}
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  {a.title}
                </h2>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <AnnouncementStatusBadge announcement={a} />
                  {a.published_at && (
                    <span className="text-xs text-gray-400">
                      Published{" "}
                      {new Date(a.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveItem(a)}
                  className="
                    w-full sm:w-auto
                    px-4 py-2.5
                    rounded-md
                    border border-white/20
                    hover:bg-white/10
                    transition
                  "
                >
                  Edit
                </button>

                {!a.published_at && !a.is_archived && (
                  <button
                    onClick={() =>
                      api
                        .post(`/announcements/${a.id}/publish/`)
                        .then(fetchAnnouncements)
                    }
                    className="
                      w-full sm:w-auto
                      px-4 py-2.5
                      rounded-md
                      bg-green-500 hover:bg-green-600
                      text-black font-medium
                      transition
                    "
                  >
                    Publish
                  </button>
                )}

                <button
                  onClick={() => openDeleteModal(a.id)}
                  disabled={deleting && deleteId === a.id}
                  className="
                    w-full sm:w-auto
                    px-4 py-2.5
                    rounded-md
                    bg-red-500 hover:bg-red-600
                    text-white font-medium
                    disabled:opacity-50
                    transition
                  "
                >
                  {deleting && deleteId === a.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== FORM MODAL ===== */}
      {activeItem && (
        <AnnouncementFormModal
          announcement={activeItem}
          onClose={() => setActiveItem(null)}
          onSaved={fetchAnnouncements}
        />
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b0f1a] border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-3">
              Delete Announcement
            </h2>

            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to permanently delete this announcement?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 rounded-md text-sm bg-white/10 hover:bg-white/20 transition disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST ===== */}
      {toast.show && (
        <div
          className={`
            fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm
            ${toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-cyan-600"
            }
          `}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
