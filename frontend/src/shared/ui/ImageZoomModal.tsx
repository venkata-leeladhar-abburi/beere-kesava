import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface ZoomImage {
  url: string;
  label: string;
}

/**
 * Fullscreen click-to-zoom overlay for a single image. Shared by every
 * "click a thumbnail to view it full-size" table/drawer in the app.
 */
export function ImageZoomModal({ image, onClose }: { image: ZoomImage | null; onClose: () => void }) {
  useEffect(() => {
    if (!image) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          key="zoom" role="dialog" aria-modal="true" aria-label={image.label}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "var(--surface-scrim)", zIndex: "var(--z-modal)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 14, cursor: "zoom-out", padding: 24,
          }}
        >
          <img src={image.url} alt={image.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#fff", fontWeight: 600 }}>{image.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
