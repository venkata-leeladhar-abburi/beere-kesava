import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { T, F, baseCard, SareeItem, variance, splitDesignField } from "./WorkerQCTypes";
import { useRatesPricing } from "../../../pricing/contexts/RatesContext";
import { Button } from "../../../../shared/ui/primitives";

interface WorkerQCSareeCardProps {
  saree: SareeItem;
  isDesktop?: boolean;
  onMarkPassed: (s: SareeItem) => void;
  onStartSemiApproved: (s: SareeItem) => void;
  onStartDefect: (s: SareeItem) => void;
  onOpenDesignCode: (code: string) => void;
  onOpenSareeTypeCode: (typeCode: string) => void;
}

export function WorkerQCSareeCard({
  saree: s,
  isDesktop,
  onMarkPassed,
  onStartSemiApproved,
  onStartDefect,
  onOpenDesignCode,
  onOpenSareeTypeCode,
}: WorkerQCSareeCardProps) {
  const { getSareeTypeByName } = useRatesPricing();
  const v = variance(s.weight, s.std);
  const btnH = 52;
  const idSize = isDesktop ? 13 : 11;
  const labelSize = isDesktop ? 13 : 11;
  const metaSize = isDesktop ? 12 : 10;

  return (
    <div key={s.id} style={{ ...baseCard, borderTop: `3px solid ${T.gold}`, overflow: "hidden" }}>
      <div style={{ padding: isDesktop ? "14px 16px 10px" : "10px 12px 8px" }}>
        <div style={{ fontFamily: F.m, fontSize: idSize, fontWeight: 700, color: T.burg, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.id}</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.m, fontSize: metaSize - 1, color: T.goldL, background: "rgba(200,155,71,0.15)", padding: "2px 7px", borderRadius: 999 }}>{s.batch}</span>
          <span style={{ fontFamily: F.u, fontSize: metaSize - 1, color: "#FFF", background: s.source === "outsourced" ? T.green : T.brown, padding: "2px 7px", borderRadius: 999 }}>
            {s.source === "outsourced" ? "Out" : "Own"}
          </span>
          {s.bulkOrderLabel
            ? <span style={{ fontFamily: F.u, fontSize: metaSize - 1, color: T.green, background: T.bgGreen, padding: "2px 7px", borderRadius: 999, border: "1px solid rgba(30,102,64,0.18)" }}>{s.bulkOrderLabel}</span>
            : <span style={{ fontFamily: F.u, fontSize: metaSize - 1, color: T.muted, background: "rgba(139,112,96,0.10)", padding: "2px 7px", borderRadius: 999 }}>General Stock</span>
          }
        </div>
        <div style={{ fontFamily: F.u, fontSize: labelSize, fontWeight: 600, color: T.brown, marginBottom: 2 }}>{s.weaver}</div>
        {s.wcode && <div style={{ fontFamily: F.m, fontSize: metaSize - 1, color: T.muted, marginBottom: 3 }}>{s.wcode}</div>}
        <div style={{ fontFamily: F.u, fontSize: metaSize, color: T.muted, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {(() => {
            const { code, typeName } = splitDesignField(s.design);
            const typeRec = typeName ? getSareeTypeByName(typeName) : undefined;
            return (
              <>
                <span onClick={e => { e.stopPropagation(); onOpenDesignCode(code); }}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                  onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                >{code}</span>
                {typeName && <> · <span onClick={e => { e.stopPropagation(); if (typeRec) onOpenSareeTypeCode(typeRec.code); }}
                  style={{ cursor: typeRec ? "pointer" : "default" }}
                  onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                  onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                >{typeName}</span></>}
              </>
            );
          })()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <span style={{ fontFamily: F.m, fontSize: labelSize, fontWeight: 600, color: T.brown }}>{s.weight}g</span>
          <span style={{ fontFamily: F.u, fontSize: metaSize, color: T.muted }}>/ {s.std}g</span>
          {v.ok ? <CheckCircle2 size={11} color={T.green} /> : <AlertTriangle size={11} color={T.crim} />}
        </div>
        <div style={{ fontFamily: F.m, fontSize: metaSize, color: T.muted }}>{s.submitted}</div>
      </div>
      {/* Passed / Semi / Defective buttons */}
      <div style={{ display: "flex", borderTop: `1px solid ${T.bdr}` }}>
        <Button variant="primary" fullWidth iconLeft={CheckCircle2} onClick={() => onMarkPassed(s)}
          className="h-[52px] rounded-none bg-[#1E6640] hover:bg-[#1E6640] text-[11px]">
          Passed
        </Button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
        <Button variant="primary" fullWidth iconLeft={AlertTriangle} onClick={() => onStartSemiApproved(s)}
          className="h-[52px] rounded-none bg-[#C89B47] hover:bg-[#C89B47] text-[11px]">
          Semi
        </Button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
        <Button variant="primary" fullWidth iconLeft={XCircle} onClick={() => onStartDefect(s)}
          className="h-[52px] rounded-none bg-[#C0392B] hover:bg-[#C0392B] text-[11px]">
          Defective
        </Button>
      </div>
    </div>
  );
}
