import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { buildMediaUrl } from "../../utils/mediaUrl";

export default function AdminGalleryPage() {
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [events, setEvents] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ========= TOAST STATE ========= */
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info", // info | error | success
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    loadImages();
    loadEvents();
  }, []);

  const loadImages = async () => {
    try {
      const res = await api.get("/gallery/");
      setImages(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load gallery", err);
    }
  };

  const loadEvents = async () => {
    try {
      // Fetch simple list of events for dropdown
      const res = await api.get("/events/?limit=100");
      const list = res.data.results || res.data || [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  /* ================= TOAST HELPER ================= */

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  /* ================= UPLOAD ================= */

  const handleFileSelect = (files) => {
    setSelectedFiles(files);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      showToast("Please select at least one image.", "error");
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > 2 * 1024 * 1024) { // Increased to 2MB as mostly standard
        showToast(`"${file.name}" is too large (max 2MB).`, "error");
        return;
      }
    }

    const fd = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      fd.append("images", file);
    });

    // Append metadata
    if (uploadTitle) fd.append("title", uploadTitle);
    if (selectedEventId) fd.append("event_id", selectedEventId);

    try {
      setUploading(true);
      await api.post("/gallery/upload/", fd);
      await loadImages();

      // Reset form
      setUploadTitle("");
      setSelectedEventId("");
      setSelectedFiles(null);
      // Reset file input manually if needed, but since we use label trick, just clearing state is enough logic-wise. 
      // User will see "Choose Images" again.

      showToast("Images uploaded successfully.", "success");
    } catch (err) {
      console.error("Upload failed", err);
      showToast("Failed to upload images.", "error");
    } finally {
      setUploading(false);
    }
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
      await api.delete(`/gallery/${deleteId}/`);
      setDeleteId(null);
      loadImages();
      showToast("Image deleted successfully.", "success");
    } catch (err) {
      console.error("Delete failed", err);
      showToast("Failed to delete image.", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">

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
            Media Archive
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage institutional visual assets and project captures.</p>
        </div>
      </div>

      {/* ===== UPLOAD CARD ===== */}
      {/* ===== UPLOAD CARD ===== */}
      <div className="mb-8 p-6 rounded-xl border border-white/10 bg-[#0F0F12] shadow-lg">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4">Add New Image</h2>

        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 max-w-xl">
          {/* Title Input */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Image Title (Optional)</label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. RoboWars Final 2024"
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-cyan-500/50 outline-none transition"
            />
          </div>

          {/* Event Select */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Associate with Event (Optional)</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-cyan-500/50 outline-none transition"
            >
              <option value="">-- No Event --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'TBD'})
                </option>
              ))}
            </select>
          </div>

          {/* File Input */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">File (Max 2MB)</label>
            <div className="flex gap-4 items-center">
              <label className={`
                        flex-1
                        flex flex-col items-center gap-2 p-4 rounded-lg
                        border border-dashed border-white/20
                        cursor-pointer transition
                        hover:bg-white/5 hover:border-cyan-400/50
                        ${uploading ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                <span className="text-sm text-gray-400">
                  {selectedFiles && selectedFiles.length > 0
                    ? `${selectedFiles.length} file(s) selected`
                    : "Click to select image"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !selectedFiles}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {uploading ? "Uploading..." : "Upload to Gallery"}
          </button>
        </form>
      </div>

      {/* ===== GRID ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20"
          >
            <img
              src={buildMediaUrl(img.image_path)}
              loading="lazy"
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              alt=""
            />

            {/* Overlay Info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end h-full pointer-events-none">
              {img.title && <p className="text-white font-bold text-sm truncate">{img.title}</p>}
              {img.event_title && <p className="text-cyan-400 text-[10px] uppercase font-bold tracking-wider truncate">{img.event_title}</p>}
              {!img.title && !img.event_title && <p className="text-gray-500 text-xs italic">No metadata</p>}
            </div>

            <button
              onClick={() => openDeleteModal(img.id)}
              className="
                absolute top-2 right-2
                bg-red-600 text-xs px-2 py-1 rounded-md
                opacity-100 sm:opacity-0
                sm:group-hover:opacity-100
                focus:opacity-100
                transition
              "
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* ===== EMPTY STATE ===== */}
      {images.length === 0 && (
        <div className="mt-10 text-center text-gray-400 text-sm">
          No gallery images yet.
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b0f1a] border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-3">
              Delete Image
            </h2>

            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
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
