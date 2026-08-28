import React, { useEffect, useMemo, useState } from "react";
import { Search, Factory, Check, PackageSearch } from "lucide-react";
import { C, F } from "../tokens";
import { type WeaverBatchData } from "./weaversData";
import { Button, SearchInput } from "../../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";

// ─── Receive Sarees — recipient (weaver / factory loom) + batch picker ───────
// One selection surface shared by both Receive tabs. It replaces the two bare
// <Select> dropdowns that showed a name and nothing else: here every option
// carries its human-facing id, its looms/operator and its pending-saree count,
// is searchable by name *or* id, and the chosen batch is picked from cards that
// state exactly what is in them.

export interface RecipientOption {
  id: string;
  /** Human-facing code — "Ramarao-001" / "Loom-003". Always displayed. */
  code: string;
  /** Primary display name — weaver name, or the loom's own number. */
  name: string;
  /** Secondary line — village · looms, or location · operator. */
  subtitle?: string;
  avatar: string;
  /** Weaver's own loom count; drives the loom-number chips. Omitted for looms. */
  looms?: number;
  status?: string;
}

const CHIP: React.CSSProperties = {
  fontFamily: F.u, fontSize: 12, fontWeight: 600, borderRadius: 999,
  padding: "3px 10px", whiteSpace: "nowrap",
};

function countPending(b: WeaverBatchData) {
  return b.sarees.filter(s => s.status === "pending").length;
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#FFFFFF", border: `1px solid ${C.bdr}`, borderRadius: 18,
      boxShadow: "0 2px 12px rgba(74,6,27,0.07)", padding: 16, ...style,
    }}>
      {children}
    </div>
  );
}

function StepHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>{step}</span>
      </div>
      <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.wine }}>{title}</span>
      {hint && <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{hint}</span>}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "18px 14px", textAlign: "center", background: C.bg, border: `1px dashed ${C.bdrMed}`, borderRadius: 12 }}>
      <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{children}</span>
    </div>
  );
}

/** Row in the searchable recipient list. */
function RecipientRow({
  option, pendingCount, batchCount, isSelected, onSelect, kind,
}: {
  option: RecipientOption; pendingCount: number; batchCount: number;
  isSelected: boolean; onSelect: () => void; kind: "weaver" | "loom";
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: "100%", textAlign: "left", padding: "11px 13px",
        display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
        background: isSelected ? "rgba(110,15,45,0.06)" : "#FFF",
        border: "none", borderBottom: `1px solid ${C.bdr}`,
      }}
      className="transition-colors hover:bg-[#FBF6EE]"
    >
      <div style={{ width: 36, height: 36, borderRadius: kind === "loom" ? 11 : "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {kind === "loom"
          ? <Factory size={16} color="#FFF" />
          : <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{option.avatar}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.text }}>{option.name}</span>
          <EntityCode type={kind === "loom" ? "loom" : "weaver"} value={option.code} size="sm" />
        </div>
        {option.subtitle && (
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {option.subtitle}
          </div>
        )}
      </div>
      <span style={{
        ...CHIP, flexShrink: 0,
        color: pendingCount > 0 ? "#8D5802" : C.muted,
        background: pendingCount > 0 ? "rgba(200,155,71,0.14)" : "rgba(105,99,94,0.08)",
        border: `1px solid ${pendingCount > 0 ? "rgba(200,155,71,0.30)" : C.bdr}`,
      }}>
        {pendingCount > 0 ? `${pendingCount} awaiting · ${batchCount} batch${batchCount === 1 ? "" : "es"}` : "Nothing pending"}
      </span>
      {isSelected && <Check size={16} color={C.burg} style={{ flexShrink: 0 }} />}
    </button>
  );
}

/** The chosen recipient, restated with every id visible. */
function SelectedSummary({
  option, kind, pendingCount, batchCount, onChange,
}: {
  option: RecipientOption; kind: "weaver" | "loom";
  pendingCount: number; batchCount: number; onChange: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap",
      background: "linear-gradient(135deg, #FFFDF9 0%, #FDF6EA 100%)",
      border: `1.5px solid ${C.bdrMed}`, borderRadius: 14, padding: "13px 15px",
    }}>
      <div style={{ width: 44, height: 44, borderRadius: kind === "loom" ? 13 : "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {kind === "loom"
          ? <Factory size={20} color="#FFF" />
          : <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: "#FFF" }}>{option.avatar}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.wine }}>{option.name}</span>
          <EntityCode type={kind === "loom" ? "loom" : "weaver"} value={option.code} size="sm" copyable />
        </div>
        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>
          {option.subtitle ? `${option.subtitle} · ` : ""}
          {pendingCount} saree{pendingCount === 1 ? "" : "s"} awaiting receipt in {batchCount} batch{batchCount === 1 ? "" : "es"}
        </div>
      </div>
      <Button onClick={onChange} variant="secondary" size="sm" className="shrink-0">Change</Button>
    </div>
  );
}

/** Batch cards — the id, saree type, bulk order, loom and progress, all stated. */
function BatchPicker({
  batches, selectedBatchId, onPickBatch, emptyLabel,
}: {
  batches: WeaverBatchData[]; selectedBatchId: string | null;
  onPickBatch: (id: string) => void; emptyLabel: string;
}) {
  if (batches.length === 0) return <EmptyNote>{emptyLabel}</EmptyNote>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
      {batches.map(b => {
        const done = b.sarees.filter(s => s.status !== "pending").length;
        const pending = countPending(b);
        const active = selectedBatchId === b.id;
        const pct = b.total > 0 ? (done / b.total) * 100 : 0;
        return (
          <button
            type="button"
            key={b.id}
            onClick={() => onPickBatch(b.id)}
            aria-pressed={active}
            style={{
              textAlign: "left", padding: "12px 13px", cursor: "pointer",
              background: active ? "linear-gradient(135deg, #FFFDF9 0%, #FDF3E4 100%)" : "#FFF",
              border: `1.5px solid ${active ? C.burg : C.bdr}`,
              borderRadius: 14,
              boxShadow: active ? "0 4px 16px rgba(110,15,45,0.12)" : "none",
            }}
            className="transition-all hover:border-[rgba(110,15,45,0.35)]"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
              <EntityCode type="batch" value={b.id} size="sm" />
              <span style={{
                ...CHIP, fontSize: 11,
                color: pending === 0 ? C.green : "#8D5802",
                background: pending === 0 ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.14)",
                border: `1px solid ${pending === 0 ? "rgba(30,102,64,0.22)" : "rgba(200,155,71,0.30)"}`,
              }}>
                {pending === 0 ? "All received" : `${pending} pending`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "2px 8px" }}>
                {b.sareeTypeCode}
              </span>
              {b.loomNumber != null && (
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, background: "rgba(110,15,45,0.07)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "2px 8px" }}>
                  Loom {b.loomNumber}
                </span>
              )}
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 8 }}>
              {b.bulkOrderLabel ? `${b.bulkOrderLabel} · ` : ""}{done} of {b.total} received
            </div>
            <div style={{ background: "#F0EBE4", borderRadius: 999, height: 5, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ReceiveRecipientPicker({
  kind,
  options,
  batchesByRecipient,
  selectedId,
  onPickRecipient,
  selectedBatchId,
  onPickBatch,
  loading,
}: {
  kind: "weaver" | "loom";
  options: RecipientOption[];
  /** recipient id → its pending batches. */
  batchesByRecipient: Record<string, WeaverBatchData[]>;
  selectedId: string | null;
  onPickRecipient: (id: string) => void;
  selectedBatchId: string | null;
  onPickBatch: (id: string) => void;
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [loomFilter, setLoomFilter] = useState<number | "all">("all");

  const selected = options.find(o => o.id === selectedId) ?? null;
  const selectedKey = selected?.id ?? null;
  const allBatches = useMemo(
    () => (selectedKey ? (batchesByRecipient[selectedKey] ?? []) : []),
    [batchesByRecipient, selectedKey],
  );

  // Loom-number chips, exactly as Issue Materials does it — but only for the
  // loom numbers this weaver actually has pending work on, so a chip is never
  // an empty filter.
  const loomNumbers = useMemo(() => {
    const set = new Set<number>();
    for (const b of allBatches) {
      for (const s of b.sarees) {
        const n = s.weaverLoom ?? b.loomNumber;
        if (typeof n === "number") set.add(n);
      }
      if (typeof b.loomNumber === "number") set.add(b.loomNumber);
    }
    return [...set].sort((a, b) => a - b);
  }, [allBatches]);

  const visibleBatches = useMemo(() => {
    if (loomFilter === "all") return allBatches;
    return allBatches.filter(b =>
      b.loomNumber === loomFilter || b.sarees.some(s => s.weaverLoom === loomFilter));
  }, [allBatches, loomFilter]);

  // Reset the loom filter whenever the recipient changes, and drop it if it
  // stops matching anything so the batch list can never render empty by
  // accident.
  useEffect(() => { setLoomFilter("all"); }, [selectedId]);
  useEffect(() => {
    if (loomFilter !== "all" && !loomNumbers.includes(loomFilter)) setLoomFilter("all");
  }, [loomNumbers, loomFilter]);

  // Keep the batch selection real: if nothing is chosen, or the chosen batch is
  // not in the visible list, select the first visible one. Without this the
  // batch control read "Select…" while the table below already showed batch #1.
  useEffect(() => {
    if (visibleBatches.length === 0) return;
    if (!selectedBatchId || !visibleBatches.some(b => b.id === selectedBatchId)) {
      onPickBatch(visibleBatches[0].id);
    }
  }, [visibleBatches, selectedBatchId, onPickBatch]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? options.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        (o.subtitle ?? "").toLowerCase().includes(q))
    : options;

  const pendingFor = (id: string) =>
    (batchesByRecipient[id] ?? []).reduce((sum, b) => sum + countPending(b), 0);

  const showList = !selected || listOpen;
  const entityWord = kind === "loom" ? "factory loom" : "weaver";

  return (
    <div style={{ margin: "12px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel>
        <StepHeading
          step={1}
          title={kind === "loom" ? "Select Factory Loom" : "Select Weaver"}
          hint={loading ? "Loading…" : `${options.length} available`}
        />

        {selected && !listOpen && (
          <SelectedSummary
            option={selected}
            kind={kind}
            pendingCount={pendingFor(selected.id)}
            batchCount={allBatches.length}
            onChange={() => { setListOpen(true); setSearch(""); }}
          />
        )}

        {showList && (
          <>
            <SearchInput
              aria-label={`Search ${entityWord} by name or ID`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={setSearch}
              placeholder={kind === "loom" ? "Search loom by number, ID or operator…" : "Search weaver by name or ID…"}
              size="lg"
              className="w-full"
            />
            <div style={{ marginTop: 10, border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
              {loading ? (
                <EmptyNote>Loading {entityWord}s…</EmptyNote>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "22px 14px", textAlign: "center" }}>
                  <Search size={18} color={C.muted} />
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 6 }}>
                    No {entityWord} matches “{search}”.
                  </div>
                </div>
              ) : filtered.map(o => (
                <RecipientRow
                  key={o.id}
                  option={o}
                  kind={kind}
                  pendingCount={pendingFor(o.id)}
                  batchCount={(batchesByRecipient[o.id] ?? []).length}
                  isSelected={o.id === selectedId}
                  onSelect={() => { onPickRecipient(o.id); setListOpen(false); setSearch(""); }}
                />
              ))}
            </div>
            {selected && (
              <div style={{ marginTop: 10, textAlign: "right" }}>
                <Button variant="link" size="sm" onClick={() => { setListOpen(false); setSearch(""); }}>Cancel</Button>
              </div>
            )}
          </>
        )}

        {!loading && options.length === 0 && !showList && (
          <EmptyNote>No {entityWord}s have been set up yet.</EmptyNote>
        )}
      </Panel>

      {selected && !listOpen && kind === "weaver" && loomNumbers.length > 1 && (
        <Panel>
          <StepHeading step={2} title="Filter by Loom Number" hint="optional" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              onClick={() => setLoomFilter("all")}
              variant={loomFilter === "all" ? "primary" : "secondary"}
              size="sm"
            >
              All looms
            </Button>
            {loomNumbers.map(n => (
              <Button
                key={n}
                onClick={() => setLoomFilter(n)}
                variant={loomFilter === n ? "primary" : "secondary"}
                size="sm"
              >
                Loom {n}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      {selected && !listOpen && (
        <Panel>
          <StepHeading
            step={kind === "weaver" && loomNumbers.length > 1 ? 3 : 2}
            title="Select Batch"
            hint={visibleBatches.length > 0 ? `${visibleBatches.length} open` : undefined}
          />
          {allBatches.length === 0 ? (
            <div style={{ padding: "18px 14px", textAlign: "center", background: C.bg, border: `1px dashed ${C.bdrMed}`, borderRadius: 12 }}>
              <PackageSearch size={20} color={C.muted} />
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginTop: 6 }}>
                Nothing awaiting receipt
              </div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>
                {selected.name} ({selected.code}) has no sarees pending receipt right now.
              </div>
            </div>
          ) : (
            <BatchPicker
              batches={visibleBatches}
              selectedBatchId={selectedBatchId}
              onPickBatch={onPickBatch}
              emptyLabel={`No open batch on Loom ${loomFilter}. Choose another loom.`}
            />
          )}
        </Panel>
      )}
    </div>
  );
}

