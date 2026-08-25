import React from "react";
import { Check, type LucideIcon } from "lucide-react";
import { T, F } from "./tokens";
import { Button } from "../../../../shared/ui/primitives";

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// rest of the app.
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
      <div className="p-4 sm:p-6 md:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-3.5 sm:p-5 md:p-6">
        {children}
      </div>
    </div>
  );
}

export function GreenBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Button onClick={onClick} variant="primary" size="sm" className={"rounded-[10px] justify-center " + (className ?? "")}>
      {children}
    </Button>
  );
}

export function CrimsonBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Button onClick={onClick} variant="danger-subtle" size="sm" className={"rounded-[10px] justify-center " + (className ?? "")}>
      {children}
    </Button>
  );
}

export function InfoStrip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.cream, borderRadius: 8, padding: "8px 12px",
      fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, ...style,
    }}>
      {children}
    </div>
  );
}

export function BulkActionStrip({ count, noun, onApproveAll }: { count: number; noun: string; onApproveAll: () => void }) {
  return (
    <div style={{
      background: T.cream, borderRadius: 12, padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 20,
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
        {count} {noun} {count === 1 ? "is" : "are"} waiting for your approval.
      </span>
      <GreenBtn onClick={onApproveAll}>
        <Check size={14} />
        Approve All {count} {noun}
      </GreenBtn>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      background: "#FFF", borderRadius: 16, border: "1px solid " + T.borderDef,
      boxShadow: "0 2px 12px rgba(44,24,16,0.07)", padding: "48px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      <Check size={48} color={T.green} strokeWidth={1.5} />
      <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
        {message}
      </span>
      <span className="max-w-[340px]" style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>
        All items in this category have been reviewed and actioned.
      </span>
    </div>
  );
}

// ─── History type pill ────────────────────────────────────────────────────────
export function TypePill({ type, typeColor }: { type: string; typeColor: string }) {
  const isPO = type === "Purchase Order";
  const isWarp = type === "Warp Request";
  const bg = isPO ? typeColor : isWarp ? "rgba(200,155,71,0.15)" : T.luxuryBrown;
  const color = isPO ? "#FFF" : isWarp ? T.luxuryBrown : "#FFF";
  return (
    <span style={{
      background: bg, color, borderRadius: 6,
      padding: "3px 8px", fontFamily: F.ui, fontSize: 12, fontWeight: 500,
      whiteSpace: "nowrap",
    }}>
      {type}
    </span>
  );
}
