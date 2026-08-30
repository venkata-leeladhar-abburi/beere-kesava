import React from "react";
import { Printer } from "lucide-react";
import { C, F } from "../tokens";
import { PageHeader } from "./shared";
import { Button, Input } from "../../../../../shared/ui/primitives";
import { useDocument } from "../../../../../shared/ui/document";
import { ScannableCode } from "../../../../../shared/ui/domain";
import { SareeTagSheet } from "./SareeTagSheet";

// ─── Tag Preview — shared by the outsourced-weaver and own-factory receive
// flows, so a print fix or layout tweak only has to happen in one place.
interface TagPreviewScreenProps {
  sareeIds: string[];
  entityLabel: string;   // "Weaver" or "Loom"
  entityValue: string;   // weaver name, or "Loom-001 · Operator Name"
  onBack: () => void;
  /** Called once the tags have been sent to the printer — for the caller to
   *  close the preview and clear its selection, not to do the printing. */
  onPrint: () => void;
}

export function TagPreviewScreen({ sareeIds, entityLabel, entityValue, onBack, onPrint }: TagPreviewScreenProps) {
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const { print } = useDocument();
  const [copies, setCopies] = React.useState(1);

  const handlePrint = () => {
    const tags = Array.from({ length: Math.max(1, copies) }).flatMap(() =>
      sareeIds.map(sareeId => ({ sareeId, entityLabel, entityValue, date: dateStr })),
    );
    print(<SareeTagSheet tags={tags} />);
    onPrint();
  };
  return (
    <>
      <PageHeader title="Tag Preview" onBack={onBack} />
      <div style={{ paddingBottom: 28 }}>
        {sareeIds.map(id => (
          <div key={id} style={{ margin: "14px 16px", border: `1px solid rgba(110,15,45,0.20)`, borderRadius: 12, padding: 16, background: "#FFF" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 8 }}>Beere Kesava &amp; Brothers Silks · Est. 1999</div>
            {/* The same code that prints, so the preview matches the tag a
                scanner will actually read. */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <ScannableCode value={id} size={84} />
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
            <Input
              type="number"
              min={1}
              value={copies}
              onChange={e => setCopies(Math.max(1, Number(e.target.value) || 1))}
              className="w-[65px] h-[38px] text-center font-mono"
            />
          </div>
          <Button variant="primary" fullWidth iconLeft={Printer} onClick={handlePrint} className="h-12 rounded-[14px] bg-[#6E0F2D] hover:bg-[#4A061B] mb-3 text-[14px]">Print Now</Button>
          <Button variant="link" fullWidth onClick={onBack} className="text-[13px] text-[#69635E] p-2.5">Skip Printing</Button>
        </div>
      </div>
    </>
  );
}
