// ── Table view + directory container that switches between card/list/table ─
import React, { useState } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Rows, Eye as PhEye, MapPin as PhMapPin } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { STATUS_CFG, Status } from "../types";
import { WEAVERS, TABLE_COLS } from "../data";
import { FadeUp, qcColor } from "../common/primitives";
import { WeaverCardGrid, WeaverListView, useRealWeavers } from "./WeaverCardAndListViews";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";

// Real roster + live per-weaver stats (GET /weavers, GET /weavers/:id/stats).
// The stats endpoint has no monthly breakdown, total-paid, or last-active
// timestamp yet, so those columns show "—" rather than an invented number.
function useRealTableRows() {
  const { data: weaversRes, isLoading: rosterLoading, isError: rosterError } = useQuery({
    queryKey: ["weavers-table-roster"],
    queryFn: () => weaversApi.list(),
  });
  const roster = weaversRes?.items ?? [];
  const { data: statsList, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["weavers-table-stats", roster.map(w => w.id)],
    queryFn: () => Promise.all(roster.map(w => weaversApi.getStats(w.id))),
    enabled: roster.length > 0,
  });
  const statsById = new Map((statsList ?? []).map(s => [s.weaverId, s]));
  const rows = roster.map(w => {
    const s: BackendWeaverStats | undefined = statsById.get(w.id);
    return {
      id: w.id,
      name: w.name,
      village: w.village || "—",
      mobile: w.phone || "—",
      looms: w.looms,
      status: (s && s.activeBatchRowsCount > 0 ? "active" : "idle") as Status,
      thisMonth: 0,
      passRate: s?.qcPassRate ?? 0,
      totalEver: String(s?.totalSareesWoven ?? 0),
      totalPaid: "—",
      lastActive: "—",
    };
  });
  return {
    rows,
    isLoading: rosterLoading || (roster.length > 0 && statsLoading),
    isError: rosterError || statsError,
  };
}

export function WeaverTableView({ onSelect }: { onSelect: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const { rows: TABLE_ROWS, isLoading, isError } = useRealTableRows();
  const visible = showAll ? TABLE_ROWS : TABLE_ROWS.slice(0, 5);
  const TD: React.CSSProperties = { padding: "16px 18px", borderBottom: "1px solid rgba(110,15,45,0.06)", verticalAlign: "middle" };
  if (isLoading) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
        Loading weavers…
      </div>
    );
  }
  if (isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
        Couldn't load weavers.
      </div>
    );
  }
  if (TABLE_ROWS.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>
        No weavers yet.
      </div>
    );
  }
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1240 }}>
          <thead>
            <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
              {TABLE_COLS.map(c => (
                <th key={c} style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", textAlign: "left", padding: "15px 18px", fontWeight: 500, whiteSpace: "nowrap" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const cfg = STATUS_CFG[r.status];
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.04 }}
                  style={{ background: i % 2 === 1 ? "rgba(247,242,234,0.50)" : "#FFFFFF" }}
                >
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, fontWeight: 700, letterSpacing: "0.4px" }}>{r.id}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.name}</span></td>
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <PhMapPin size={14} color={T.taupe} weight="fill" />
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{r.village}</span>
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown }}>{r.mobile}</span></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Rows size={15} color={T.taupe} weight="regular" />
                      <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{r.looms}</span>
                    </div>
                  </td>
                  <td style={TD}>
                    <span style={{ display: "inline-flex", alignItems: "center", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
                      {r.status === "active" ? "● Weaving" : r.status === "qc" ? "● QC Check" : "○ Idle"}
                    </span>
                  </td>
                  <td style={TD}><span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>{r.thisMonth}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: qcColor(r.passRate) }}>{r.passRate}%</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown }}>{r.totalEver}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, fontWeight: 700 }}>{r.totalPaid}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 14, color: T.taupe }}>{r.lastActive}</span></td>
                  <td style={TD}>
                    <motion.button
                      onClick={() => onSelect(r.id)}
                      whileHover={{ scale: 1.04, background: "rgba(110,15,45,0.10)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "9px 15px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                    >
                      <PhEye size={18} weight="regular" /> View
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!showAll && (
        <div style={{ padding: "22px 26px", textAlign: "center", borderTop: `1px solid ${T.borderDef}` }}>
          <motion.button onClick={() => setShowAll(true)} whileHover={{ scale: 1.02 }} style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.35)" }}>Load More Weavers</motion.button>
        </div>
      )}
    </div>
  );
}
export function WeaverDirectory({ view, onSelect, onEdit, onBatches, extraWeavers = [] }: { view: string; onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  // Build a real-roster lookup map so the table-view "View" button can resolve
  // a clicked row id to a real weaver object (WEAVERS[] is empty mock).
  const realWeavers = useRealWeavers(extraWeavers);
  const realById = new Map(realWeavers.map(w => [w.id, w]));

  return (
    <div style={{ padding: "24px 48px 0" }}>
      <FadeUp>
        {view === "card" && <WeaverCardGrid onSelect={onSelect} onEdit={onEdit} onBatches={onBatches} extraWeavers={extraWeavers} />}
        {view === "list" && <WeaverListView onSelect={onSelect} extraWeavers={extraWeavers} />}
        {view === "table" && (
          <WeaverTableView
            onSelect={id => {
              const w = realById.get(id);
              if (w) onSelect(w);
            }}
          />
        )}
      </FadeUp>
    </div>
  );
}
