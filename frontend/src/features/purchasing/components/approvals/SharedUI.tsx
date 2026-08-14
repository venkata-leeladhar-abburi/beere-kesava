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

export function GreenBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Button onClick={onClick} variant="primary" size="sm" className={"rounded-full justify-center " + (className ?? "")}>
      {children}
    </Button>
  );
}

export function CrimsonBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Button onClick={onClick} variant="danger-subtle" size="sm" className={"rounded-full justify-center " + (className ?? "")}>
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
