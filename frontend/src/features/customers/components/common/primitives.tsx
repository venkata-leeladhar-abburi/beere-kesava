import React from "react";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useDownloadsAllowed } from "../../../../shared/ui/DownloadAccess";
import { T, F, EASE } from "../theme";
import { Button } from "../../../../shared/ui/primitives";

// ── Animation Components ───────────────────────────────────────────────────────
export function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function Pill({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick?: () => void }) {
  return (
    <div
      onClick={onClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (onClick)?.(); } }}
      style={{
        padding: "6px 16px", borderRadius: 20, cursor: "pointer",
        background: active ? T.royalBurgundy : "transparent",
        border: `1px solid ${active ? T.royalBurgundy : T.borderDef}`,
        color: active ? "#FFF" : T.taupe,
        fontFamily: F.ui, fontSize: 13, fontWeight: 500,
        transition: "all 0.2s ease"
      }}>
      {children}
    </div>
  );
}

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, Payments, and Weavers pages.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
  );
}

// Download-gated text-link action button, matching the old `SectionTitle`'s
// action slot — section actions on this page are all downloads/exports, so
// they follow the portal's download permission.
export function SectionDownloadAction({ label, onClick }: { label: string; onClick?: () => void }) {
  const dlAllowed = useDownloadsAllowed();
  if (!dlAllowed) return null;
  return (
    <Button variant="secondary" size="md" onClick={onClick} className="bg-white/10 text-[#FFFDF9] border-white/20">
      {label}
    </Button>
  );
}

export function CardStat({ label, value, valueColor = T.luxuryBrown, isMono = false, isSmall = false }: { label: string, value: React.ReactNode, valueColor?: string, isMono?: boolean, isSmall?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>{label}</div>
      <div style={{
        fontFamily: isMono ? F.mono : F.display,
        fontSize: isSmall ? 16 : 18,
        fontWeight: 600,
        color: valueColor,
        marginTop: isMono ? 4 : 0
      }}>{value}</div>
    </div>
  );
}

export function CardActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <Button variant="tertiary" size="sm" onClick={onClick} className="h-auto p-0 gap-1">
      <Icon size={14} color={color} /> <span style={{ color }}>{label}</span>
    </Button>
  );
}
