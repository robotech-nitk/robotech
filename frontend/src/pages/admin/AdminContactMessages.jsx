import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminContactMessages() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  /* ===== DELETE CONFIRMATION ===== */
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [filters, setFilters] = useState({
    isRead: "",
    isReplied: "",
    email: "",
    subject: "",
    fromDate: "",
    toDate: "",
  });

  const limit = 10;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contact-messages/", {
        params: {
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== "")
          ),
        },
      });
      setMessages(res.data || []);
      setTotal(res.data?.length || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, filters]);

  const openMessage = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      await api.patch(`/contact-messages/${msg.id}/`, { is_read: true });
      fetchMessages();
    }
  };

  const openGmailReply = (msg) => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      msg.email
    )}&su=${encodeURIComponent(
      "Re: " + (msg.subject || "Contact Message")
    )}`;
    window.open(gmailUrl, "_blank");
  };

  const confirmDeleteMessage = async () => {
    await api.delete(`/contact-messages/${selected.id}/`);
    setConfirmDelete(false);
    setSelected(null);
    fetchMessages();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 sm:p-6 text-white max-w-6xl mx-auto">

      {/* ===== BACK NAV ===== */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="text-sm text-cyan-400 hover:underline mb-4 w-fit"
      >
        ← Back to Dashboard
      </button>

      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-400">
          Contact Messages
        </h1>
        <p className="text-sm text-gray-400">
          Messages submitted from the Contact Us page
        </p>
      </div>

      {/* ===== DESKTOP TABLE ===== */}
      <div className="glass-card hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Subject</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Received</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400">
                  Loading messages…
                </td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400">
                  No messages found
                </td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className={`border-t border-white/10 cursor-pointer transition ${m.is_read
                    ? "hover:bg-white/5"
                    : "bg-indigo-500/10 hover:bg-indigo-500/20"
                    }`}
                >
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 text-indigo-300">{m.email}</td>
                  <td className="p-3">{m.subject || "-"}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${m.is_read
                        ? "bg-gray-600/40"
                        : "bg-indigo-500/60"
                        }`}
                    >
                      {m.is_read ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td className="p-3 text-center text-gray-400">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MOBILE CARDS ===== */}
      <div className="md:hidden space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            onClick={() => openMessage(m)}
            className={`glass-card p-4 cursor-pointer transition ${m.is_read ? "" : "ring-1 ring-indigo-400/50"
              }`}
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold">{m.name}</h3>
              <span className="text-xs px-2 py-1 rounded bg-indigo-500/60">
                {m.is_read ? "Read" : "Unread"}
              </span>
            </div>
            <p className="text-xs text-indigo-300 break-all">{m.email}</p>
            <p className="text-sm mt-2">{m.subject || "No subject"}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(m.created_at).toLocaleString()}
            </p>

          </div>
        ))}
      </div>

      {/* ===== MESSAGE MODAL ===== */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="glass-card w-full sm:max-w-xl p-5">
            <h2 className="text-lg font-semibold text-indigo-400 mb-1">
              {selected.subject || "No Subject"}
            </h2>
            <p className="text-xs text-gray-400 mb-3 break-all">
              {selected.name} — {selected.email}
            </p>

            <div className="text-sm text-gray-200 whitespace-pre-wrap mb-5">
              {selected.message}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openGmailReply(selected)}
                className="btn-primary w-full"
              >
                Reply via Gmail
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-danger w-full"
              >
                Delete
              </button>
              <button
                onClick={() => setSelected(null)}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="glass-card w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold mb-3">
              Delete this message?
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDeleteMessage}
                className="btn-danger w-full"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== THEME HELPERS ===== */}
      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }
        .btn-primary {
          background: #5b5bdc;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
        }
        .btn-secondary {
          background: rgba(255,255,255,0.15);
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
        }
        .btn-danger {
          background: #dc2626;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
