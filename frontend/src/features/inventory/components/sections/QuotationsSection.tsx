import { useState, useMemo } from "react";
import { FileText, Truck } from "lucide-react";
import { Quotation } from "@/features/finishing";
import { T, F } from "../theme";
import { Button } from "../../../../shared/ui/primitives";
import { SectionCard } from "../common/primitives";
import { EntityCode } from "@/shared/ui/domain";

// ── Quotations section (raised from this page, dispatch once finishing is done) ─
function quotationStatusStyle(status: Quotation["status"]) {
  switch (status) {
    case "received":          return { bg: "rgba(30,102,64,0.10)",   color: T.green,       border: "rgba(30,102,64,0.22)"  };
    case "dispatched":        return { bg: "rgba(110,15,45,0.08)",   color: T.royalBurgundy, border: "rgba(110,15,45,0.18)" };
    case "partially-received": return { bg: "rgba(200,155,71,0.14)", color: "#8B6018",     border: "rgba(200,155,71,0.32)" };
    case "in-finishing":      return { bg: "rgba(200,155,71,0.10)",  color: "#8B6018",     border: "rgba(200,155,71,0.24)" };
    default:                  return { bg: "rgba(139,112,96,0.10)", color: T.taupe,       border: T.borderDef };
  }
}

export function QuotationsSection({ quotations, onDispatch }: { quotations: Quotation[]; onDispatch: (q: Quotation) => void }) {
  const [tab, setTab] = useState<"active" | "all">("active");
  const rows = useMemo(() =>
    [...quotations]
      .filter(q => tab === "all" || q.status !== "dispatched")
      .sort((a, b) => b.createdAt - a.createdAt),
  [quotations, tab]);

  if (quotations.length === 0) return null;

  return (
    <SectionCard
      icon={FileText}
      title="Quotations"
      subtitle="Quotations raised from this page — dispatch once finishing is done."
      actions={
        <div style={{ display: "flex", gap: 6 }}>
          {([["active", "Active"], ["all", "All"]] as const).map(([key, label]) => (
            <Button
              key={key}
              onClick={() => setTab(key)}
              variant={tab === key ? "secondary" : "tertiary"}
              size="sm"
              className={tab === key ? "rounded-full" : "rounded-full bg-white/10 text-[#FFFDF9] border-white/20"}
            >
              {label}
            </Button>
          ))}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe, background: "#FFF", borderRadius: 14, border: `1px solid rgba(110,15,45,0.18)` }}>No quotations raised yet.</div>
        ) : rows.map((q) => {
          const st = quotationStatusStyle(q.status);
          const receivedCount = q.sarees.filter(s => s.finishingStatus === "received").length;
          const canDispatch = q.status === "received" || q.status === "partially-received";
          return (
            <div
              key={q.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 22px",
                border: `1px solid rgba(110,15,45,0.18)`,
                borderRadius: 14,
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
                flexWrap: "wrap" as const,
                transition: "all 0.2s ease",
              }}
            >
              <div className="min-w-[140px]">
                <EntityCode type="quotation" value={q.quotationNumber} />
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{q.quotationDate}</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{q.customerName}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{q.customerCity || "—"}</div>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, minWidth: 80, fontVariantNumeric: "tabular-nums" }}>
                <strong>{receivedCount}/{q.sarees.length}</strong><span style={{ color: T.taupe, fontWeight: 400 }}> received</span>
              </div>
              <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, padding: "4px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: st.color, textTransform: "capitalize" as const, whiteSpace: "nowrap" as const }}>
                {q.status.replace("-", " ")}
              </div>
              <Button
                onClick={() => canDispatch && onDispatch(q)}
                disabled={!canDispatch}
                title={canDispatch ? "Dispatch the received sarees from this quotation" : "Waiting on finishing to complete"}
                variant="primary"
                size="sm"
                iconLeft={Truck}
                className={canDispatch ? "rounded-[10px] bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)] whitespace-nowrap" : "rounded-[10px] whitespace-nowrap"}
              >
                Dispatch
              </Button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
