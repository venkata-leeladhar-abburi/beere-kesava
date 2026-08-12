import React, { useMemo, useState } from "react";
import { Search, History } from "lucide-react";
import { C, F } from "../tokens";
import { SectionCard } from "../primitives";
import { type ReceivedSareeLog } from "./shared";
import { Button, Input } from "../../../../../shared/ui/primitives";
import { useQc } from "../../../../qc/contexts/QcContext";
import { StatusPill } from "../../../../../shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";

const QC_RESULT_TO_STATUS: Record<string, ReceivedSareeLog["status"]> = {
  passed: "Passed QC",
  semi: "Pending QC",
  defective: "Defective",
};

const HISTORY_STATUS_TO_PRODUCTION: Record<ReceivedSareeLog["status"], StatusValueOf<"production">> = {
  "Passed QC": "qc-passed",
  "Pending QC": "qc-pending",
  "Defective": "qc-failed",
};

export function HistorySection({ liveRecords = [] }: { liveRecords?: ReceivedSareeLog[] }) {
  const [view, setView] = useState<"day" | "weaver">("day");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const { qcRecords } = useQc();

  // Real QC-inspection history — the closest genuine equivalent to a
  // "received from weaver" log this schema actually has (weight/color/photo
  // aren't recorded anywhere yet, so they're omitted rather than faked).
  const qcHistory: (ReceivedSareeLog & { sareeType?: string; isoDate?: string })[] = useMemo(() => qcRecords
    .filter(r => r.weaverId && r.weaverName)
    .map(r => ({
      id: r.sareeId,
      weaver: r.weaverName as string,
      wcode: r.weaverId as string,
      batch: r.batchId ?? "—",
      weight: "—",
      color: "—",
      date: new Date(r.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      isoDate: r.qcDate,
      status: QC_RESULT_TO_STATUS[r.result] ?? "Pending QC",
      sareeType: r.sareeTypeName ?? undefined,
    })),
  [qcRecords]);

  const allData: (ReceivedSareeLog & { sareeType?: string; isoDate?: string })[] = [
    ...liveRecords.map(r => ({ ...r, sareeType: "—" })),
    ...qcHistory,
  ];

  const filtered = allData.filter(h =>
    matchesDateFilter(h.isoDate || h.date, dateFilter) &&
    (!search ||
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.weaver.toLowerCase().includes(search.toLowerCase()) ||
    h.batch.toLowerCase().includes(search.toLowerCase()) ||
    h.color.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by date
  const byDay: Record<string, typeof filtered> = {};
  filtered.forEach(h => { if (!byDay[h.date]) byDay[h.date] = []; byDay[h.date].push(h); });

  // Group by weaver
  const byWeaver: Record<string, typeof filtered> = {};
  filtered.forEach(h => { if (!byWeaver[h.weaver]) byWeaver[h.weaver] = []; byWeaver[h.weaver].push(h); });

  const SareeRow = ({ h, last }: { h: typeof filtered[0]; last: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: last ? "none" : `1px solid rgba(110,15,45,0.06)` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{h.id}</span>
          <StatusPill taxonomy="production" status={HISTORY_STATUS_TO_PRODUCTION[h.status]} size="sm" />
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
    <div style={{ margin: "24px 0 0" }}>
      <SectionCard
        icon={History}
        title="Received History"
        subtitle="Every saree recorded from weavers, grouped by day or by weaver."
        actions={
          <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: 3 }}>
            {([["day", "Day Wise"], ["weaver", "Weaver Wise"]] as const).map(([key, label]) => (
              <Button key={key} variant="tertiary" size="sm" onClick={() => setView(key)}
                className={view === key
                  ? "rounded-[7px] bg-white/90 !text-[#4A061B] hover:!bg-white"
                  : "rounded-[7px] bg-transparent !text-[rgba(255,253,249,0.80)] hover:!bg-white/10 hover:!text-white"}>
                {label}
              </Button>
            ))}
          </div>
        }
      >
      {/* Filters */}
      <div style={{ marginBottom: 12 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saree ID, weaver, batch…"
          iconLeft={Search} className="w-full" />
      </div>

      {/* Grouped list */}
      <div>
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
      </SectionCard>
    </div>
  );
}
