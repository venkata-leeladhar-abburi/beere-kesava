import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

import { F, T } from "../../theme";
import { VendorPayment } from "../../types";
import type { PurchaseOrder } from "@/features/purchasing";
import { Button, CurrencyInput, Field, IconButton, Input } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DatePicker, formatDate } from "../../../../shared/ui/date";
import { vendorBillsApi } from "../../../../shared/api/vendor-bills";
import { toPaise, fromPaise } from "@/lib/gst";
import { useReceiptUpload } from "@/shared/hooks/useReceiptUpload";
import { resolveAssetUrl } from "@/shared/api/uploads";

const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp: { col: "#B85C38", bg: "rgba(184,92,56,0.12)" },
  Resham: { col: "#4A7059", bg: "rgba(74,112,89,0.12)" },
  Jari: { col: "#C19A5B", bg: "rgba(193,154,91,0.15)" },
};

// ── Add / Edit Vendor Invoice Modal ────────────────────────────────────────────
// A PO gets at most one bill through this modal: raises a real VendorBill
// (POST /vendor-bills) the first time, then edits that same bill (PATCH
// /vendor-bills/:id) on every subsequent open — never a second bill for the
// same PO. A bill is required before any payment can be recorded against it,
// since VendorPayment always links to a billId.
//
// Per-material amounts are sent to the backend too (PurchaseOrderItem.invoicedAmount,
// via VendorBill's materialAmounts) so PO-tracking screens can show a real per-material
// invoiced figure. They also sum into the Total Invoice Amount field, which stays a real
// editable input the admin can override by typing into it directly (the sum stops
// overwriting it once they do) — VendorBill.amount is the single source of truth for
// what's actually owed and isn't required to equal the material sum.
export function AddVendorInvoiceModal({ vp, matchedPO, onClose, onSaved }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onClose: () => void; onSaved?: () => void }) {
  const isEdit = !!vp.billId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload: uploadInvoiceFile, uploading: uploadingInvoice, error: invoiceUploadError } = useReceiptUpload();
  const [file, setFile] = useState<File | null>(null);
  const [invoiceFileUrl, setInvoiceFileUrl] = useState(vp.invoiceFileUrl ?? "");
  const [invoiceFileName, setInvoiceFileName] = useState(vp.invoiceFileName ?? "");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [amount, setAmount] = useState(vp.invoiceAmt > 0 ? String(vp.invoiceAmt) : "");
  const [totalOverridden, setTotalOverridden] = useState(vp.invoiceAmt > 0);
  const [materialAmounts, setMaterialAmounts] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    matchedPO?.materials.forEach((m, mi) => {
      if (m.invoiceAmount) init[mi] = String(m.invoiceAmount);
    });
    return init;
  });
  const [date, setDate] = useState(vp.dueDate || new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materialsSum = fromPaise(Object.values(materialAmounts).reduce((sumPaise, v) => sumPaise + (toPaise(Number(v)) || 0), 0));

  const setMaterialAmount = (index: number, value: string) => {
    const next = { ...materialAmounts, [index]: value };
    setMaterialAmounts(next);
    if (!totalOverridden) {
      const sumPaise = Object.values(next).reduce((s, v) => s + (toPaise(Number(v)) || 0), 0);
      const sum = fromPaise(sumPaise);
      setAmount(sum > 0 ? String(sum) : "");
    }
  };

  const handleInvoiceFile = (picked: File | null) => {
    if (!picked) return;
    setFile(picked);
    setInvoiceFileName(picked.name);
    void uploadInvoiceFile(picked).then((url) => {
      if (url) setInvoiceFileUrl(url);
    });
  };

  const numericAmount = amount === "" || isNaN(Number(amount)) ? NaN : fromPaise(toPaise(Number(amount)));
  const canSave = !!vp.vendorId && numericAmount > 0 && !uploadingInvoice;

  const handleSave = async () => {
    if (!vp.vendorId || !(numericAmount > 0)) return;
    setSaving(true);
    setError(null);
    try {
      const materialAmountsPayload = matchedPO
        ? matchedPO.materials
            .map((m, mi) => ({ itemId: m.id, amount: fromPaise(toPaise(Number(materialAmounts[mi] || 0))) }))
            .filter((m): m is { itemId: string; amount: number } => !!m.itemId && m.amount > 0)
        : undefined;

      if (isEdit && vp.billId) {
        await vendorBillsApi.update(vp.billId, {
          amount: numericAmount,
          dueDate: date || undefined,
          description: invoiceNo.trim() || undefined,
          invoiceFileUrl: invoiceFileUrl || undefined,
          invoiceFileName: invoiceFileName || undefined,
          materialAmounts: materialAmountsPayload?.length ? materialAmountsPayload : undefined,
        });
        toast.success(`Invoice updated for ${vp.vendor}`);
      } else {
        await vendorBillsApi.create({
          vendorId: vp.vendorId,
          poId: vp.id,
          amount: numericAmount,
          dueDate: date || undefined,
          description: invoiceNo.trim() || undefined,
          invoiceFileUrl: invoiceFileUrl || undefined,
          invoiceFileName: invoiceFileName || undefined,
          materialAmounts: materialAmountsPayload?.length ? materialAmountsPayload : undefined,
        });
        toast.success(`Invoice ${invoiceNo || vp.poNumber} added for ${vp.vendor}`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xs">
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <Dialog.Title asChild>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>{isEdit ? "Edit Invoice" : "Add Invoice"} — {vp.vendor}</div>
          </Dialog.Title>
          <Dialog.Description className="sr-only">{isEdit ? "Edit vendor invoice" : "Add a new vendor invoice"} for {vp.vendor}</Dialog.Description>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm"
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
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
                {uploadingInvoice ? "Uploading…" : file ? file.name : invoiceFileName || "Click to upload invoice"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>PDF, JPG, PNG up to 10MB</div>
              <Input type="file" ref={fileInputRef} containerClassName="hidden" accept=".pdf,image/*" onChange={e => handleInvoiceFile(e.target.files?.[0] ?? null)} />
            </div>
            {invoiceUploadError && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#C0392B", marginTop: 6 }}>{invoiceUploadError}</div>
            )}
            {!uploadingInvoice && invoiceFileUrl && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <a href={resolveAssetUrl(invoiceFileUrl) ?? undefined} target="_blank" rel="noreferrer"
                  style={{ fontFamily: F.ui, fontSize: 12, color: T.green, textDecoration: "underline" }}>
                  View uploaded file
                </a>
                <button type="button" onClick={() => { setFile(null); setInvoiceFileUrl(""); setInvoiceFileName(""); }}
                  style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: "none", border: "none", cursor: "pointer" }}>
                  Remove
                </button>
              </div>
            )}
          </div>
          <Field label="Vendor Invoice Number" id="vendor-invoice-number">
            <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-4821" />
          </Field>

          {matchedPO && matchedPO.materials.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "1px" }}>
                Amount by Material
              </div>
              {matchedPO.materials.map((m, mi) => {
                const mt = MAT_TAG[m.materialType] || MAT_TAG.Warp;
                return (
                  <div key={`${m.materialType}-${m.unit}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase" as const, color: mt.col, background: mt.bg, borderRadius: 6, padding: "3px 8px", minWidth: 58, textAlign: "center" as const, flexShrink: 0 }}>
                      {m.materialType}
                    </span>
                    <span style={{ fontSize: 11, color: T.taupe, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {m.quantity} {m.unit}
                    </span>
                    <CurrencyInput
                      value={materialAmounts[mi] ? Number(materialAmounts[mi]) : ""}
                      onValueChange={v => setMaterialAmount(mi, v === "" ? "" : String(v))}
                      // eslint-disable-next-line no-restricted-syntax -- input placeholder text, not a rendered money value
                      placeholder="₹0"
                      size="sm"
                      className="w-[120px] flex-shrink-0"
                    />
                  </div>
                );
              })}
              {materialsSum > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textAlign: "right" as const, paddingTop: 4, borderTop: `1px dashed ${T.borderDef}` }}>
                  Sum of materials: <strong style={{ color: T.luxuryBrown }}>₹{materialsSum.toLocaleString("en-IN")}</strong>
                </div>
              )}
            </div>
          )}

          {/* eslint-disable-next-line no-restricted-syntax -- form field label text, not a money value display */}
          <Field label="Total Invoice Amount (₹)" required id="invoice-amount">
            <CurrencyInput
              value={amount === "" ? "" : Number(amount)}
              onValueChange={v => { setTotalOverridden(true); setAmount(v === "" ? "" : String(v)); }}
            />
          </Field>
          {matchedPO && matchedPO.materials.length > 0 && totalOverridden && materialsSum > 0 && Math.abs(materialsSum - numericAmount) > 0.01 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018" }}>
              Total differs from the sum of materials (₹{materialsSum.toLocaleString("en-IN")}) — that's fine, this field is yours to set.
            </div>
          )}
          <Field label="Due Date" id="invoice-date">
            <DatePicker value={date ? new Date(date) : null} onChange={d => setDate(d ? formatDate(d, "iso") : "")} />
          </Field>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", fontFamily: F.ui, fontSize: 13, color: "#C0392B", fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <Button variant="secondary" onClick={onClose} className="rounded-[9px]">Cancel</Button>
          <Button variant="primary" onClick={() => void handleSave()} disabled={!canSave || saving} loading={saving} className="rounded-[9px] bg-[#6E0F2D]">
            {isEdit ? "Save Changes" : "Add Invoice"}
          </Button>
        </div>
    </Modal>
  );
}
