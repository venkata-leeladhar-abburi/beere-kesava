import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, FileText, IndianRupee, UploadCloud, X } from "lucide-react";
import { motion } from "motion/react";

import { ApiError } from "../../../../shared/api/client";
import { ImportResult, weaverPaymentsApi } from "../../../../shared/api/payments";
import { EASE, F, T } from "../../theme";
import { Button, Input } from "../../../../shared/ui/primitives";

// ── Bank Upload Panel ─────────────────────────────────────────────────────────
// Uploads straight to the real backend import endpoint (POST /payments/weavers/import),
// processed synchronously against real Weaver rows, instead of parsing/matching
// the file client-side — the backend is the single source of truth for which
// weaverId values actually exist.
export function BankUploadPanel({ onReset, onUploaded }: { onMatchUpdate?: (matched: unknown[]) => void; onReset?: () => void; onUploaded?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const finalResult = await weaverPaymentsApi.importExcel(file);
      setResult(finalResult);
      // Fire immediately once rows are actually saved, not only when the
      // admin later clicks Clear — otherwise the production table below
      // keeps showing stale (pre-upload) payment data until then.
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
    onReset?.();
  };

  const totalRows = result ? result.created + result.failed : 0;

  return (
    <div style={{ marginBottom: 22 }}>
      {/* ── Upload trigger panel ── */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UploadCloud size={22} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 3 }}>Upload Bank Payment File</div>
            <div className="sm:max-w-[620px]" style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.55, maxWidth: "100%" }}>
              Upload an Excel file (.xlsx) with a header row — same columns as the table above, in this order:
              {" "}<span style={{ fontWeight: 600, color: T.luxuryBrown }}>weaverId, weaverName, batchNo, loomNumber, noOfSarees, makingCharges, deduction, amountPaid, utrNumber, firmId, paymentDate</span>.
              {" "}Required: <span style={{ fontWeight: 600, color: T.luxuryBrown }}>weaverId, amountPaid</span>. Optional: <span style={{ fontWeight: 600, color: T.luxuryBrown }}>utrNumber, firmId, paymentDate, batchNo, loomNumber, noOfSarees, deduction</span>.
              {" "}<span style={{ fontWeight: 600, color: T.luxuryBrown }}>weaverName</span> and <span style={{ fontWeight: 600, color: T.luxuryBrown }}>makingCharges</span> are reference-only — kept for readability but ignored on import.
              {" "}Rows are matched against real weaver records and saved directly.
            </div>
            {result ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />
                {fileName} — {totalRows} rows processed
              </div>
            ) : uploading ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>Uploading and matching against real weaver records…</div>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {result && (
            <Button variant="secondary" size="md" iconLeft={X} onClick={handleReset}>
              Clear
            </Button>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
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
            {uploading ? "Processing…" : result ? "Upload New File" : "Upload Bank Payment File"}
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginTop: 18, gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows", value: String(totalRows), color: T.luxuryBrown, bg: "#FFFFFF", icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Payments Saved", value: String(result.created), color: T.green, bg: "rgba(30,102,64,0.07)", icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Failed Rows", value: String(result.failed), color: T.crimson, bg: "rgba(192,57,43,0.06)", icon: <IndianRupee size={18} color={T.crimson} /> },
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
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui, fontSize: 13, color: T.green }}>
              <CheckCircle2 size={16} color={T.green} />
              {result.created} payment{result.created !== 1 ? "s" : ""} saved directly to the backend — no further action needed.
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
