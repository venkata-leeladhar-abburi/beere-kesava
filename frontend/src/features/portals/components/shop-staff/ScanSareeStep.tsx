import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { List, Plus, Trash2 } from "lucide-react";
import { C, F, Card } from "./theme";
import { sareeTypeName, sareeTypeText } from "./stock-format";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Button, CurrencyInput } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { StepHeader, StepBody, FlowActions, ScanPanel, ACCENT_SALE } from "./flow-kit";
import type { ShopStockItem } from "../../../../shared/api/inventory";
import { cartTotal, type SaleLine } from "./sale-cart";

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
  /** Sets what one basket line is actually selling for. Priced here, at the
   *  moment the saree is picked, rather than a step later. */
  setLinePrice: (id: string, price: number) => void;
  scanError?: string | null;
  availableSarees: ShopStockItem[];
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
  setLinePrice,
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

  // Same shape as the Shop Inventory table — saree type (code + name), the
  // retail price the admin set on that type, and no design column, so staff
  // read one set of columns whether they are checking stock or selling it.
  const columns: ColumnDef<ShopStockItem>[] = useMemo(() => [
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: r => r.sareeId,
    },
    {
      id: "sareeType", header: "Saree Type", priority: 1, sortable: true,
      accessor: r => sareeTypeText(r),
      cell: (_v, r) => {
        const name = sareeTypeName(r);
        return (
          <span>
            {r.sareeTypeCode ? <span style={{ fontFamily: F.m, color: C.burg }}>{r.sareeTypeCode}</span> : null}
            {r.sareeTypeCode && name ? <span style={{ color: C.muted }}> · </span> : null}
            {name ?? (r.sareeTypeCode ? null : "—")}
          </span>
        );
      },
    },
    {
      id: "retailPrice", header: "Retail Price", type: "currency", priority: 1, sortable: true,
      accessor: r => r.retailPrice,
      cell: (_v, r) => r.retailPrice != null
        ? <span style={{ fontFamily: F.m, fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums" }}>{formatMoney(rupees(r.retailPrice))}</span>
        : <span style={{ color: C.muted }}>—</span>,
    },
    {
      id: "weaver", header: "Weaver / Loom", priority: 2, sortable: true,
      accessor: r => r.weaverName ?? (r.loomNumber ? `Loom ${r.loomNumber}` : "—"),
    },
    {
      id: "received", header: "Received", type: "date", priority: 3, sortable: true,
      accessor: r => r.dispatch.dispatchDate,
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
          subtitle="Scan each saree in turn, or tick them off in the stock list. Every saree comes in at its retail price — adjust any of them here before moving to payment."
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

        {/* ── The basket ──
            Priced here rather than a step later: the operator picks a saree
            and immediately says what it is selling for, while the customer is
            standing in front of them haggling over that exact piece. The
            payment step then only has to confirm the total. */}
        {cart.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ marginTop: 18, overflow: "hidden" }}>
              <div style={{ height: 4, background: C.burg }} />
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                  {cart.length} saree{cart.length !== 1 ? "s" : ""} in this sale
                </span>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                  Edit any price to give a discount
                </span>
              </div>

              {cart.map((l, i) => {
                const changed = l.soldPrice !== l.originalPrice;
                return (
                  <div
                    key={l.id}
                    style={{
                      display: isMobile ? "block" : "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px",
                      borderBottom: i < cart.length - 1 ? `1px solid ${C.bdr}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{l.id}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {l.type !== "—" ? l.type : l.name}
                        {l.weaver && l.weaver !== "—" ? ` · ${l.weaver}` : ""}
                      </div>
                    </div>

                    <div style={{ width: isMobile ? "100%" : 190, flexShrink: 0, marginTop: isMobile ? 10 : 0 }}>
                      <label htmlFor={`price-${l.id}`} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" as const, display: "block", marginBottom: 4 }}>
                        Selling price
                      </label>
                      <CurrencyInput
                        id={`price-${l.id}`}
                        value={l.soldPrice}
                        onValueChange={v => setLinePrice(l.id, v === "" ? 0 : v)}
                        size="lg"
                        className="w-full font-bold"
                      />
                      <div style={{ fontFamily: F.u, fontSize: 11.5, color: changed ? C.gold : C.muted, marginTop: 4 }}>
                        Retail: {formatMoney(rupees(l.originalPrice))}
                        {changed ? ` · ${l.soldPrice < l.originalPrice ? "discounted" : "marked up"}` : ""}
                      </div>
                    </div>

                    <Button
                      variant="tertiary" size="sm" iconLeft={Trash2}
                      aria-label={`Remove ${l.id} from this sale`}
                      onClick={() => removeLine(l.id)}
                      className="flex-shrink-0 text-[#AB3832]"
                    >
                      {isMobile ? "" : "Remove"}
                    </Button>
                  </div>
                );
              })}

              <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Basket total</span>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 26, color: C.burg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                  {formatMoney(rupees(cartTotal(cart)))}
                </span>
              </div>
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
                pagination
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
