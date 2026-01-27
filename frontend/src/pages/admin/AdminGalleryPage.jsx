import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { buildMediaUrl } from "../../../utils/mediaUrl";

export default function AdminGalleryPage() {
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

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
  }, []);

  const loadImages = async () => {
    try {
      const res = await api.get("/gallery/");
      setImages(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load gallery", err);
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

  const upload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    for (const file of fileList) {
      if (file.size > 800 * 1024) {
        showToast(
          `"${file.name}" exceeds the maximum allowed size of 800 KB.`,
          "error"
        );
        return;
      }
    }

    const fd = new FormData();
    Array.from(fileList).forEach((file) => {
      fd.append("images", file);
    });

    try {
      setUploading(true);
      await api.post("/gallery/upload/", fd);
      await loadImages();
      showToast("Images uploaded successfully.", "success");
    } catch (err) {
      console.error("Upload failed", err);
      showToast("Failed to upload images. Please try again.", "error");
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
      <div className="mb-8 p-5 rounded-xl border border-white/10 bg-white/5">
        <p className="text-sm text-gray-300 mb-3">
          Upload one or more images (max 800 KB per image).
        </p>

        <label
          className={`
            inline-flex items-center gap-3 px-4 py-2 rounded-lg
            border border-dashed border-cyan-400/40
            cursor-pointer transition
            hover:bg-white/5
            ${uploading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <span className="text-sm text-cyan-300">
            Choose Images
          </span>

          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading}
            onChange={(e) => upload(e.target.files)}
            className="hidden"
          />
        </label>

        {uploading && (
          <div className="flex items-center gap-2 mt-3 text-gray-400 text-sm">
            <span className="animate-spin">⏳</span>
            Uploading images…
          </div>
        )}
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
