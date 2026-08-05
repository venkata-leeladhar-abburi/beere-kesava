import React, { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { C, F } from "../tokens";
import { Button, IconButton, Input } from "../../../../../shared/ui/primitives";

// ─── Manual Entry Modal ───────────────────────────────────────────────────────
export function ManualEntryModal({ onClose }: { onClose: () => void }) {
  const [weaver, setWeaver] = useState("");
  const [batch, setBatch] = useState("");
  const [sareeId, setSareeId] = useState("");
  const [weight, setWeight] = useState("");
  const [sareeType, setSareeType] = useState("");
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#FFF", borderRadius: 20, padding: 28, width: "min(94vw,380px)", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <CheckCircle2 size={28} color={C.green} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>Saree Recorded</div>
          <div style={{ fontFamily: F.m, fontSize: 14, color: C.burg, marginBottom: 4 }}>{sareeId || "AUTO-ID-001"}</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 20 }}>Entry saved to received history.</div>
          <Button variant="primary" onClick={onClose} className="w-auto rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A] px-8">Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", background: "#FFF", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: C.text }}>Add Manually</span>
          <IconButton icon={X} label="Close" variant="ghost" onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Weaver Name", val: weaver, set: setWeaver, placeholder: "e.g. Padma Veni" },
            { label: "Batch ID", val: batch, set: setBatch, placeholder: "e.g. BATCH-086" },
            { label: "Saree ID", val: sareeId, set: setSareeId, placeholder: "Auto-generate or enter manually" },
            { label: "Saree Type", val: sareeType, set: setSareeType, placeholder: "e.g. Self Brocade, Heavy Zari" },
            { label: "Weight (grams)", val: weight, set: setWeight, placeholder: "e.g. 850" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label}>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
              <Input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} size="lg" className="text-[13px]" />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="primary" fullWidth iconLeft={CheckCircle2} onClick={() => setSaved(true)} className="h-[50px] rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A]">
            Save Record
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose} className="h-11 rounded-full border-[rgba(139,26,46,0.30)] text-[#6B1A2A]">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
