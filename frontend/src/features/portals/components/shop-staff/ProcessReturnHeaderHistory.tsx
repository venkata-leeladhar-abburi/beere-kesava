import React from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { C, F } from "./theme";

export interface ReturnRecord {
  id: string;
  type: "retail" | "wholesale";
  date: string;
  customer?: string;
  vendor?: string;
  originalSaleId?: string;
  reason?: string;
  amount?: string;
  design?: string;
  color?: string;
  weight?: string;
  wsReason?: string;
}

interface ProcessReturnHeaderProps {
  step: "type" | 1 | 2 | 3 | "success";
  onBack: () => void;
  setStep: (s: "type" | 1 | 2 | 3 | "success") => void;
  setReturnType: (t: "retail" | "wholesale" | null) => void;
}

export function ProcessReturnHeader({ step, onBack, setStep, setReturnType }: ProcessReturnHeaderProps) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
      display: "flex", alignItems: "center", padding: "14px 16px", gap: 12,
    }}>
      <button
        onClick={step === "type" ? onBack : () => {
          if (step === 1) { setStep("type"); setReturnType(null); }
          else if (step === 2) setStep(1);
          else if (step === 3) setStep(2);
        }}
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <ChevronLeft size={20} color="#FFF" />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.50)", textTransform: "uppercase" as const, marginBottom: 2 }}>Since 1999</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Process Return</div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RotateCcw size={18} color="rgba(255,255,255,0.70)" />
      </div>
    </div>
  );
}

interface ReturnHistorySectionProps {
  returnLog: ReturnRecord[];
  canSeePrices: boolean;
}

export function ReturnHistorySection({ returnLog, canSeePrices }: ReturnHistorySectionProps) {
  return (
    <div style={{ margin: "20px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 4, height: 20, background: C.crim, borderRadius: 2 }} />
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Return History</span>
      </div>
      {returnLog.map((r, i) => (
        <div key={i} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${r.type === "retail" ? C.crim : C.gold}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ background: r.type === "retail" ? "rgba(192,57,43,0.10)" : "rgba(196,146,58,0.15)", color: r.type === "retail" ? C.crim : "#8B6520", borderRadius: 999, padding: "2px 8px", fontFamily: F.m, fontSize: 10, fontWeight: 600 }}>{r.id}</span>
            <span style={{ background: r.type === "retail" ? "rgba(192,57,43,0.07)" : "rgba(196,146,58,0.10)", color: r.type === "retail" ? C.crim : C.gold, borderRadius: 999, padding: "2px 8px", fontFamily: F.u, fontSize: 10, fontWeight: 600 }}>{r.type === "retail" ? "Retail" : "Wholesale"}</span>
            <span style={{ marginLeft: "auto", fontFamily: F.m, fontSize: 10, color: C.muted }}>{r.date}</span>
          </div>
          {r.type === "retail" ? (
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.customer} · {r.originalSaleId} · {r.reason}{canSeePrices && <> · <span style={{ color: C.gold, fontWeight: 600 }}>{r.amount}</span></>}</div>
          ) : (
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor} · {r.design} · {r.color} · {r.weight} · {r.wsReason}</div>
          )}
        </div>
      ))}
    </div>
  );
}
