import { useRef } from "react";

export default function AnnouncementDetailModal({
  announcement,
  loading,
  onClose
}) {
  // ===== GUARDS =====
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
        <div className="text-gray-400">Loading announcement…</div>
      </div>
    );
  }

  if (!announcement) return null;

  // ===== SWIPE LOGIC =====
  const startY = useRef(0);

  function handleTouchStart(e) {
    startY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    const currentY = e.touches[0].clientY;
    if (currentY - startY.current > 120) {
      onClose();
    }
  }

  const shareUrl = window.location.href;
  const shareText = encodeURIComponent(announcement.title);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center px-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div
        className="
          w-full max-w-3xl
          bg-[#0b0b0b]
          rounded-t-2xl sm:rounded-2xl
          border border-white/10
          shadow-xl
          max-h-[90vh]
          overflow-y-auto
        "
      >
        {/* DRAG INDICATOR (MOBILE) */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/10 flex justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-cyan-400">
              {announcement.title}
            </h2>
            {announcement.published_at && (
              <p className="text-xs text-gray-400 mt-1">
                Published{" "}
                {new Date(announcement.published_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 space-y-6">
          {/* CONTENT */}
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.body_html }}
          />

          {/* ATTACHMENTS */}
          {announcement.files?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-300">
                Attachments
              </h3>
              <ul className="space-y-2">
                {announcement.files.map(file => (
                  <li key={file.id}>
                    <a
                      href={`/api/announcements/files/${file.id}`}
                      className="text-cyan-400 hover:underline"
                    >
                      {file.original_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SHARE */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-300">
              Share
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert("Link copied");
                }}
                className="px-3 py-1.5 rounded border border-white/20 text-sm hover:bg-white/10"
              >
                Copy link
              </button>

              <a
                href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded border border-white/20 text-sm hover:bg-white/10"
              >
                WhatsApp
              </a>

              <a
                href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded border border-white/20 text-sm hover:bg-white/10"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-white/20 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
