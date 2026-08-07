import React from "react";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
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

export function SectionTitle({ title, sub, action, onAction }: { title: string, sub: string, action?: string, onAction?: () => void }) {
  // Section actions on this page are all downloads/exports, so they follow the
  // portal's download permission.
  const dlAllowed = useDownloadsAllowed();
  const isDownloadAction = /download|export/i.test(action);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 3, background: T.antiqueGold, borderRadius: 2 }} />
        <div>
          <h2 style={{ fontFamily: F.display, fontSize: 30, color: T.luxuryBrown, margin: "0 0 6px 0", fontWeight: 600 }}>{title}</h2>
          <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0, maxWidth: 600, lineHeight: 1.5 }}>{sub}</p>
        </div>
      </div>
      {(!isDownloadAction || dlAllowed) && (
        <Button
          variant="link"
          onClick={onAction}
          className="text-[color:var(--bk-gold-500)]"
        >
          {action}
        </Button>
      )}
    </div>
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
