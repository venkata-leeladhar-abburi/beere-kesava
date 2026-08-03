import React from "react";
import { Search } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "./theme";
import { TabKey } from "./types";

export function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        height: 38, padding: "0 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
        background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none"
      }}>
      {options.map(o => <option key={o} value={o}>{o === "all" ? (label === "Finishing" || label === "QC Status" ? `All ${label}` : `All ${label}s`) : o}</option>)}
    </select>
  );
}

interface TabsBarProps {
  TABS: { key: TabKey; label: string; color: string }[];
  tab: TabKey;
  setTab: (t: TabKey) => void;
  counts: Record<TabKey, number>;
  dateFilter: DateFilterState;
  setDateFilter: (f: DateFilterState) => void;
}

export function TabsBar({ TABS, tab, setTab, counts, dateFilter, setDateFilter }: TabsBarProps) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {TABS.map(t => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                padding: "8px 16px", borderRadius: 99, fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                background: on ? t.color : "#FFFFFF", color: on ? "#FFFDF9" : T.taupe,
                border: on ? "none" : `1.5px solid ${T.borderDef}`, transition: "all 0.16s",
              }}>
              {t.label}
              <span style={{
                fontFamily: F.mono, fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.07)",
                color: on ? "#FFFDF9" : t.color,
              }}>{counts[t.key]}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: 12 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>
    </>
  );
}
