import React, { useState } from "react";
import { Search } from "lucide-react";
import { C, F, inputStyle } from "../tokens";
import { type ReceivedSareeLog } from "./shared";

// ─── History Section ─────────────────────────────────────────────────────────
const HISTORY_DATA: (ReceivedSareeLog & { sareeType: string })[] = [
  { id: "PADMA-L1-004", weaver: "Padma Veni", wcode: "WV-002", batch: "BATCH-086", weight: "842g", date: "16 Jul 2026", sareeType: "Self Brocade", color: "Gold",   status: "Passed QC" },
  { id: "RAVI-L2-008",  weaver: "Ravi Kumar", wcode: "WV-001", batch: "BATCH-089", weight: "918g", date: "16 Jul 2026", sareeType: "Heavy Zari",  color: "Maroon", status: "Passed QC" },
  { id: "SURESH-L2-003",weaver: "Suresh Murti",wcode:"WV-007",batch: "BATCH-081", weight: "856g", date: "15 Jul 2026", sareeType: "Gadwal Cotton",color: "Red",    status: "Defective" },
  { id: "PADMA-L1-005", weaver: "Padma Veni", wcode: "WV-002", batch: "BATCH-086", weight: "848g", date: "15 Jul 2026", sareeType: "Self Brocade", color: "Green",  status: "Passed QC" },
  { id: "RAVI-L2-009",  weaver: "Ravi Kumar", wcode: "WV-001", batch: "BATCH-089", weight: "903g", date: "14 Jul 2026", sareeType: "Heavy Zari",  color: "Blue",   status: "Passed QC" },
  { id: "BKB-L3-002",   weaver: "Own Loom 3", wcode: "",        batch: "BATCH-OWN",weight: "774g", date: "14 Jul 2026", sareeType: "Kanjivaram",   color: "Cream",  status: "Passed QC" },
];

export function HistorySection({ liveRecords = [] }: { liveRecords?: ReceivedSareeLog[] }) {
  const [view, setView] = useState<"day" | "weaver">("day");
  const [search, setSearch] = useState("");

  const allData: (ReceivedSareeLog & { sareeType?: string })[] = [
    ...liveRecords.map(r => ({ ...r, sareeType: "—" })),
    ...HISTORY_DATA,
  ];

  const filtered = allData.filter(h =>
    !search ||
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.weaver.toLowerCase().includes(search.toLowerCase()) ||
    h.batch.toLowerCase().includes(search.toLowerCase()) ||
    h.color.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const byDay: Record<string, typeof filtered> = {};
  filtered.forEach(h => { if (!byDay[h.date]) byDay[h.date] = []; byDay[h.date].push(h); });

  // Group by weaver
  const byWeaver: Record<string, typeof filtered> = {};
  filtered.forEach(h => { if (!byWeaver[h.weaver]) byWeaver[h.weaver] = []; byWeaver[h.weaver].push(h); });

  const statusColor = (s: string) => s === "Passed QC" ? C.green : s === "Defective" ? C.crim : C.gold;

  const SareeRow = ({ h, last }: { h: typeof filtered[0]; last: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: last ? "none" : `1px solid rgba(107,26,42,0.06)` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{h.id}</span>
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#FFF", background: statusColor(h.status), padding: "1px 6px", borderRadius: 999 }}>{h.status}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 12, color: C.muted }}>
          {h.sareeType && h.sareeType !== "—" && <>{h.sareeType} · </>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.color?.toLowerCase() || "#CCC", border: "1px solid rgba(0,0,0,0.15)" }} />
            {h.color}
          </span>
          · {h.weight} · {h.batch}
        </div>
      </div>
      {view === "day" && <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, flexShrink: 0 }}>{h.weaver}</div>}
      {view === "weaver" && <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, flexShrink: 0 }}>{h.date}</div>}
    </div>
  );

  return (
    <div style={{ margin: "0 0 24px" }}>
      {/* Section header */}
      <div style={{ padding: "18px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.text }}>Received History</span>
        <div style={{ display: "flex", background: "#F0ECE8", borderRadius: 8, padding: 2 }}>
          {([["day", "Day Wise"], ["weaver", "Weaver Wise"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setView(key)}
              style={{ padding: "5px 10px", border: "none", borderRadius: 6, fontFamily: F.u, fontSize: 12, fontWeight: 600, cursor: "pointer", background: view === key ? C.burg : "transparent", color: view === key ? "#FFF" : C.muted }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ margin: "0 16px 10px", position: "relative" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saree ID, weaver, batch…"
          style={{ ...inputStyle, height: 40, paddingLeft: 34, fontSize: 12 }} />
        <Search size={13} color={C.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
      </div>

      {/* Grouped list */}
      <div style={{ margin: "0 16px" }}>
        {view === "day" ? (
          Object.entries(byDay).length === 0
            ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No records found.</div>
            : Object.entries(byDay).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, paddingLeft: 2 }}>{date}</div>
                <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                  {items.map((h, i) => <SareeRow key={h.id} h={h} last={i === items.length - 1} />)}
                </div>
              </div>
            ))
        ) : (
          Object.entries(byWeaver).length === 0
            ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No records found.</div>
            : Object.entries(byWeaver).map(([weaver, items]) => (
              <div key={weaver} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{weaver.split(" ").map(p => p[0]).join("").slice(0,2)}</span>
                  </div>
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>{weaver}</span>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>· {items.length} sarees</span>
                </div>
                <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                  {items.map((h, i) => <SareeRow key={h.id} h={h} last={i === items.length - 1} />)}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
