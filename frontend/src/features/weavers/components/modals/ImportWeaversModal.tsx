// ── Import weavers from an Excel/CSV file ────────────────────────────────────
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { UploadSimple } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { Status, ParsedWeaverRow } from "../types";
import type { ImportedWeaver } from "../data";
import { Button, IconButton } from "../../../../shared/ui/primitives";

export function ImportWeaversModal({ open, onClose, onImport, nextIdStart }: {
  open: boolean; onClose: () => void; onImport: (rows: ImportedWeaver[]) => void; nextIdStart: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<ParsedWeaverRow[]>([]);
  const [invalid, setInvalid] = useState<{ row: number; reason: string }[]>([]);
  const [parsing, setParsing] = useState(false);

  const normalize = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const HEADER_MAP: Record<string, keyof ParsedWeaverRow> = {
    name: "name", weavername: "name", fullname: "name",
    village: "village", villagearea: "village", area: "village",
    mobile: "mobile", mobilenumber: "mobile", phone: "mobile", contact: "mobile",
    looms: "looms", numberoflooms: "looms", noofooms: "looms",
    status: "status",
  };

  const reset = () => { setFileName(null); setError(null); setValid([]); setInvalid([]); };

  const parseFile = (file: File) => {
    setParsing(true);
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) { setError("The uploaded file is empty or has no data rows."); setParsing(false); return; }

        const firstRowKeys = Object.keys(raw[0]);
        const colMap: Record<string, keyof ParsedWeaverRow> = {};
        firstRowKeys.forEach(k => {
          const norm = normalize(k);
          if (HEADER_MAP[norm]) colMap[k] = HEADER_MAP[norm];
        });

        const required: (keyof ParsedWeaverRow)[] = ["name", "village", "mobile"];
        const missing = required.filter(k => !Object.values(colMap).includes(k));
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.map(k => k === "name" ? "Name" : k === "village" ? "Village" : "Mobile").join(", ")}. Expected Name, Village, Mobile (Looms and Status are optional).`);
          setParsing(false);
          return;
        }

        const okRows: ParsedWeaverRow[] = [];
        const badRows: { row: number; reason: string }[] = [];

        raw.forEach((r, i) => {
          const out: Partial<ParsedWeaverRow> = { looms: 1, status: "active" as Status };
          Object.entries(colMap).forEach(([col, key]) => {
            if (key === "looms") out.looms = parseInt(String(r[col]).replace(/[^\d]/g, ""), 10) || 1;
            else if (key === "status") {
              const s = normalize(r[col]);
              out.status = s.includes("qc") ? "qc" : s.includes("idle") ? "idle" : "active";
            } else {
              (out as Record<string, unknown>)[key] = String(r[col] ?? "").trim();
            }
          });
          if (!out.name) badRows.push({ row: i + 2, reason: "Missing name" });
          else if (!out.village) badRows.push({ row: i + 2, reason: "Missing village" });
          else if (!out.mobile) badRows.push({ row: i + 2, reason: "Missing mobile number" });
          else okRows.push(out as ParsedWeaverRow);
        });

        setValid(okRows);
        setInvalid(badRows);
        setParsing(false);
      } catch {
        setError("Could not read this file. Please upload a valid .xlsx or .csv file.");
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    const initialsOf = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? "").join("") || "WV";
    const palette = ["#5A3E6B", "#2D6B6B", "#4A6B4A", "#9B6B8A", "#2D7D6B", "#4A5E7A", "#7A2040", "#6B4A2A"];
    const rows: ImportedWeaver[] = valid.map((v, i) => ({
      id: crypto.randomUUID(),
      name: v.name, village: v.village, photo: null,
      initials: initialsOf(v.name), bg: palette[(nextIdStart + i) % palette.length],
      status: v.status, thisMonth: 0, passRate: 0, totalEver: 0,
      looms: v.looms, batch: null, design: null, mobile: v.mobile,
      totalPaid: "₹0", lastActive: "Just imported",
    }));
    onImport(rows);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(26,10,15,0.42)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => { reset(); onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: 32, width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 90px rgba(0,0,0,0.25)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>Import Weavers from Excel</h2>
          <IconButton onClick={() => { reset(); onClose(); }} variant="ghost" icon={X} label="Close" className="text-[var(--text-tertiary)]" />
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 24px", lineHeight: 1.6 }}>
          Upload a .xlsx or .csv file with columns <b>Name</b>, <b>Village</b>, <b>Mobile</b>, and optionally <b>Looms</b> and <b>Status</b>.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => fileInputRef.current?.click())?.(); } }}
          style={{ border: `2px dashed rgba(110,15,45,0.25)`, background: "rgba(110,15,45,0.03)", borderRadius: 14, padding: "32px 20px", textAlign: "center", cursor: "pointer" }}
        >
          <UploadSimple size={28} color={T.royalBurgundy} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
            {fileName ? fileName : "Click to choose a file"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>.xlsx, .xls, or .csv</div>
          <input
            ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
          />
        </div>

        {parsing && <div style={{ marginTop: 16, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Reading file…</div>}

        {error && (
          <div style={{ marginTop: 16, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12, padding: "14px 16px", fontFamily: F.ui, fontSize: 13, color: "#C0392B" }}>
            {error}
          </div>
        )}

        {!error && !parsing && (valid.length > 0 || invalid.length > 0) && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green, background: "rgba(30,102,64,0.10)", borderRadius: 99, padding: "5px 14px" }}>{valid.length} ready to import</span>
              {invalid.length > 0 && (
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#C0392B", background: "rgba(192,57,43,0.10)", borderRadius: 99, padding: "5px 14px" }}>{invalid.length} skipped</span>
              )}
            </div>

            {valid.length > 0 && (
              <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", marginBottom: invalid.length > 0 ? 14 : 0 }}>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {valid.map((v, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < valid.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 1 ? "rgba(247,242,234,0.5)" : "#FFF" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{v.name}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{v.village} · {v.mobile} · {v.looms} loom{v.looms !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invalid.length > 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#C0392B" }}>
                {invalid.map((b, i) => <div key={i}>Row {b.row}: {b.reason}</div>)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28, borderTop: `1px solid ${T.borderDef}`, paddingTop: 20 }}>
          <Button onClick={() => { reset(); onClose(); }} variant="secondary" className="rounded-[10px]">Cancel</Button>
          <Button
            disabled={valid.length === 0} onClick={handleConfirm}
            variant="primary"
            className="rounded-[10px] bg-[#6E0F2D]"
          >
            Import {valid.length > 0 ? valid.length : ""} Weaver{valid.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
