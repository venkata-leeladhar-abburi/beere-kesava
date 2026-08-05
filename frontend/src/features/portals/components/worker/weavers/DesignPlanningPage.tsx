import React, { useState } from "react";
import {
  Camera, UploadCloud, CheckCircle2, Search,
} from "lucide-react";
import { C, F, card } from "../tokens";
import { SectionLabel, PageHeader } from "./shared";
import { Button, Input, Select, SelectItem } from "../../../../../shared/ui/primitives";

// ─── Design Planning Page ────────────────────────────────────────────────────
export function DesignPlanningPage({ onBack }: { onBack: () => void }) {
  const [designCode, setDesignCode] = useState("BKB-045");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <>
        <PageHeader title="Design Planning" onBack={onBack} />
        <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={30} color={C.green} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>Design Saved</div>
          <div style={{ fontFamily: F.m, fontSize: 14, color: C.burg }}>{designCode}</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" }}>Color slip has been linked to the design.</div>
          <Button variant="secondary" onClick={() => setSaved(false)} className="w-auto rounded-full px-7 border-[rgba(139,26,46,0.30)] text-[#6B1A2A]">Back to Design Planning</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Design Planning" onBack={onBack} />
      <div style={{ paddingBottom: 28 }}>
        {/* Context */}
        <div style={{ margin: "12px 16px 4px", background: "rgba(107,26,42,0.04)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.5, margin: 0 }}>
            Upload the color slip for a design. Link it to a batch so weavers can see it.
          </p>
        </div>

        {/* Step 1 — Design Code */}
        <SectionLabel step={1} title="Select or Create Design Code" />
        <div style={{ margin: "0 16px" }}>
          <div style={{ position: "relative" }}>
            <Input value={designCode} onChange={e => setDesignCode(e.target.value)} placeholder="Type design code..."
              iconLeft={Search} size="lg" />
          </div>
          {designCode && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "inline-flex", background: "rgba(196,146,58,0.12)", padding: "5px 10px", borderRadius: 7 }}>
                <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{designCode} · Cream Zari Border Saree</span>
              </div>
              <Button variant="link" className="p-0 text-xs text-[#C4923A]">+ New Code</Button>
            </div>
          )}
        </div>

        {/* Step 2 — Photo */}
        <SectionLabel step={2} title="Take Photo of Color Slip" />
        <div style={{ margin: "0 16px" }}>
          {!hasPhoto ? (
            <div style={{ background: "#FFF", border: "1px dashed rgba(139,26,46,0.25)", borderRadius: 12, padding: "20px 16px" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <Camera size={36} color={C.gold} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>Take a clear photo of the color slip paper</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Must show: border color, body design, pallu details</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" fullWidth iconLeft={Camera} onClick={() => setHasPhoto(true)} className="h-11 rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A]">
                  Camera
                </Button>
                <Button variant="secondary" fullWidth iconLeft={UploadCloud} onClick={() => setHasPhoto(true)} className="h-11 rounded-full border-[#6B1A2A] text-[#6B1A2A]">
                  Gallery
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #F0E8D0, #E8D5A0)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.bdr}`, flexShrink: 0 }}>
                <span style={{ fontSize: 30 }}>🎨</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <CheckCircle2 size={13} color={C.green} />
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.green, fontWeight: 500 }}>Photo looks good</span>
                </div>
                <Button variant="link" onClick={() => setHasPhoto(false)} className="p-0 text-xs text-[#6B1A2A] underline">Retake Photo</Button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3 — Link Batch */}
        <SectionLabel step={3} title="Link to Batch (Optional)" />
        <div style={{ margin: "0 16px" }}>
          <div style={{ position: "relative" }}>
            <Select size="lg" placeholder="Select batch to link...">
              <SelectItem value="BATCH-086">BATCH-086 · Padma Veni · Active</SelectItem>
              <SelectItem value="BATCH-089">BATCH-089 · Ravi Kumar · Active</SelectItem>
              <SelectItem value="BATCH-081">BATCH-081 · Suresh Murti · Active</SelectItem>
            </Select>
          </div>
        </div>

        <div style={{ padding: "18px 16px 0" }}>
          <Button variant="primary" fullWidth onClick={() => setSaved(true)} className="h-[50px] rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A]">
            💾 Save Design and Color Slip
          </Button>
        </div>
      </div>
    </>
  );
}
