import React, { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { EASE, F, T } from "../../theme";
import { Invoice, VendorPayment } from "../../types";
import { Button, Field, IconButton, Input } from "../../../../shared/ui/primitives";

// ── Vendor Pay Now Modal ──────────────────────────────────────────────────────
export function AddVendorInvoiceModal({ vp, onClose }: { vp: VendorPayment; onClose: () => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

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
          <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose}
            className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
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
          <Field label="Vendor Invoice Number" id="vendor-invoice-number">
            <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-4821" />
          </Field>
          <Field label="Invoice Date" id="invoice-date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
        </div>

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="secondary" onClick={onClose} className="rounded-[9px]">Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!file || saving} loading={saving} className="rounded-[9px] bg-[#6E0F2D]">
            Add Invoice
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
