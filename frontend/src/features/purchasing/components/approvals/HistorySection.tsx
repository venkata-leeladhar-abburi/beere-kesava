import React from "react";
import { Check, X, Download } from "lucide-react";
import { T, F } from "./tokens";
import { HISTORY_ROWS } from "./data";
import { TypePill } from "./SharedUI";

const HIST_FILTERS = ["All History", "Purchase Orders", "Warp Requests", "Rate Changes", "Approved Only", "Rejected Only"];
const HIST_PERIODS = ["This Month", "Last 3 Months", "All Time"];

// ─── 5. APPROVAL HISTORY ─────────────────────────────────────────────────────
export function HistorySection({
  histFilter,
  setHistFilter,
  histPeriod,
  setHistPeriod,
}: {
  histFilter: string;
  setHistFilter: (v: string) => void;
  histPeriod: string;
  setHistPeriod: (v: string) => void;
}) {
  return (
    <div style={{ padding: "48px 56px" }}>
      {/* Section title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 24, background: T.royalBurgundy, borderRadius: 2 }} />
          <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
            Approval History — All Past Decisions
          </span>
        </div>
        <button style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.antiqueGold,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Download size={13} />
          Download History →
        </button>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 20, marginLeft: 16 }}>
        A permanent record of all approvals and rejections made in this portal.
      </p>

      {/* Filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {HIST_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setHistFilter(f)}
            style={{
              background: histFilter === f ? T.royalBurgundy : "transparent",
              color: histFilter === f ? "#FFF" : T.taupe,
              border: "1px solid " + (histFilter === f ? T.royalBurgundy : T.borderDef),
              borderRadius: 999, padding: "6px 14px",
              fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
              transition: "all 0.16s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Period pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {HIST_PERIODS.map(p => (
          <button
            key={p}
            onClick={() => setHistPeriod(p)}
            style={{
              background: histPeriod === p ? T.royalBurgundy : "transparent",
              color: histPeriod === p ? "#FFF" : T.taupe,
              border: "1px solid " + (histPeriod === p ? T.royalBurgundy : T.borderDef),
              borderRadius: 999, padding: "6px 14px",
              fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
              transition: "all 0.16s",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* History table */}
      <div style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "200px 140px 130px 1fr 120px 90px",
          background: T.cream,
          borderBottom: "1px solid " + T.borderDef,
          padding: "10px 20px",
          gap: 8,
        }}>
          {["Date & Time", "Type", "Requested By", "Details", "Decision", "Notified"].map(h => (
            <span key={h} style={{
              fontFamily: F.mono, fontSize: 12, color: T.taupe,
              textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600,
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {HISTORY_ROWS.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "200px 140px 130px 1fr 120px 90px",
              padding: "13px 20px",
              gap: 8,
              borderBottom: i < HISTORY_ROWS.length - 1 ? "1px solid " + T.borderDef : "none",
              background: i % 2 === 0 ? "#FFF" : T.warmIvory,
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.date}</span>
            <TypePill type={row.type} typeColor={row.typeColor} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{row.by}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{row.details}</span>
            <span style={{
              background: row.decision === "Approved" ? T.greenBg : T.crimsonBg,
              color: row.decision === "Approved" ? T.green : T.crimson,
              borderRadius: 6, padding: "3px 10px",
              fontFamily: F.ui, fontSize: 12, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {row.decision === "Approved" ? <Check size={11} /> : <X size={11} />}
              {row.decision}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={11} /> Sent
            </span>
          </div>
        ))}
      </div>

      {/* Permanent record note */}
      <div style={{ textAlign: "right", marginTop: 10, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
        🔒 This history is permanent and cannot be edited or deleted.
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20, alignItems: "center" }}>
        {["Previous", "1", "2", "3", "Next"].map((p, i) => (
          <button
            key={i}
            style={{
              background: p === "1" ? T.royalBurgundy : "transparent",
              color: p === "1" ? "#FFF" : T.taupe,
              border: "1px solid " + (p === "1" ? T.royalBurgundy : T.borderDef),
              borderRadius: 8, padding: "6px 14px",
              fontFamily: F.ui, fontSize: 13, fontWeight: p === "1" ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
