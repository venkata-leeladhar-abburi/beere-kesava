import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, Download, FileText, UploadCloud, X } from "lucide-react";
import { motion } from "motion/react";

import { useAuth } from "../../../../contexts/AuthContext";
import { ApiError } from "../../../../shared/api/client";
import { ImportResult, vendorPaymentsApi } from "../../../../shared/api/payments";
import { IMPORT_FILE_ACCEPT, validateImportFile } from "../../utils/importFile";
import { EASE, F, T } from "../../theme";
import { Button, Input } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

// Header row, in the exact order the backend import expects (see the panel's
// own copy below). poNumber/amountPaid/utrNumber/firmId/paymentDate are read
// by the backend import (see PaymentsService.importVendorPaymentsFromExcel);
// vendorId/vendorName/totalAmount/remainingAmount are reference-only — kept
// for readability, ignored on import — same split as the weaver ledger export
// (WeaverMakingChargesSection.handleExportLedger). The sheet's own "amountPaid"
// header stays the backend's required column name, but is labelled "Amount
// Paying" in the UI below — it's what the admin/accountant is paying THIS
// time, distinct from "remainingAmount" (what's still owed before this payment).
const TEMPLATE_HEADERS = ["poNumber", "vendorId", "vendorName", "totalAmount", "remainingAmount", "amountPaid", "utrNumber", "firmId", "paymentDate"];

export interface VendorTemplateRow {
  poNumber: string;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  /** invoiceAmt - paidSoFar as of this download — still owed, reference only. */
  remaining: number;
}

// Real, live-data template — replaces the old static example-row download.
// Only rows the accountant can actually act on: a PO with a real invoice (a
// bill with money on it) raised against it. `remainingAmount` is a read-only
// reference column (what's still owed); the `amountPaid` column — the one
// the backend import actually reads — is left blank for the admin/accountant
// to type in how much they're actually paying THIS time (which may be less
// than the remaining balance for a partial payment).
async function downloadVendorPaymentTemplate(rows: VendorTemplateRow[]) {
  const XLSX = await import("xlsx");
  const dataRows = rows.map(r => [r.poNumber, r.vendorId, r.vendorName, r.totalAmount, r.remaining, "", "", "", ""]);
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...dataRows]);
  ws["!cols"] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(h.length, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendor Payments");
  XLSX.writeFile(wb, "vendor-payment-template.xlsx");
}

// ── Vendor Payment Excel Upload Panel ─────────────────────────────────────────
// Uploads straight to the real backend import endpoint (POST /payments/vendors/import),
// processed synchronously against real PO/vendor-bill records — same pattern as
// BankUploadPanel.tsx (weaver payments) — instead of parsing the file client-side
// and posting one row at a time.
export function VendorUploadPanel({ rows, onUploaded }: { rows: VendorTemplateRow[]; onUploaded?: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const rejection = validateImportFile(file);
    if (rejection) {
      setResult(null);
      setFileName(null);
      setError(rejection);
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const finalResult = await vendorPaymentsApi.importExcel(file);
      setResult(finalResult);
      if (finalResult.created > 0) {
        onUploaded?.();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to import this file.");
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setFileName(null);
  };

  const totalRows = result ? result.created + result.failed : 0;

  return (
    <div style={{ marginBottom: 22 }}>
      {/* ── Upload trigger panel ── */}
      <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "20px 22px", boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <UploadCloud size={20} color={T.royalBurgundy} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>Upload Vendor Payment File</div>
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.55 }}>
                Download the template below — pre-filled with every invoiced PO's PO number, vendor, total, and <span style={{ fontWeight: 600, color: T.luxuryBrown }}>Remaining Amount</span> (what's still owed) — then fill in <span style={{ fontWeight: 600, color: T.luxuryBrown }}>Amount Paying</span> (how much is being paid this time) plus the UTR/firm/date, and upload it back as an Excel file (.xlsx).
                {" "}Required: <span style={{ fontWeight: 600, color: T.luxuryBrown }}>poNumber, amountPaid</span>. Optional: <span style={{ fontWeight: 600, color: T.luxuryBrown }}>utrNumber, firmId, paymentDate</span>.
                {" "}Rows are matched against real POs and their vendor bills, and saved directly.
              </div>
              {result ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={12} />
                  {fileName} — {totalRows} rows processed
                </div>
              ) : uploading ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>Uploading and matching against real PO/vendor bill records…</div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="secondary" size="md" iconLeft={Download}
                disabled={rows.length === 0}
                onClick={() => void downloadVendorPaymentTemplate(rows)}
              >
                Download Template
              </Button>
              {result && (
                <Button variant="secondary" size="md" iconLeft={X} onClick={handleReset}>
                  Clear
                </Button>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept={IMPORT_FILE_ACCEPT}
                onChange={handleFileChange}
                containerClassName="hidden"
              />
              <Button
                variant="primary"
                size="md"
                iconLeft={UploadCloud}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Processing…" : result ? "Upload New File" : "Upload Vendor Payment File"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error message ── */}
      {error && (
        <div style={{ marginTop: 12, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, lineHeight: 1.55 }}>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          {/* Summary strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 18, gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows", value: String(totalRows), color: T.luxuryBrown, bg: "#FFFFFF", icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Payments Saved", value: String(result.created), color: T.green, bg: "rgba(30,102,64,0.07)", icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Failed Rows", value: String(result.failed), color: T.crimson, bg: "rgba(192,57,43,0.06)", icon: <AlertTriangle size={18} color={T.crimson} /> },
              { label: "Total Amount", value: formatMoney(rupees(result.totalAmount)), color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)", icon: <FileText size={18} color={T.royalBurgundy} /> },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(74,6,27,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {result.created > 0 && (
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui, fontSize: 13, color: T.green }}>
                <CheckCircle2 size={16} color={T.green} />
                {result.created} payment{result.created !== 1 ? "s" : ""} saved directly to the backend — no further action needed.
              </div>
              {user?.name && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingLeft: 26 }}>
                  Recorded by <strong style={{ color: T.luxuryBrown }}>{user.name}</strong>
                </div>
              )}
            </div>
          )}

          {/* Failed rows */}
          {result.errors.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={16} color={T.crimson} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Failed Rows</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.errors.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.errors.map((e, i) => (
                  <motion.div key={e.row} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{ background: "rgba(192,57,43,0.04)", borderRadius: 12, border: `1px solid rgba(192,57,43,0.22)`, borderLeft: `4px solid ${T.crimson}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <CircleAlert size={14} color={T.crimson} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
                      Row {e.row}: {e.message}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
