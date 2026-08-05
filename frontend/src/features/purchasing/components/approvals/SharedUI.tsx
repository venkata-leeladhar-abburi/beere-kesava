import React from "react";
import { Check } from "lucide-react";
import { T, F } from "./tokens";
import { Button } from "../../../../shared/ui/primitives";

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
      fontFamily: F.mono, fontSize: 12, color: T.taupe, ...style,
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
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", maxWidth: 340 }}>
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
