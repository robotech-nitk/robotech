import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" // info | success | error
  });

  const limit = 10;
  const navigate = useNavigate();

  /* ================= TOAST ================= */
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "info" }),
      3000
    );
  };

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchEvents();
  }, [page]);

  async function fetchEvents() {
    try {
      const res = await api.get("/events/", {
        params: { page, limit }
      });
      // Handle DRF Standard Pagination or plain list
      const list = res.data.results || res.data;
      const count = res.data.count || list.length;

      setEvents(list);
      setTotal(count);
    } catch (err) {
      console.error(err);
      showToast("Failed to load events.", "error");
    }
  }

  /* ================= DELETE ================= */
  function openDeleteModal(id) {
    setDeleteId(id);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteId(null);
  }

  async function confirmDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await api.delete(`/events/${deleteId}/`);
      showToast("Event deleted successfully.", "success");
      fetchEvents();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete event.", "error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="p-4 sm:p-6 text-white max-w-6xl mx-auto">

      {/* ===== BACK NAV ===== */}
      <button
        onClick={() => navigate("/portal/dashboard")}
        className="text-sm text-cyan-400 hover:underline mb-4 w-fit flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-tight">
            Event Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Coordinate club events and track responder metrics.</p>
        </div>

        <button
          onClick={() => navigate("/portal/events/new")}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition uppercase tracking-widest text-[10px]"
        >
          + New Log
        </button>
      </div>

      {/* ===== LIST ===== */}
      <div className="grid gap-4">
        {events.map(e => (
          <div
            key={e.id}
            className="
              rounded-xl
              border border-white/10
              bg-white/5
              p-4
              flex flex-col sm:flex-row
              sm:justify-between sm:items-center
              gap-4
            "
          >
            <div>
              <h3 className="text-lg text-cyan-300 font-semibold">
                {e.title}
              </h3>
              <p className="text-sm text-gray-400">
                Registration:{" "}
                {e.registration_enabled ? "Enabled" : "Disabled"}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/portal/events/${e.id}`)}
                className="text-cyan-400 hover:text-white transition uppercase font-black text-[10px] tracking-widest"
              >
                Edit Parameters
              </button>

              <button
                onClick={() => openDeleteModal(e.id)}
                className="text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!events.length && (
          <p className="text-gray-500 text-center">
            No events found
          </p>
        )}
      </div>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b0b0b] border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3">
              Delete Event
            </h2>

            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete this event permanently?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
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
