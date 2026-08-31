import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { T, F, G, EASE } from "@/features/dashboards";
import { BG_IMAGE } from "../WeaverBatchNotifData";

/**
 * Same visual system as the admin dashboard's overview Hero (photo, gold
 * sweep reveal, headline, CTA buttons, scroll indicator) — scoped to the
 * logged-in weaver instead of the whole business.
 */
export function WeaverHero({ weaverName, onExploreBatches, onGoToPayments }: {
  weaverName: string; onExploreBatches: () => void; onGoToPayments: () => void;
}) {
  return (
    <section style={{ position: "relative", height: "clamp(420px, 56vh, 620px)", overflow: "hidden", background: "#0D0207" }}>
      <motion.img
        src={BG_IMAGE}
        alt="Beere Kesava & Brothers Silks Weaving"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 8, ease: "linear", opacity: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      <motion.div
        initial={{ scaleX: 0, x: "-100%" }}
        animate={{ scaleX: 1, x: "200vw" }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", top: 0, left: 0, width: "60%", height: "100%",
          background: "linear-gradient(to right, transparent 0%, rgba(200,155,71,0.06) 40%, rgba(200,155,71,0.12) 50%, rgba(200,155,71,0.06) 60%, transparent 100%)",
          pointerEvents: "none", zIndex: 8, transformOrigin: "left center",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />

      <div className="px-4 md:px-7 xl:px-12" style={{ position: "relative", zIndex: 5, width: "56%", height: "100%", paddingTop: 36, paddingBottom: 72, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <motion.div
          initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" as const }}>
            Since 1999 · Weaver Portal
          </span>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Welcome back,", italic: false, color: T.warmCream, delay: 0.4 },
            { text: weaverName, italic: true, color: T.antiqueGold, delay: 0.56 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: F.display, fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(30px, 3.2vw, 50px)", letterSpacing: "-0.5px", color }}
              >
                {text}
              </motion.div>
            </div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.85 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.75, margin: 0, maxWidth: "380px" }}
        >
          Your batches, materials, and earnings — all in one place, updated in real time as your work moves through the workshop.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0, ease: EASE }}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <motion.button
            onClick={onExploreBatches}
            whileHover={{ boxShadow: "0px 16px 48px rgba(110,15,45,0.55)" }}
            style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "13px 26px", borderRadius: 16, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.warmCream, boxShadow: "0 8px 32px rgba(110,15,45,0.40)" }}
          >
            View My Batches
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={12} color={T.warmCream} />
            </div>
          </motion.button>
          <motion.button
            onClick={onGoToPayments}
            whileHover={{ backgroundColor: "rgba(245,232,208,0.16)" }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 16, cursor: "pointer", backgroundColor: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: "rgba(245,232,208,0.92)" }}
          >
            My Payments
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
