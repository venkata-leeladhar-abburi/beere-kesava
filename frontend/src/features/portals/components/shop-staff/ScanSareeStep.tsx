import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { List, Plus, Trash2 } from "lucide-react";
import { C, F, Card } from "./theme";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { StepHeader, StepBody, FlowActions, ScanPanel, ACCENT_SALE } from "./flow-kit";
import type { BackendStockItem } from "../../../../shared/api/inventory";
import type { SaleLine } from "./sale-cart";

interface ScanSareeStepProps {
  /** Sarees already in the basket. */
  cart: SaleLine[];
  manualId: string;
  setManualId: (v: string) => void;
  isMobile?: boolean;
  /** Adds one saree by scanned/typed id. */
  handleScan: (overrideId?: string) => void;
  /** Adds every id ticked in the stock table, in one pass. */
  handleAddSarees: (ids: string[]) => Promise<void> | void;
  removeLine: (id: string) => void;
  scanError?: string | null;
  availableSarees: BackendStockItem[];
  sareesLoading?: boolean;
  showSareeList: boolean;
  setShowSareeList: (v: boolean) => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function ScanSareeStep({
  cart,
  manualId,
  setManualId,
  isMobile,
  handleScan,
  handleAddSarees,
  removeLine,
  scanError,
  availableSarees,
  sareesLoading,
  showSareeList,
  setShowSareeList,
  isFiltered,
  onClearFilters,
  onBack,
  onNext,
}: ScanSareeStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // A saree already in the basket must not be offered again — selling the
  // same piece twice on one bill is not a thing the loom can honour.
  const inCart = useMemo(() => new Set(cart.map(l => l.id)), [cart]);
  const selectable = useMemo(
    () => availableSarees.filter(s => !inCart.has(s.sareeId)),
    [availableSarees, inCart],
  );

  const columns: ColumnDef<BackendStockItem>[] = useMemo(() => [
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: r => r.sareeId,
    },
    {
      id: "design", header: "Design", priority: 2, sortable: true,
      accessor: r => r.designCode ?? "—",
    },
    {
      id: "type", header: "Type", priority: 2, sortable: true,
      accessor: r => r.sareeTypeLabel ?? "—",
      cell: (_v, r) => (
        <span>
          {r.sareeTypeLabel ?? "—"}
          {r.sareeTypeCode ? <span style={{ color: C.muted }}> · {r.sareeTypeCode}</span> : null}
        </span>
      ),
    },
    {
      id: "weaver", header: "Weaver / Loom", priority: 2, sortable: true,
      accessor: r => r.weaverName ?? (r.loomNumber ? `Loom ${r.loomNumber}` : "—"),
    },
    {
      id: "source", header: "Source", type: "badge", priority: 3, sortable: true,
      accessor: r => r.source,
      cell: v => <span style={{ textTransform: "capitalize" as const }}>{String(v)}</span>,
    },
  ], []);

  const addSelected = async () => {
    if (selected.size === 0 || adding) return;
    setAdding(true);
    try {
      await handleAddSarees([...selected]);
      setSelected(new Set());
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <StepBody>
        <StepHeader
          title="Which sarees?"
          subtitle="Scan each saree in turn, or tick them off in the stock list — add as many as the customer is buying."
        />

        <ScanPanel
          accent={ACCENT_SALE}
          title="Scan Saree Barcode"
          hint="Scan a tag to add it to this sale. Keep scanning to add more."
          value={manualId}
          onValueChange={v => { setManualId(v); setShowSareeList(true); }}
          onSubmit={overrideId => handleScan(overrideId)}
          error={scanError}
        />

        {/* ── The basket ── */}
        {cart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ marginTop: 18, overflow: "hidden" }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)" }}>
                <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                  {cart.length} saree{cart.length !== 1 ? "s" : ""} in this sale
                </span>
              </div>
              {cart.map((l, i) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    borderBottom: i < cart.length - 1 ? `1px solid ${C.bdr}` : "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{l.id}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {l.name}{l.design && l.design !== "—" ? ` · ${l.design}` : ""}
                    </div>
                  </div>
                  {!isMobile && (
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, flexShrink: 0 }}>{l.weaver}</div>
                  )}
                  <Button
                    variant="tertiary" size="sm" iconLeft={Trash2}
                    aria-label={`Remove ${l.id} from this sale`}
                    onClick={() => removeLine(l.id)}
                    className="flex-shrink-0 text-[#AB3832]"
                  >
                    {isMobile ? "" : "Remove"}
                  </Button>
                </div>
              ))}
            </Card>
          </motion.div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.bdr }} />
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>or pick from sarees in stock</span>
          <div style={{ flex: 1, height: 1, background: C.bdr }} />
        </div>

        {!showSareeList ? (
          <Button
            variant="secondary" fullWidth iconLeft={List} onClick={() => setShowSareeList(true)}
            className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.30)] bg-transparent text-[#6E0F2D]"
          >
            Browse All Sarees ({selectable.length} in stock)
          </Button>
        ) : (
          <div
            style={{
              background: C.white, border: `1.5px solid ${C.burg}`, borderRadius: 14,
              boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                {sareesLoading
                  ? "Loading…"
                  : isFiltered
                    ? `${selectable.length} result${selectable.length !== 1 ? "s" : ""} for "${manualId.trim()}"`
                    : `${selectable.length} Available in Stock`}
              </span>
              <Button variant="link" onClick={() => setShowSareeList(false)} className="p-0 text-xs text-[#69635E] underline">
                Hide
              </Button>
            </div>

            <div style={{ maxHeight: 420, overflowY: "auto" as const }}>
              <DataTable
                columns={columns}
                data={selectable}
                getRowId={r => r.sareeId}
                caption="Sarees dispatched to this shop and still unsold"
                density="compact"
                responsive
                loading={sareesLoading}
                selectedIds={selected}
                onSelectionChange={setSelected}
                isFiltered={isFiltered}
                onClearFilters={onClearFilters}
                emptyTitle="No sarees in shop stock"
                emptyDescription="Everything dispatched to this shop has been sold. Ask an admin to dispatch more stock over."
              />
            </div>

            <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                {selected.size > 0 ? `${selected.size} selected` : "Tick the sarees the customer is buying"}
              </span>
              <Button
                variant="primary" iconLeft={Plus}
                onClick={addSelected}
                disabled={selected.size === 0 || adding}
                loading={adding}
              >
                {adding ? "Adding…" : `Add ${selected.size || ""} to sale`.replace("  ", " ")}
              </Button>
            </div>
          </div>
        )}
      </StepBody>

      <FlowActions
        accent={ACCENT_SALE}
        onBack={onBack}
        primaryLabel={cart.length > 1 ? `Next — Payment (${cart.length} sarees)` : "Next — Payment"}
        onPrimary={onNext}
        primaryDisabled={cart.length === 0}
        hint={cart.length === 0 ? "Add at least one saree before continuing" : undefined}
      />
    </>
  );
}
