import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, FileText, IndianRupee, UploadCloud, X } from "lucide-react";
import { motion } from "motion/react";

import { ApiError } from "../../../../shared/api/client";
import { ImportResult, weaverPaymentsApi } from "../../../../shared/api/payments";
import { EASE, F, T } from "../../theme";
import { Button } from "../../../../shared/ui/primitives";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Bank Upload Panel ─────────────────────────────────────────────────────────
// Uploads straight to the real backend import job (POST /payments/weavers/import,
// processed async via BullMQ against real Weaver rows) instead of parsing/matching
// the file client-side — the backend is the single source of truth for which
// weaverId values actually exist.
export function BankUploadPanel({ onReset }: { onMatchUpdate?: (matched: unknown[]) => void; onReset?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pollJob = useCallback(async (jobId: string): Promise<ImportResult> => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await weaverPaymentsApi.getImportStatus(jobId);
      if (status.state === "completed" && status.result) return status.result;
      if (status.state === "failed") {
        throw new Error(status.failedReason ?? "Import job failed");
      }
      await sleep(1000);
    }
    throw new Error("Import is taking longer than expected — please check back shortly.");
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const { jobId } = await weaverPaymentsApi.importExcel(file);
      const finalResult = await pollJob(jobId);
      setResult(finalResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to import this file.");
    } finally {
      setUploading(false);
    }
  }, [pollJob]);

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
      <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UploadCloud size={22} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 3 }}>Upload Bank Payment File</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.55, maxWidth: 560 }}>
              Upload an Excel file (.xlsx) with a header row. Required columns: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>weaverId, amountPaid</span>. Optional: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>utrNumber, firmId, paymentDate, batchNo, loomNumber, noOfSarees, deduction</span>. Rows are matched against real weaver records and saved directly.
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
          {/* Native file input — no design-system primitive covers file uploads; kept raw and visually hidden, triggered via the Button below. */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
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
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows", value: String(totalRows), color: T.luxuryBrown, bg: "#FFFFFF", icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Payments Saved", value: String(result.created), color: T.green, bg: "rgba(30,102,64,0.07)", icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Failed Rows", value: String(result.failed), color: T.crimson, bg: "rgba(192,57,43,0.06)", icon: <IndianRupee size={18} color={T.crimson} /> },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(74,6,27,0.05)" }}>
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
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.errors.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.errors.map((e, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}
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
