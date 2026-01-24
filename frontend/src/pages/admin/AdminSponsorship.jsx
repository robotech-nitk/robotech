import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ================= CONFIG ================= */

const PAGE_SIZE = 5;

/* ================= COMPONENT ================= */

export default function AdminSponsorshipPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    try {
      const res = await api.get("/sponsorship/");
      setItems(res.data);
    } catch {
      showToast("Failed to load sponsorship inquiries", "error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= DELETE ================= */

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/sponsorship/${deleteTarget.id}/`);
      setItems((prev) =>
        prev.filter((i) => i.id !== deleteTarget.id)
      );
      showToast("Inquiry deleted", "success");
      setDeleteTarget(null);
    } catch {
      showToast("Failed to delete inquiry", "error");
    } finally {
      setDeleting(false);
    }
  }

  /* ================= TOAST ================= */

  function showToast(message, type) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* ================= UI ================= */

  return (
    <main className="max-w-6xl mx-auto py-8 px-4 text-white">

      {/* ===== BACK NAV ===== */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="text-sm text-cyan-400 hover:underline mb-4 w-fit"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-6">
        Sponsorship Inquiries
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : paginatedItems.length === 0 ? (
        <p>No sponsorship inquiries found.</p>
      ) : (
        <>
          <div className="space-y-5">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-700 bg-white/5 p-4"
              >
                {/* HEADER */}
                <div className="mb-2">
                  <h3 className="font-semibold text-lg">
                    {item.name}
                  </h3>

                  {item.organization && (
                    <p className="text-sm text-gray-400">
                      {item.organization}
                    </p>
                  )}

                  <p className="text-sm text-gray-400 mt-1">
                    {item.email}
                    {item.phone && ` • ${item.phone}`}
                  </p>
                </div>

                {/* MESSAGE */}
                <p className="mt-3 text-gray-200 whitespace-pre-wrap text-sm">
                  {item.message}
                </p>

                {/* ACTIONS */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => replyViaGmail(item.email)}
                    className="
                      w-full sm:w-auto
                      px-4 py-2 rounded
                      bg-cyan-500 text-black
                      text-sm font-medium
                    "
                  >
                    Reply via Gmail
                  </button>

                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="
                      w-full sm:w-auto
                      px-4 py-2 rounded
                      bg-red-500/10 text-red-400
                      border border-red-500/30
                      text-sm
                    "
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`
                    min-w-[40px] h-10 rounded
                    ${currentPage === i + 1
                      ? "bg-cyan-500 text-black"
                      : "bg-gray-700"
                    }
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== DELETE MODAL ===== */}
      {deleteTarget && (
        <Modal>
          <h2 className="text-lg font-semibold mb-2">
            Delete inquiry?
          </h2>
          <p className="text-gray-300 mb-6 text-sm">
            This action cannot be undone.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded bg-gray-600"
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded bg-red-500 text-black"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* ===== TOAST ===== */}
      {toast && <Toast {...toast} />}
    </main>
  );
}

/* ================= UI HELPERS ================= */

function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-xl bg-[#0b0b0b] border border-gray-700 p-6">
        {children}
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2
        px-4 py-2 rounded shadow-lg
        text-sm
        ${type === "success" ? "bg-green-500 text-black" : ""}
        ${type === "error" ? "bg-red-500 text-black" : ""}
      `}
    >
      {message}
    </div>
  );
}

function replyViaGmail(email) {
  const url =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(email)}` +
    "&su=RoboTech NITK Sponsorship Inquiry";

  window.open(url, "_blank");
}
