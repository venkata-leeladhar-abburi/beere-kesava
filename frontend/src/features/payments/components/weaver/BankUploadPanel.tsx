import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, FileText, IndianRupee, UploadCloud, X } from "lucide-react";
import { motion } from "motion/react";
import * as XLSX from "xlsx";

import { WeaverPaymentRecord, useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { WEAVERS } from "../../data/weavers";
import { EASE, F, T } from "../../theme";
import { ExcelRow, MatchedPayment, UnmatchedRow, UploadResult } from "../../types";
import { Pip } from "../common/primitives";

// ── Bank Upload Panel ─────────────────────────────────────────────────────────
export function BankUploadPanel({ onMatchUpdate, onReset }: { onMatchUpdate?: (matched: MatchedPayment[]) => void; onReset?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const { addPayments } = useWeaverPayments();

  const normalize = (s: unknown) =>
    String(s ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

  const HEADER_MAP: Record<string, keyof ExcelRow> = {
    weaverid:       "weaverId",
    weavername:     "weaverName",
    name:           "weaverName",
    batchno:        "batchNo",
    batchnumber:    "batchNo",
    loomnumber:     "loomNumber",
    noofsarees:     "noOfSarees",
    numberofsarees: "noOfSarees",
    amount:         "amount",
    amountpaid:     "amount",
    deduction:      "deduction",
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

        // Build column key → ExcelRow key map from first row headers
        const firstRowKeys = Object.keys(raw[0]);
        const colMap: Record<string, keyof ExcelRow> = {};
        firstRowKeys.forEach(k => {
          const norm = normalize(k);
          if (HEADER_MAP[norm]) colMap[k] = HEADER_MAP[norm];
        });

        // Ensure all 7 fields are present
        const requiredKeys: (keyof ExcelRow)[] = ["weaverId", "weaverName", "batchNo", "loomNumber", "noOfSarees", "amount", "deduction"];
        const missing = requiredKeys.filter(
          k => !Object.values(colMap).includes(k)
        );
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.map(k => {
            if (k === "weaverId") return "Weaver ID";
            if (k === "weaverName") return "Name";
            if (k === "batchNo") return "Batch No";
            if (k === "loomNumber") return "Loom Number";
            if (k === "noOfSarees") return "No of Sarees";
            if (k === "amount") return "Amount";
            if (k === "deduction") return "Deduction";
            return k;
          }).join(", ")}. Expected all 7 columns to be present.`);
          setParsing(false);
          return;
        }

        // Parse each row
        const rows: ExcelRow[] = raw.map(r => {
          const out: Partial<ExcelRow> = {};
          Object.entries(colMap).forEach(([col, key]) => {
            if (key === "amount" || key === "deduction") {
              out[key] = parseFloat(String(r[col]).replace(/[^\d.]/g, "")) || 0;
            } else if (key === "noOfSarees") {
              out[key] = parseInt(String(r[col]).replace(/[^\d]/g, ""), 10) || 0;
            } else {
              (out as Record<string, unknown>)[key] = String(r[col] ?? "").trim();
            }
          });
          return out as ExcelRow;
        });

        // Match against WEAVERS
        const matched: MatchedPayment[] = [];
        const unmatched: UnmatchedRow[] = [];

        rows.forEach(row => {
          const found = WEAVERS.find(
            w => w.id.trim().toLowerCase() === row.weaverId.trim().toLowerCase()
          );
          if (found) matched.push({ ...row, weaverRecord: found });
          else unmatched.push(row);
        });

        setResult({ fileName: file.name, totalRows: rows.length, matched, unmatched });

        // Persist matched records to shared context so WeaverPortal can read them
        if (matched.length > 0) {
          const records: WeaverPaymentRecord[] = matched.map((m, idx) => ({
            id: `pay-${Date.now()}-${idx}`,
            weaverId: m.weaverRecord.id,
            weaverName: m.weaverRecord.name,
            amountPaid: m.amount, // mapped from amount
            utrNumber: `UTR-${m.batchNo}-${m.loomNumber}`, // generated fallback UTR
            firmName: "Beere Kesava & Brothers Silks",
            paymentDate: new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
            uploadedAt: new Date().toISOString(),
            batchNo: m.batchNo,
            loomNumber: m.loomNumber,
            noOfSarees: m.noOfSarees,
            amount: m.amount,
            deduction: m.deduction,
          }));
          addPayments(records);
          onMatchUpdate?.(matched);
        }
      } catch (err) {
        setError("Failed to read the file. Please ensure it is a valid .xlsx or .xls file.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onMatchUpdate, addPayments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    onReset?.();
  };

  const fmtAmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString("en-IN")}`;

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
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.55, maxWidth: 560 }}>
              Upload an Excel file (.xlsx / .xls) with columns: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>Weaver ID · Name · Batch No · Loom Number · No of Sarees · Amount · Deduction</span>. System will auto-match weavers and flag unmatched rows.
            </div>
            {result ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />
                {result.fileName} — {result.totalRows} rows processed
              </div>
            ) : (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />Last payment: April 2026 paid on 05 May 2026
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.royalBurgundy, border: "none", borderRadius: 9, color: "#FFFDF9", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, opacity: parsing ? 0.7 : 1 }}
          >
            <UploadCloud size={14} />{parsing ? "Processing…" : result ? "Upload New File" : "Upload Bank Payment File"}
          </motion.button>
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
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows",          value: String(result.totalRows),                              color: T.luxuryBrown, bg: "#FFFFFF",                           icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Matched Weavers",     value: String(result.matched.length),                         color: T.green,       bg: "rgba(30,102,64,0.07)",             icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Unmatched Rows",      value: String(result.unmatched.length),                       color: T.crimson,     bg: "rgba(192,57,43,0.06)",             icon: <AlertTriangle size={18} color={T.crimson} /> },
              { label: "Total Distributed",   value: fmtAmt(result.matched.reduce((s, m) => s + m.amount, 0)), color: T.antiqueGold, bg: "rgba(200,155,71,0.08)", icon: <IndianRupee size={18} color={T.antiqueGold} /> },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(74,6,27,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section A — Matched */}
          {result.matched.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={16} color={T.green} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Matched Payments</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.green, background: "rgba(30,102,64,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.matched.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {result.matched.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}
                    style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid rgba(30,102,64,0.22)`, borderLeft: `4px solid ${T.green}`, boxShadow: "0 2px 10px rgba(30,102,64,0.06)", overflow: "hidden" }}>
                    {/* Card header */}
                    <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Pip initials={m.weaverRecord.initials} bg={m.weaverRecord.bg} size={36} />
                        <div>
                          <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2 }}>{m.weaverRecord.name}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, marginTop: 1 }}>{m.weaverRecord.id}</div>
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: "rgba(30,102,64,0.10)", color: T.green, flexShrink: 0 }}>
                        <CheckCircle2 size={11} />Matched ✓
                      </span>
                    </div>
                    {/* Details */}
                    <div style={{ padding: "0 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 14px" }}>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Batch No</div>
                        <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{m.batchNo}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Loom Number</div>
                        <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>Loom {m.loomNumber}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>No of Sarees</div>
                        <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{m.noOfSarees}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Amount</div>
                        <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹{m.amount.toLocaleString("en-IN")}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Deduction</div>
                        <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>₹{m.deduction.toLocaleString("en-IN")}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Net Paid</div>
                        <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹{(m.amount - m.deduction).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Section B — Unmatched */}
          {result.unmatched.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={16} color={T.crimson} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Unmatched Rows</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.unmatched.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.unmatched.map((u, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{ background: "rgba(192,57,43,0.04)", borderRadius: 12, border: `1px solid rgba(192,57,43,0.22)`, borderLeft: `4px solid ${T.crimson}`, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.crimson, lineHeight: 1.2 }}>{u.weaverName || "(No Name)"}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>ID: {u.weaverId || "—"}</div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: "rgba(192,57,43,0.10)", color: T.crimson, flexShrink: 0 }}>
                        <AlertTriangle size={11} />Unmatched ⚠
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px 14px", marginBottom: 10 }}>
                      {[
                        { label: "Batch No",   value: u.batchNo || "—" },
                        { label: "Loom No",    value: u.loomNumber || "—" },
                        { label: "Sarees",     value: String(u.noOfSarees) },
                        { label: "Amount",     value: `₹${u.amount.toLocaleString("en-IN")}` },
                        { label: "Deduction",  value: `₹${u.deduction.toLocaleString("en-IN")}` },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                      <CircleAlert size={12} />No weaver found with ID <strong>{u.weaverId || "—"}</strong> — please verify manually
                    </div>
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
