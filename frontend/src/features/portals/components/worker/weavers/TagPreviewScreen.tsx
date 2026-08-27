import React from "react";
import { Printer } from "lucide-react";
import { C, F } from "../tokens";
import { PageHeader } from "./shared";
import { Button, Input } from "../../../../../shared/ui/primitives";

// ─── Tag Preview — shared by the outsourced-weaver and own-factory receive
// flows, so a print fix or layout tweak only has to happen in one place.
interface TagPreviewScreenProps {
  sareeIds: string[];
  entityLabel: string;   // "Weaver" or "Loom"
  entityValue: string;   // weaver name, or "Loom-001 · Operator Name"
  onBack: () => void;
  onPrint: () => void;
}

export function TagPreviewScreen({ sareeIds, entityLabel, entityValue, onBack, onPrint }: TagPreviewScreenProps) {
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <>
      <PageHeader title="Tag Preview" onBack={onBack} />
      <div style={{ paddingBottom: 28 }}>
        {sareeIds.map(id => (
          <div key={id} style={{ margin: "14px 16px", border: `1px solid rgba(110,15,45,0.20)`, borderRadius: 12, padding: 16, background: "#FFF" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 8 }}>Beere Kesava &amp; Brothers Silks · Est. 1999</div>
            <div style={{ background: "#000", height: 36, borderRadius: 4, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: F.m, fontSize: 7, color: "#FFF", letterSpacing: 3 }}>||| | || ||| || |</span>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, textAlign: "center", color: C.text, marginBottom: 10 }}>{id}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><span style={{ fontFamily: F.u, fontSize: 12, color: C.gold }}>{entityLabel}: </span><span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{entityValue}</span></div>
              <div><span style={{ fontFamily: F.u, fontSize: 12, color: C.gold }}>Date: </span><span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{dateStr}</span></div>
            </div>
          </div>
        ))}
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 8 }}>Printer: TSC TE244 &nbsp;🔒</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>Copies:</span>
            <Input type="number" defaultValue={1} className="w-[65px] h-[38px] text-center font-mono" />
          </div>
          <Button variant="primary" fullWidth iconLeft={Printer} onClick={onPrint} className="h-12 rounded-[14px] bg-[#6E0F2D] hover:bg-[#4A061B] mb-3 text-[14px]">Print Now</Button>
          <Button variant="link" fullWidth onClick={onBack} className="text-[13px] text-[#69635E] p-2.5">Skip Printing</Button>
        </div>
      </div>
    </>
  );
}
