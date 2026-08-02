import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, UploadCloud, X } from "lucide-react";
import { motion } from "motion/react";
import * as XLSX from "xlsx";

import { EASE, F, T } from "../../theme";
import { VendorExcelRow, VendorMatchedRow, VendorPayment, VendorUnmatchedRow, VendorUploadResult } from "../../types";

// ── Vendor Payment Excel Upload Panel ─────────────────────────────────────────
export function VendorUploadPanel({ vendorPayments, onMatched }: { vendorPayments: VendorPayment[]; onMatched: (matched: VendorMatchedRow[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<VendorUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const normalize = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const HEADER_MAP: Record<string, keyof VendorExcelRow> = {
    ponumber: "poNumber", amountpaid: "amountPaid", utrnumber: "utrNumber", paymentdate: "paymentDate", firmname: "firmName",
  };

  const parseFile = useCallback((file: File) => {
    setParsing(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) { setError("The uploaded file is empty or has no data rows."); setParsing(false); return; }

        const firstRowKeys = Object.keys(raw[0]);
        const colMap: Record<string, keyof VendorExcelRow> = {};
        firstRowKeys.forEach(k => {
          const norm = normalize(k);
          if (HEADER_MAP[norm]) colMap[k] = HEADER_MAP[norm];
        });

        const missing = (Object.values(HEADER_MAP) as string[]).filter(v => !Object.values(colMap).includes(v as keyof VendorExcelRow));
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.join(", ")}. Expected: PO Number, Amount Paid, UTR Number, Payment Date, Firm Name.`);
          setParsing(false);
          return;
        }

        const rows: VendorExcelRow[] = raw.map(r => {
          const out: Partial<VendorExcelRow> = {};
          Object.entries(colMap).forEach(([col, key]) => {
            if (key === "amountPaid") out[key] = parseFloat(String(r[col]).replace(/[^\d.]/g, "")) || 0;
            else (out as Record<string, unknown>)[key] = String(r[col] ?? "").trim();
          });
          return out as VendorExcelRow;
        });

        const matched: VendorMatchedRow[] = [];
        const unmatched: VendorUnmatchedRow[] = [];
        rows.forEach(row => {
          const found = vendorPayments.find(v => v.poNumber.trim().toLowerCase() === row.poNumber.trim().toLowerCase());
          if (found) matched.push({ ...row, vendorPayment: found });
          else unmatched.push(row);
        });

        setResult({ fileName: file.name, totalRows: rows.length, matched, unmatched });
        if (matched.length > 0) onMatched(matched);
      } catch {
        setError("Failed to read the file. Please ensure it is a valid .xlsx or .xls file.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [vendorPayments, onMatched]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };
  const handleReset = () => { setResult(null); setError(null); };

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UploadCloud size={22} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 3 }}>Upload Vendor Payment File</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.55, maxWidth: 560 }}>
              Upload an Excel file (.xlsx / .xls) with columns: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>PO Number · Amount Paid · UTR Number · Payment Date · Firm Name</span>. System will auto-match vendor bills and flag unmatched rows.
            </div>
            {result && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />{result.fileName} — {result.totalRows} rows processed
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {result && (
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 9, color: T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              <X size={13} />Clear
            </motion.button>
          )}
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => fileInputRef.current?.click()} disabled={parsing}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.royalBurgundy, border: "none", borderRadius: 9, color: "#FFFDF9", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, opacity: parsing ? 0.7 : 1 }}>
            <UploadCloud size={14} />{parsing ? "Processing…" : result ? "Upload New File" : "Upload Vendor Payment File"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, lineHeight: 1.55 }}>{error}</span>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows", value: String(result.totalRows), color: T.luxuryBrown, bg: "#FFFFFF", icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Matched Bills", value: String(result.matched.length), color: T.green, bg: "rgba(30,102,64,0.07)", icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Unmatched Rows", value: String(result.unmatched.length), color: T.crimson, bg: "rgba(192,57,43,0.06)", icon: <AlertTriangle size={18} color={T.crimson} /> },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(74,6,27,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {result.matched.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={16} color={T.green} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Matched Vendor Bills</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.green, background: "rgba(30,102,64,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.matched.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {result.matched.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}
                    style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid rgba(30,102,64,0.22)`, borderLeft: `4px solid ${T.green}`, boxShadow: "0 2px 10px rgba(30,102,64,0.06)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{m.vendorPayment.vendor}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy }}>{m.poNumber}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>Amount</div><div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹{m.amountPaid.toLocaleString("en-IN")}</div></div>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>UTR</div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{m.utrNumber || "—"}</div></div>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>Date</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{m.paymentDate}</div></div>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>Firm</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{m.firmName || "—"}</div></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {result.unmatched.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={16} color={T.crimson} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Unmatched Rows</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.unmatched.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.unmatched.map((u, i) => (
                  <div key={i} style={{ background: "rgba(192,57,43,0.04)", borderRadius: 12, border: `1px solid rgba(192,57,43,0.22)`, borderLeft: `4px solid ${T.crimson}`, padding: "12px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.crimson }}>
                    No vendor bill found with PO Number <strong>{u.poNumber || "—"}</strong> — please verify manually
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
