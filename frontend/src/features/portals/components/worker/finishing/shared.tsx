import React, { useState } from "react";
import { motion } from "motion/react";
import { Scan, CheckCircle2 } from "lucide-react";
import { C, F } from "../tokens";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const WORKER_NAME = "Ravi Kumar (WK-042)";

// ── Shared atoms ──────────────────────────────────────────────────────────────

export function SectionHeader({ icon, title, count, accent }: {
  icon: React.ReactNode; title: string; count?: number; accent?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: accent ?? "rgba(107,26,42,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{title}</div>
      </div>
      {count !== undefined && (
        <span style={{ fontFamily: F.m, fontSize: 11, fontWeight: 700, background: "rgba(107,26,42,0.09)", color: C.burg, padding: "3px 9px", borderRadius: 999 }}>
          {count}
        </span>
      )}
    </div>
  );
}

export function ScanBarBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: 38, background: C.dark, border: "none", borderRadius: 10, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", flexShrink: 0 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.burg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.dark; }}
    >
      <Scan size={15} color="#FFF" /> {label}
    </button>
  );
}

// ── Simulated scan ────────────────────────────────────────────────────────────

export function useScanSim(candidateIds: string[], onScanned: (id: string) => void) {
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const startScan = () => {
    if (!candidateIds.length) { setScanMsg("No sarees available to scan."); return; }
    setScanning(true);
    setScanMsg("Scanning…");
    setTimeout(() => {
      const id = candidateIds[Math.floor(Math.random() * candidateIds.length)];
      onScanned(id);
      setScanMsg(`Scanned: ${id}`);
      setScanning(false);
      setTimeout(() => setScanMsg(""), 2500);
    }, 900);
  };

  return { scanning, scanMsg, startScan };
}

// ── Success toast ─────────────────────────────────────────────────────────────

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#FFF", padding: "12px 18px", borderRadius: 12, fontFamily: F.u, fontSize: 13, fontWeight: 600, zIndex: 400, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
      <CheckCircle2 size={15} color={C.gold} /> {msg}
    </motion.div>
  );
}
