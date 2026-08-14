import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, User, HardHat, Frame, ShoppingBag } from "lucide-react";
import { imgSareeFooter } from "../../../shared/constants/weaverImages";
import crest from "../../../assets/bk-crest.png";
import ribbon from "../../../assets/saree-ribbon.webp";

const C = {
  darkBg:     "#36030B",
  darkBgSoft: "#4A0A16",
  gold:       "#C4923A",
  goldBright: "#E3B85C",
  cream:      "#F5EDD0",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const PORTALS = [
  { label: "Superadmin",   Icon: ShieldCheck },
  { label: "Admin",        Icon: User },
  { label: "Worker Staff", Icon: HardHat },
  { label: "Weaver",       Icon: Frame },
  { label: "Shop Staff",   Icon: ShoppingBag },
];

/** Gold flourish rule — the ornamental divider that separates the lockup lines. */
export function Flourish({ width = 132 }: { width?: number }) {
  return (
    <svg width={width} height="10" viewBox="0 0 132 10" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path d="M2 5h44M86 5h44" stroke={C.gold} strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
      <path d="M66 1.2l3.4 3.8-3.4 3.8-3.4-3.8z" fill={C.goldBright} fillOpacity="0.9" />
      <path d="M54 5l4-2.4v4.8zM78 5l-4-2.4v4.8z" fill={C.gold} fillOpacity="0.7" />
    </svg>
  );
}

/**
 * Short viewports cannot fit the lockup, a full-height ribbon band and the roster
 * at once. Tall screens get the ribbon as its own band above the roster (the
 * reference composition); short ones tuck it behind the roster instead.
 */
function useIsShort() {
  const [short, setShort] = React.useState(
    () => typeof window !== "undefined" && window.innerHeight < 860
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(max-height: 859px)");
    const onChange = (e: MediaQueryListEvent) => setShort(e.matches);
    setShort(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return short;
}

export function LoginBrandPanel() {
  const isShort = useIsShort();

  return (
    <div
      style={{
        width: "50%",
        minHeight: "100dvh",
        background: `radial-gradient(120% 90% at 50% 18%, ${C.darkBgSoft} 0%, ${C.darkBg} 62%, #2A0208 100%)`,
        position: "relative" as const,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column" as const,
      }}
    >
      {/* Woven damask wash — real silk texture, dialled far back so type stays legible */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <img
          src={imgSareeFooter}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.1, mixBlendMode: "soft-light" as const }}
        />
      </div>

      {/* Warm halo behind the crest */}
      <div
        className="w-[520px] h-[520px]"
        style={{
          position: "absolute", top: "6%", left: "50%", transform: "translateX(-50%)",
          borderRadius: "50%", zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(circle, rgba(196,146,58,0.14) 0%, rgba(196,146,58,0) 68%)",
        }}
      />

      {/* Brand lockup */}
      <div
        style={{
          position: "relative", zIndex: 2, flex: 1,
          display: "flex", flexDirection: "column" as const,
          alignItems: "center", justifyContent: "center",
          textAlign: "center" as const,
          padding: isShort
            ? "clamp(18px, 3vh, 56px) 48px clamp(126px, 21vh, 200px)"
            : "clamp(18px, 3vh, 56px) 48px clamp(200px, 36vh, 380px)",
        }}
      >
        <motion.img
          src={crest}
          alt="Sree Beere Kesava & Brothers Silks"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ width: "clamp(118px, 16vh, 218px)", height: "auto", marginBottom: "clamp(8px, 1.8vh, 22px)", filter: "drop-shadow(0 6px 24px rgba(0,0,0,0.45))" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <Flourish width={54} />
            <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, letterSpacing: "9px", color: C.goldBright, paddingLeft: 9 }}>
              SREE
            </span>
            <Flourish width={54} />
          </div>

          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(24px, 3.6vh, 38px)", letterSpacing: "2.5px", color: C.goldBright, lineHeight: 1.15 }}>
            BEERE KESAVA
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: "clamp(15px, 2.3vh, 21px)", letterSpacing: "3px", color: C.gold, marginTop: 4 }}>
            &amp; BROTHERS SILKS
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "clamp(8px,1.6vh,14px) 0 clamp(14px,2.9vh,26px)" }}>
            <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold})`, opacity: 0.6 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13, letterSpacing: "4px", color: C.gold, paddingLeft: 4 }}>
              SINCE 1999
            </span>
            <span style={{ width: 40, height: 1, background: `linear-gradient(270deg, transparent, ${C.gold})`, opacity: 0.6 }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(25px, 3.9vh, 42px)", color: "#FFFDF9", lineHeight: 1.26, letterSpacing: "-0.3px" }}>
            Weaving <span style={{ fontStyle: "italic", color: C.goldBright }}>Heritage</span>
            <br />
            Into Every Thread
          </div>
        </motion.div>

        <div style={{ margin: "clamp(12px,2.2vh,20px) 0 clamp(10px,1.8vh,16px)" }}>
          <Flourish />
        </div>

        <motion.p
          className="max-w-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: "rgba(227,184,92,0.78)", lineHeight: 1.75, margin: 0 }}
        >
          Four generations of passion, precision, and pure silk craftsmanship. Welcome back.
        </motion.p>
      </div>

      {/* Saree ribbon — the signature element, anchored across the foot of the panel */}
      <motion.img
        src={ribbon}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
        style={{
          position: "absolute" as const,
          left: "-6%", right: "-6%",
          bottom: isShort ? "clamp(14px, 3vh, 60px)" : "clamp(140px, 16vh, 190px)",
          width: "112%", height: isShort ? "clamp(110px, 18vh, 150px)" : "clamp(150px, 20vh, 230px)",
          objectFit: "cover" as const, objectPosition: "center",
          zIndex: 1, pointerEvents: "none",
          filter: "drop-shadow(0 -8px 40px rgba(0,0,0,0.5))",
          // Dissolve both ends into the panel so the artwork never shows a cut edge
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 10%, #000 86%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0%, #000 10%, #000 86%, transparent 100%)",
        }}
      />

      {/* Portal roster */}
      <div
        style={{
          position: "absolute" as const, zIndex: 3,
          left: 48, right: 48, bottom: "clamp(18px, 3.4vh, 34px)", borderRadius: 16,
          background: "rgba(28,2,7,0.62)",
          border: "1px solid rgba(196,146,58,0.26)",
          backdropFilter: "blur(10px)",
          padding: "clamp(11px,1.9vh,16px) 12px clamp(12px,2.2vh,18px)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "2.5px",
            textTransform: "uppercase" as const, color: "rgba(245,237,208,0.55)",
            textAlign: "center" as const, marginBottom: 14, paddingLeft: 2.5,
          }}
        >
          This system is used by:
        </div>
        <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center" }}>
          {PORTALS.map(({ label, Icon }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span style={{ width: 1, background: "rgba(196,146,58,0.18)", margin: "2px 0" }} />}
              <div
                style={{
                  flex: 1, display: "flex", flexDirection: "column" as const,
                  alignItems: "center", gap: 8, padding: "0 6px",
                }}
              >
                <Icon size={20} color={C.gold} strokeWidth={1.6} />
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: "rgba(245,237,208,0.82)", textAlign: "center" as const }}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
