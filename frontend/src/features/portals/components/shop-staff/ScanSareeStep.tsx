import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Layers, PackageCheck, Plus, Trash2 } from "lucide-react";
import { C, F, Card } from "./theme";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Button, CurrencyInput, Input, NumberInput, Switch } from "../../../../shared/ui/primitives";
import { MoneyAccessProvider } from "../../../../shared/ui/MoneyAccess";
import { WeaverSareesSection, salePickRule } from "@/features/weavers";
import { StepHeader, StepBody, FlowActions, ScanPanel, ACCENT_SALE } from "./flow-kit";
import { ReceivedSareesPicker, useReceivedShopStock } from "./ReceivedSareesPicker";
import {
  cartTotal, cartOriginalTotal, billDiscountAmount, gstBreakdown, gstIssue, normalizeGstin,
  GST_RATE_PRESETS, GST_MAX_RATE,
  type SaleLine, type DiscountMode, type BillDiscount, type BillGst,
} from "./sale-cart";

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
  /** Sets the discount on one basket line (₹ off or % off); the selling
   *  price is recomputed from the retail price. Priced here, at the moment
   *  the saree is picked, rather than a step later. */
  setLineDiscount: (id: string, mode: DiscountMode, value: number) => void;
  /** Discount on the whole bill, taken off after the per-saree discounts. */
  billDiscount: BillDiscount;
  setBillDiscount: (d: BillDiscount) => void;
  /** Optional GST on the whole bill, added on top after every discount. */
  gst: BillGst;
  setGst: (g: BillGst) => void;
  scanError?: string | null;
  showSareeList: boolean;
  setShowSareeList: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Which list the stock picker shows: pieces this shop has received from a
 *  dispatch (its own shelf), or the whole-company All Sarees table. */
type StockSource = "received" | "all";

const labelStyle = {
  fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted,
  letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 4,
};

export function ScanSareeStep({
  cart,
  manualId,
  setManualId,
  isMobile,
  handleScan,
  handleAddSarees,
  removeLine,
  setLineDiscount,
  billDiscount,
  setBillDiscount,
  gst,
  setGst,
  scanError,
  showSareeList,
  setShowSareeList,
  onBack,
  onNext,
}: ScanSareeStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [source, setSource] = useState<StockSource>("received");

  // The stock list is the admin Inventory page's All Sarees table, rendered
  // with the counter-sale rule: a saree can be ticked when it is QC-passed (or
  // an external purchase), unsold, not gone to a wholesale customer and not
  // already on this bill — factory stock included, no SHOP dispatch needed.
  const inCart = useMemo(() => new Set(cart.map(l => l.id)), [cart]);
  const pickRule = useMemo(() => salePickRule(inCart), [inCart]);
  const { available: receivedAvailable, isLoading: receivedLoading } = useReceivedShopStock(inCart);

  // A tick only means something in the list it was made in — switching lists
  // clears it, so nothing is added from rows the operator can no longer see.
  const openList = (next: StockSource) => {
    if (next !== source) setSelected(new Set());
    setSource(next);
    setShowSareeList(true);
  };

  const toggleRow = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = (ids: string[]) => setSelected(prev => {
    const allSelected = ids.length > 0 && ids.every(id => prev.has(id));
    const next = new Set(prev);
    ids.forEach(id => (allSelected ? next.delete(id) : next.add(id)));
    return next;
  });

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
          onValueChange={setManualId}
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
                  Choose ₹ or % and enter a discount — the final price updates
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
                        {l.weight && l.weight !== "—" ? ` · ${l.weight}` : ""}
                      </div>
                      {l.batchId && l.batchId !== "—" && (
                        <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>
                          Batch {l.batchId}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" as const, marginTop: isMobile ? 10 : 0, flexShrink: 0 }}>
                      <div style={{ minWidth: 96 }}>
                        <div style={labelStyle}>Retail price</div>
                        <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 15, color: C.text, fontVariantNumeric: "tabular-nums", height: 40, display: "flex", alignItems: "center" }}>
                          {formatMoney(rupees(l.originalPrice))}
                        </div>
                      </div>

                      <div>
                        <div style={labelStyle}>Discount</div>
                        <DiscountControl
                          label={l.id}
                          mode={l.discountMode}
                          value={l.discountValue}
                          onChange={(mode, value) => setLineDiscount(l.id, mode, value)}
                        />
                      </div>

                      <div style={{ minWidth: 110, textAlign: isMobile ? "left" as const : "right" as const }}>
                        <div style={labelStyle}>Final price</div>
                        <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 17, color: C.burg, fontVariantNumeric: "tabular-nums", height: 40, display: "flex", alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                          {formatMoney(rupees(l.soldPrice))}
                        </div>
                        {changed && (
                          <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.gold, marginTop: -2 }}>
                            You save {formatMoney(rupees(l.originalPrice - l.soldPrice))}
                          </div>
                        )}
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

              {/* ── Whole-bill discount ──
                  On top of the per-saree discounts above: ₹ or % off the
                  basket's total, e.g. a round-off or a festival offer. */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Discount on total bill</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Applied after the saree discounts above</div>
                </div>
                <DiscountControl
                  label="the total bill"
                  mode={billDiscount.mode}
                  value={billDiscount.value}
                  onChange={(mode, value) => setBillDiscount({ mode, value })}
                />
              </div>

              {/* ── GST ──
                  Off by default — most counter sales carry none. When the
                  customer wants a GST bill, the rate is charged on the amount
                  left after every discount and added on top. */}
              <GstControl gst={gst} setGst={setGst} isMobile={isMobile} />

              {(() => {
                const retail = cartOriginalTotal(cart);
                const subtotal = cartTotal(cart);
                const billOff = billDiscountAmount(subtotal, billDiscount);
                const taxable = subtotal - billOff;
                const tax = gstBreakdown(taxable, gst);
                const showRows = retail !== subtotal || billOff > 0 || tax !== null;
                const row = (label: string, value: string, color: string = C.muted) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", color }}>
                    <span>{label}</span><span>{value}</span>
                  </div>
                );
                return (
                  <>
                    {showRows && (
                      <div style={{ padding: "10px 16px 0", borderTop: `1px solid ${C.bdr}`, display: "flex", flexDirection: "column" as const, gap: 4, fontFamily: F.u, fontSize: 13, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                        {row("Retail total", formatMoney(rupees(retail)))}
                        {retail !== subtotal && row(retail > subtotal ? "Saree discounts" : "Saree mark-ups", `${retail > subtotal ? "−" : "+"} ${formatMoney(rupees(Math.abs(retail - subtotal)))}`, C.gold)}
                        {billOff > 0 && retail !== subtotal && row("Subtotal", formatMoney(rupees(subtotal)))}
                        {billOff > 0 && row(`Bill discount${billDiscount.mode === "percent" ? ` (${billDiscount.value}%)` : ""}`, `− ${formatMoney(rupees(billOff))}`, C.gold)}
                        {tax && row("Taxable value", formatMoney(rupees(tax.taxable)))}
                        {tax && row(`CGST @ ${tax.rate / 2}%`, `+ ${formatMoney(rupees(tax.cgst))}`, C.text)}
                        {tax && row(`SGST @ ${tax.rate / 2}%`, `+ ${formatMoney(rupees(tax.sgst))}`, C.text)}
                      </div>
                    )}
                    <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: showRows ? 10 : 0 }}>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>
                        Final amount{tax ? <span style={{ fontWeight: 400, fontSize: 13, color: C.muted }}> (incl. {tax.rate}% GST)</span> : null}
                      </span>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 26, color: C.burg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                        {formatMoney(rupees(tax ? tax.total : taxable))}
                      </span>
                    </div>
                  </>
                );
              })()}
            </Card>
          </motion.div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.bdr }} />
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>or pick from sarees in stock</span>
          <div style={{ flex: 1, height: 1, background: C.bdr }} />
        </div>

        {!showSareeList ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Button
              variant="secondary" fullWidth iconLeft={PackageCheck} onClick={() => openList("received")}
              className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.30)] bg-transparent text-[#6E0F2D]"
            >
              {receivedLoading ? "Received at This Shop" : `Received at This Shop (${receivedAvailable.length})`}
            </Button>
            <Button
              variant="secondary" fullWidth iconLeft={Layers} onClick={() => openList("all")}
              className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.30)] bg-transparent text-[#6E0F2D]"
            >
              Browse All Sarees
            </Button>
          </div>
        ) : (
          <div
            style={{
              background: C.white, border: `1.5px solid ${C.burg}`, borderRadius: 14,
              boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
              <div
                role="tablist"
                aria-label="Which sarees to list"
                style={{ display: "inline-flex", gap: 4, padding: 3, borderRadius: 999, background: "rgba(110,15,45,0.06)", border: `1px solid ${C.bdr}`, maxWidth: "100%", overflowX: "auto" as const }}
              >
                {([
                  { key: "received", label: "Received at this shop", count: receivedLoading ? undefined : receivedAvailable.length },
                  { key: "all", label: "All sarees", count: undefined },
                ] as const).map(o => {
                  const on = source === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => openList(o.key)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" as const,
                        padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                        background: on ? C.burg : "transparent", color: on ? "#FFFDF9" : C.muted,
                        fontFamily: F.u, fontSize: 12.5, fontWeight: 700,
                      }}
                    >
                      {o.label}
                      {o.count != null && (
                        <span style={{
                          fontFamily: F.m, fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                          background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.08)", color: on ? "#FFFDF9" : C.burg,
                        }}>{o.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button variant="link" onClick={() => setShowSareeList(false)} className="p-0 text-xs text-[#69635E] underline">
                Hide
              </Button>
            </div>

            {/* Money is never shown to shop staff — weaver pay, making charge
                and QC deductions stay admin-only, same as the data behind it. */}
            <div style={{ padding: 14, overflowX: "auto" }}>
              {source === "received" ? (
                <ReceivedSareesPicker inCart={inCart} selectedIds={selected} onSelectionChange={setSelected} />
              ) : (
                <MoneyAccessProvider allowed={false}>
                  <WeaverSareesSection
                    ownerType="all"
                    selectable
                    selectedIds={selected}
                    onToggleRow={toggleRow}
                    onToggleAll={toggleAll}
                    pickRule={pickRule}
                  />
                </MoneyAccessProvider>
              )}
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
        primaryDisabled={cart.length === 0 || gstIssue(gst) !== null}
        hint={cart.length === 0 ? "Add at least one saree before continuing" : gstIssue(gst) ?? undefined}
      />
    </>
  );
}

/** ₹ / % toggle plus the value box — the same control for a saree's own
 *  discount and for the discount on the whole bill. Switching unit clears the
 *  value, since 10 rupees and 10 percent are different discounts. */
function DiscountControl({ label, mode, value, onChange }: {
  /** What the discount applies to, for screen readers ("JJSI-552-003-01"). */
  label: string;
  mode: DiscountMode;
  value: number;
  onChange: (mode: DiscountMode, value: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <div role="radiogroup" aria-label={`Discount type for ${label}`} style={{ display: "flex", border: `1px solid ${C.bdr}`, borderRadius: 8, overflow: "hidden", height: 40 }}>
        {(["amount", "percent"] as const).map(m => {
          const on = mode === m;
          return (
            <button
              key={m} type="button" role="radio" aria-checked={on}
              aria-label={m === "amount" ? "Discount in rupees" : "Discount in percent"}
              onClick={() => { if (!on) onChange(m, 0); }}
              style={{
                width: 38, border: "none", cursor: "pointer",
                fontFamily: F.u, fontWeight: 700, fontSize: 14,
                background: on ? C.burg : "transparent",
                color: on ? "#fff" : C.muted,
              }}
            >
              {/* eslint-disable-next-line no-restricted-syntax -- a unit toggle label, not a money value */}
              {m === "amount" ? "₹" : "%"}
            </button>
          );
        })}
      </div>
      <div style={{ width: 110 }}>
        {mode === "amount" ? (
          <CurrencyInput
            key={`${label}-amount`}
            aria-label={`Discount amount for ${label}`}
            value={value || ""}
            onValueChange={v => onChange("amount", v === "" ? 0 : v)}
            placeholder="0"
            className="w-full"
          />
        ) : (
          <NumberInput
            key={`${label}-percent`}
            aria-label={`Discount percent for ${label}`}
            value={value || ""}
            onValueChange={v => onChange("percent", v === "" ? 0 : v)}
            min={0} max={100} step={0.01}
            placeholder="0"
            addonRight="%"
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}

/** Switch to charge GST on the bill, then its rate (one-tap slabs or typed)
 *  and the buyer's GSTIN. Turning it off keeps what was typed, so flicking
 *  it back on doesn't make the operator re-enter the rate. */
function GstControl({ gst, setGst, isMobile }: {
  gst: BillGst;
  setGst: (g: BillGst) => void;
  isMobile?: boolean;
}) {
  const issue = gstIssue(gst);
  const gstinTyped = gst.gstin.trim() !== "";
  const gstinBad = gstinTyped && issue?.startsWith("GST number") === true;
  const rateBad = gst.enabled && issue !== null && !gstinBad;
  return (
    <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.bdr}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <label htmlFor="bill-gst-toggle" style={{ cursor: "pointer" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Apply GST</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
            Added on top of the amount after discounts · CGST + SGST
          </div>
        </label>
        <Switch
          id="bill-gst-toggle"
          checked={gst.enabled}
          onCheckedChange={on => setGst({ ...gst, enabled: on, rate: on && !gst.rate ? GST_RATE_PRESETS[0] : gst.rate })}
          aria-label="Apply GST on this bill"
        />
      </div>

      {gst.enabled && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto minmax(0, 1fr)", gap: 14, marginTop: 12, alignItems: "start" }}>
          <div>
            <div style={labelStyle}>GST %</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
              <div role="radiogroup" aria-label="GST slab" style={{ display: "flex", border: `1px solid ${C.bdr}`, borderRadius: 8, overflow: "hidden", height: 40 }}>
                {GST_RATE_PRESETS.map(r => {
                  const on = gst.rate === r;
                  return (
                    <button
                      key={r} type="button" role="radio" aria-checked={on}
                      onClick={() => setGst({ ...gst, rate: r })}
                      style={{
                        minWidth: 46, border: "none", cursor: "pointer", padding: "0 8px",
                        fontFamily: F.u, fontWeight: 700, fontSize: 13,
                        background: on ? C.burg : "transparent", color: on ? "#fff" : C.muted,
                      }}
                    >
                      {r}%
                    </button>
                  );
                })}
              </div>
              <div style={{ width: 110 }}>
                <NumberInput
                  aria-label="GST percentage"
                  value={gst.rate || ""}
                  onValueChange={v => setGst({ ...gst, rate: v === "" ? 0 : v })}
                  min={0} max={GST_MAX_RATE} step={0.01}
                  placeholder="0"
                  addonRight="%"
                  invalid={rateBad}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={labelStyle}>
              GST number <span style={{ textTransform: "none", fontWeight: 500, letterSpacing: 0 }}>(customer's GSTIN, optional)</span>
            </div>
            <Input
              aria-label="Customer GST number"
              value={gst.gstin}
              onChange={e => setGst({ ...gst, gstin: normalizeGstin(e.target.value).slice(0, 15) })}
              placeholder="e.g. 37ABCDE1234F1Z5"
              maxLength={15}
              autoComplete="off"
              spellCheck={false}
              invalid={gstinBad}
              className="w-full font-mono"
            />
          </div>
          {issue && (
            <div role="alert" style={{ gridColumn: "1 / -1", fontFamily: F.u, fontSize: 12.5, color: "#AB3832" }}>{issue}</div>
          )}
        </div>
      )}
    </div>
  );
}
