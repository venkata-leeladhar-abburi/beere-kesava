import React, { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { EASE, F, T } from "../../theme";
import { Invoice, VendorPayment } from "../../types";

// ── Vendor Pay Now Modal ──────────────────────────────────────────────────────
export function AddVendorInvoiceModal({ vp, onClose }: { vp: VendorPayment; onClose: () => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, marginBottom: 6, display: "block" };

  const handleSave = () => {
    if (!file) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`Invoice ${invoiceNo || file.name} added for ${vp.vendor}`);
      onClose();
    }, 500);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column" }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>Add Invoice — {vp.vendor}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div
              onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => fileInputRef.current?.click())?.(); } }}
              style={{
                background: "#FFFFFF", border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, padding: "20px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.02)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = T.borderDef; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <FileText size={20} color={T.royalBurgundy} />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>
                {file ? file.name : "Click to upload invoice"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>PDF, JPG, PNG up to 10MB</div>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div>
            <label style={labelStyle} htmlFor="vendor-invoice-number">Vendor Invoice Number</label>
            <input id="vendor-invoice-number" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-4821" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="invoice-date">Invoice Date</label>
            <input id="invoice-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "0 18px", height: 40, border: `1.5px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={!file || saving} style={{ padding: "0 18px", height: 40, border: "none", borderRadius: 9, background: T.royalBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: file ? "pointer" : "not-allowed", opacity: !file || saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Add Invoice"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
