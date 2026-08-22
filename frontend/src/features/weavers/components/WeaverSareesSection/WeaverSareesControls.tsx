import React from "react";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { Button, Select as SelectPrimitive, SelectItem } from "../../../../shared/ui/primitives";
import { TabKey } from "./types";

export function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <SelectPrimitive
      value={value}
      onValueChange={onChange}
      size="sm"
      containerClassName="w-full sm:w-auto sm:min-w-[140px] sm:max-w-[220px] sm:flex-initial"
    >
      {options.map(o => (
        <SelectItem key={o} value={o}>
          {o === "all" ? (label === "Finishing" || label === "QC Status" ? `All ${label}` : `All ${label}s`) : o}
        </SelectItem>
      ))}
    </SelectPrimitive>
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
            <Button key={t.key} onClick={() => setTab(t.key)} variant={on ? "primary" : "secondary"} size="sm" className="rounded-full">
              {t.label}
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.07)",
                color: on ? "#FFFDF9" : t.color,
              }}>{counts[t.key]}</span>
            </Button>
          );
        })}
      </div>

      <div style={{ marginBottom: 12 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>
    </>
  );
}
