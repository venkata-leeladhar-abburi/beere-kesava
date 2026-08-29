import React, { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, List, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C, F, Card } from "./theme";
import { Button, Input, MultiSelect, Textarea } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import {
  Stepper, StepHeader, StepBody, FlowActions, ScanPanel, FoundBanner,
  SummaryPanel, OptionCard, ConsequenceNote, ACCENT_RETURN,
  type FlowStep, type SummaryRow,
} from "./flow-kit";
import { rupees, formatMoney } from "../../../../lib/domain/money";
import type { BackendSaleRecord } from "../../../../shared/api/sales";

interface ReturnReasonOption {
  id: string;
  label: string;
  sub: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
}

/** Saree-type lookup, so the picker can name a type rather than print a code. */
export interface SareeTypeLookup {
  code: string;
  name: string;
  retailPrice: number;
}

interface ProcessReturnRetailFlowProps {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;
  onBackToType?: () => void;
  /** Every saree picked for this return. All of them belong to one customer —
   *  the picker enforces that, because one return is one customer's return. */
  selectedSales: BackendSaleRecord[];
  toggleSale: (sareeId: string) => void;
  clearSelection: () => void;
  findError: string | null;
  retailManualId: string;
  setRetailManualId: (v: string) => void;
  handleFindSale: (overrideId?: string) => void;
  availableSales: BackendSaleRecord[];
  sareeTypes: SareeTypeLookup[];
  showSaleList: boolean;
  setShowSaleList: (v: boolean) => void;
  reason: string | null;
  setReason: (r: string | null) => void;
  otherReason: string;
  setOtherReason: (v: string) => void;
  returnReasons: ReturnReasonOption[];
  submitting?: boolean;
  submitError?: string | null;
  onConfirm: () => void;
}

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Who a sale was to. Every sale has a customer server-side, but a legacy row
 *  can arrive without the relation loaded. */
const customerOf = (s: BackendSaleRecord): string => s.customer?.name ?? "Walk-in Customer";
const customerKeyOf = (s: BackendSaleRecord): string => s.customer?.id ?? s.customerId ?? `name:${customerOf(s)}`;

export function ProcessReturnRetailFlow({
  step,
  setStep,
  onBackToType,
  selectedSales,
  toggleSale,
  clearSelection,
  findError,
  retailManualId,
  setRetailManualId,
  handleFindSale,
  availableSales,
  sareeTypes,
  showSaleList,
  setShowSaleList,
  reason,
  setReason,
  otherReason,
  setOtherReason,
  returnReasons,
  submitting,
  submitError,
  onConfirm,
}: ProcessReturnRetailFlowProps) {
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);

  const chosenReason = returnReasons.find(r => r.id === reason);
  const saleFound = selectedSales.length > 0;

  const typeByCode = useMemo(() => new Map(sareeTypes.map(t => [t.code, t])), [sareeTypes]);
  const typeTextOf = useCallback((s: BackendSaleRecord): string => {
    const code = s.saree?.sareeTypeCode ?? null;
    if (!code) return "—";
    const t = typeByCode.get(code);
    return t ? `${code} · ${t.name}` : code;
  }, [typeByCode]);

  // One return belongs to one customer. As soon as the first saree is ticked,
  // the rest of the picker is locked to that customer — mixing two customers
  // onto one return would produce refunds against the wrong purchase history.
  const lockedCustomerKey = saleFound ? customerKeyOf(selectedSales[0]) : null;
  const lockedCustomerName = saleFound ? customerOf(selectedSales[0]) : null;

  const customers = useMemo(() => {
    const byKey = new Map<string, string>();
    availableSales.forEach(s => { if (!byKey.has(customerKeyOf(s))) byKey.set(customerKeyOf(s), customerOf(s)); });
    return [...byKey.entries()]
      .map(([key, name]) => ({ value: key, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableSales]);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableSales.filter(s => {
      const matchSearch = !q
        || s.sareeId.toLowerCase().includes(q)
        || customerOf(s).toLowerCase().includes(q)
        || customerKeyOf(s).toLowerCase().includes(q)
        || typeTextOf(s).toLowerCase().includes(q)
        || s.saleRef.toLowerCase().includes(q);
      const matchCustomer = customerFilter.length === 0 || customerFilter.includes(customerKeyOf(s));
      return matchSearch && matchCustomer;
    });
  }, [availableSales, search, customerFilter, typeTextOf]);

  const selectedIds = useMemo(() => new Set(selectedSales.map(s => s.sareeId)), [selectedSales]);
  const refundTotal = selectedSales.reduce((sum, s) => sum + Number(s.amount), 0);
  const filtersActive = search.trim() !== "" || customerFilter.length > 0;

  const columns = useMemo<ColumnDef<BackendSaleRecord>[]>(() => [
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: s => s.sareeId,
      cell: (_v, s) => <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.crim }}>{s.sareeId}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", priority: 1, sortable: true,
      accessor: s => typeTextOf(s),
      cell: (_v, s) => {
        const code = s.saree?.sareeTypeCode ?? null;
        const t = code ? typeByCode.get(code) : undefined;
        return (
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
            {code ? <span style={{ fontFamily: F.m, color: C.burg }}>{code}</span> : "—"}
            {t ? <span style={{ color: C.muted }}> · {t.name}</span> : null}
          </span>
        );
      },
    },
    {
      id: "customer", header: "Sold to", priority: 1, sortable: true,
      accessor: s => customerOf(s),
      cell: (_v, s) => {
        const blocked = lockedCustomerKey != null && customerKeyOf(s) !== lockedCustomerKey;
        return (
          <span style={{ fontFamily: F.u, fontSize: 13, color: blocked ? C.muted : C.text, fontWeight: 600 }}>
            {customerOf(s)}
            {blocked && (
              <span style={{ display: "block", fontSize: 11.5, fontWeight: 400, color: C.muted, marginTop: 2 }}>
                Different customer
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "saleDate", header: "Sold on", type: "date", priority: 2, sortable: true,
      accessor: s => s.saleDate,
      cell: (_v, s) => <span style={{ fontFamily: F.u, fontSize: 13 }}>{fmtDate(s.saleDate)}</span>,
    },
    {
      id: "amount", header: "Sold For", type: "currency", priority: 1, sortable: true,
      accessor: s => Number(s.amount),
      cell: (_v, s) => (
        <span style={{ fontFamily: F.m, fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums" }}>
          {formatMoney(rupees(Number(s.amount)))}
        </span>
      ),
    },
    {
      id: "retailPrice", header: "Retail Price", type: "currency", priority: 3, sortable: true,
      accessor: s => {
        const code = s.saree?.sareeTypeCode ?? null;
        return code ? typeByCode.get(code)?.retailPrice ?? null : null;
      },
      cell: (_v, s) => {
        const code = s.saree?.sareeTypeCode ?? null;
        const price = code ? typeByCode.get(code)?.retailPrice ?? null : null;
        return price != null
          ? <span style={{ fontFamily: F.m, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{formatMoney(rupees(price))}</span>
          : <span style={{ color: C.muted }}>—</span>;
      },
    },
    {
      id: "saleRef", header: "Bill", type: "code", priority: 3, sortable: true,
      accessor: s => s.saleRef,
      cell: (_v, s) => <span style={{ fontFamily: F.m, fontSize: 11.5, color: C.muted }}>{s.saleRef}</span>,
    },
  ], [typeByCode, typeTextOf, lockedCustomerKey]);

  // "Other" needs the note actually written — otherwise the return lands in
  // the ledger with no explanation at all.
  const reasonComplete = reason !== null && (reason !== "other" || otherReason.trim() !== "");

  const steps: FlowStep[] = [
    {
      label: "Find Sale",
      summary: saleFound
        ? (selectedSales.length === 1 ? selectedSales[0].sareeId : `${selectedSales.length} sarees`)
        : undefined,
    },
    { label: "Return Reason", summary: chosenReason?.label },
    { label: "Confirm" },
  ];

  /** The pieces on this return, itemised — reused by steps 2 and 3 so the
   *  operator never loses sight of what they are returning. */
  const selectionList = (
    <Card style={{ overflow: "hidden", marginBottom: 18, border: "1px solid rgba(200,155,71,0.4)" }}>
      <div style={{ height: 4, background: C.burg }} />
      <div style={{
        padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const,
      }}>
        <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
          {selectedSales.length} saree{selectedSales.length === 1 ? "" : "s"} coming back
          {lockedCustomerName ? ` · ${lockedCustomerName}` : ""}
        </span>
      </div>
      {selectedSales.map((s, i) => (
        <div
          key={s.sareeId}
          style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12,
            padding: "12px 16px",
            borderBottom: i < selectedSales.length - 1 ? `1px solid ${C.bdr}` : "none",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{s.sareeId}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
              {typeTextOf(s)} · sold {fmtDate(s.saleDate)} · {s.saleRef}
            </div>
          </div>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {formatMoney(rupees(Number(s.amount)))}
          </span>
        </div>
      ))}
      <div style={{
        padding: "14px 16px", borderTop: `1px solid ${C.bdr}`, background: "rgba(110,15,45,0.03)",
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Total refund</span>
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 26, color: C.burg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {formatMoney(rupees(refundTotal))}
        </span>
      </div>
    </Card>
  );

  return (
    <div>
      <Stepper
        steps={steps}
        current={step as number}
        accent={ACCENT_RETURN}
        onJump={n => setStep(n as 1 | 2 | 3)}
      />

      {/* ── Step 1 — Find the original sale(s) ── */}
      {step === 1 && (
        <>
          <StepBody>
            <StepHeader
              title="Which sarees are coming back?"
              subtitle="Scan each saree tag, or tick them off in the sold list. One return covers one customer — tick as many of their pieces as they are bringing back."
              aside={saleFound ? (
                <Button variant="secondary" size="sm" iconLeft={X} onClick={clearSelection} className="rounded-[14px] border-[rgba(110,15,45,0.20)] px-4 text-[13px] text-[#4F4A45]">
                  Start over
                </Button>
              ) : undefined}
            />

            <ScanPanel
              accent={ACCENT_RETURN}
              title="Scan Saree Barcode"
              hint="Scanning locates the original sale — customer, date and amount all fill in automatically. Keep scanning to add more of the same customer's pieces."
              value={retailManualId}
              onValueChange={v => { setRetailManualId(v); setShowSaleList(true); }}
              onSubmit={overrideId => handleFindSale(overrideId)}
              error={findError}
            />

            {saleFound && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 18 }}>
                <FoundBanner
                  title={selectedSales.length === 1 ? "Original sale found" : `${selectedSales.length} sales matched`}
                  detail={`${lockedCustomerName} · ${formatMoney(rupees(refundTotal))} to refund`}
                />
                {selectionList}
              </motion.div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.bdr }} />
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>or pick from sold sarees</span>
              <div style={{ flex: 1, height: 1, background: C.bdr }} />
            </div>

            {!showSaleList ? (
              <Button variant="secondary" fullWidth iconLeft={List} onClick={() => setShowSaleList(true)}
                className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(171,56,50,0.30)] bg-transparent text-[#AB3832]">
                Browse Sold Sarees ({availableSales.length} eligible)
              </Button>
            ) : (
              <div style={{
                background: C.white, border: `1.5px solid ${C.crim}`, borderRadius: 14,
                boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
              }}>
                <div style={{ padding: "10px 14px", background: "rgba(171,56,50,0.03)", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                    {filteredSales.length} of {availableSales.length} sold, not yet returned
                  </span>
                  <Button variant="link" onClick={() => setShowSaleList(false)} className="p-0 text-xs text-[#69635E] underline">
                    Hide
                  </Button>
                </div>

                <div style={{ padding: 12, borderBottom: `1px solid ${C.bdr}`, display: "grid", gap: 10 }}>
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by customer name, Saree ID, saree type or bill number"
                    iconLeft={Search}
                    size="lg"
                    containerClassName="rounded-xl h-12"
                  />
                  <MultiSelect
                    options={customers}
                    value={customerFilter}
                    onValueChange={setCustomerFilter}
                    placeholder="Every customer"
                  />
                </div>

                {/* One return, one customer. Rather than silently ignoring a
                    click on another customer's row, say so up front. */}
                {lockedCustomerName && (
                  <div style={{
                    margin: 12, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(171,56,50,0.06)", border: "1px solid rgba(171,56,50,0.20)",
                    fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5,
                  }}>
                    Returning for <strong>{lockedCustomerName}</strong>. Other customers' sarees are locked —
                    finish this return, then start another for the next customer.
                  </div>
                )}

                <div style={{ maxHeight: 420, overflowY: "auto" as const, padding: 8 }}>
                  <DataTable
                    columns={columns}
                    data={filteredSales}
                    getRowId={s => s.sareeId}
                    caption="Sarees sold at this counter and not yet returned"
                    density="compact"
                    responsive
                    isFiltered={filtersActive}
                    onClearFilters={() => { setSearch(""); setCustomerFilter([]); }}
                    emptyTitle="No eligible sold sarees"
                    emptyDescription="Nothing sold here is still eligible to come back."
                    selectedIds={selectedIds}
                    onSelectionChange={ids => {
                      // DataTable hands back the whole new selection; diff it
                      // against the current one and route each change through
                      // toggleSale, which owns the one-customer rule.
                      filteredSales.forEach(s => {
                        const now = ids.has(s.sareeId);
                        const before = selectedIds.has(s.sareeId);
                        if (now !== before) toggleSale(s.sareeId);
                      });
                    }}
                    rowClassName={s =>
                      lockedCustomerKey != null && customerKeyOf(s) !== lockedCustomerKey
                        ? "opacity-45"
                        : undefined}
                  />
                </div>
              </div>
            )}
          </StepBody>
          <FlowActions
            accent={ACCENT_RETURN}
            backLabel="Change return type"
            onBack={onBackToType}
            primaryLabel={selectedSales.length > 1
              ? `Next — Return Reason (${selectedSales.length} sarees)`
              : "Next — Return Reason"}
            onPrimary={() => setStep(2)}
            primaryDisabled={!saleFound}
            hint={saleFound ? undefined : "Locate the original sale before continuing"}
          />
        </>
      )}

      {/* ── Step 2 — Return reason ── */}
      {step === 2 && (
        <>
          <StepBody>
            <StepHeader
              title="Why is it coming back?"
              subtitle={selectedSales.length > 1
                ? "The reason is recorded against every saree on this return."
                : "The reason is the only record of why this saree came back — pick carefully."}
            />

            {selectionList}

            <div role="radiogroup" aria-label="Return reason" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {returnReasons.map((r) => (
                <OptionCard
                  key={r.id}
                  name="return-reason"
                  icon={r.Icon}
                  label={r.label}
                  sub={r.sub}
                  selected={reason === r.id}
                  onSelect={() => setReason(r.id)}
                  accent={ACCENT_RETURN}
                />
              ))}
            </div>

            {reason === "other" && (
              <div style={{ marginTop: 20 }}>
                <label htmlFor="ret-other" style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8 }}>
                  Describe the reason
                </label>
                <Textarea
                  id="ret-other"
                  value={otherReason}
                  onChange={e => setOtherReason(e.target.value)}
                  placeholder="What did the customer tell you? This is the only record of why the saree came back."
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
            )}
          </StepBody>
          <FlowActions
            accent={ACCENT_RETURN}
            onBack={() => setStep(1)}
            primaryLabel="Next — Confirm"
            onPrimary={() => setStep(3)}
            primaryDisabled={!reasonComplete}
            hint={reason === "other" ? "Describe the reason to continue" : "Select a return reason to continue"}
          />
        </>
      )}

      {/* ── Step 3 — Confirm ── */}
      {step === 3 && (
        <>
          <StepBody>
            <StepHeader
              title="Review & confirm return"
              subtitle="This writes to the sales ledger and the customer's history. Check it before committing."
            />
            <SummaryPanel
              title="Return summary"
              accent={ACCENT_RETURN}
              rows={([
                { label: "Customer", value: lockedCustomerName ?? "—" },
                { label: "Sarees", value: `${selectedSales.length} piece${selectedSales.length === 1 ? "" : "s"}` },
                { label: "Return reason", value: chosenReason?.label ?? "Other", emphasis: true },
                ...(otherReason && reason === "other" ? [{ label: "Notes", value: otherReason }] : []),
                { label: "Total refund", value: formatMoney(rupees(refundTotal)), mono: true, emphasis: true },
              ] as SummaryRow[])}
              footer={
                <div>
                  {/* Money, itemised: what each piece was billed at, what the
                      saree type lists at, and what is being handed back. */}
                  {selectedSales.map(s => {
                    const code = s.saree?.sareeTypeCode ?? null;
                    const retail = code ? typeByCode.get(code)?.retailPrice ?? null : null;
                    const paid = Number(s.amount);
                    return (
                      <div key={s.sareeId} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
                        <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, minWidth: 0 }}>
                          <span style={{ fontFamily: F.m, color: C.crim }}>{s.sareeId}</span>
                          <span style={{ color: C.muted }}> · {typeTextOf(s)}</span>
                          <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                            Sold {fmtDate(s.saleDate)} on {s.saleRef}
                          </span>
                        </span>
                        <span style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                            {formatMoney(rupees(paid))}
                          </span>
                          {retail != null && retail !== paid && (
                            <span style={{ display: "block", fontFamily: F.u, fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                              Retail {formatMoney(rupees(retail))}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Total refund</span>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 30, color: C.crim, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                      {formatMoney(rupees(refundTotal))}
                    </span>
                  </div>
                </div>
              }
            />
            <ConsequenceNote>
              Confirming records {selectedSales.length === 1 ? "this return" : `all ${selectedSales.length} returns`} against{" "}
              <strong>{lockedCustomerName}</strong>&apos;s purchase history, and holds
              {selectedSales.length === 1 ? " the saree" : " the sarees"} under <strong>Retail returns</strong> in
              Shop Inventory. They do not go back on sale by themselves — send them to inventory from there once
              you have checked them.
            </ConsequenceNote>
          </StepBody>
          {submitError && (
            <div role="alert" style={{ margin: "0 0 14px", fontFamily: F.u, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.5 }}>
              {submitError}
            </div>
          )}
          <FlowActions
            accent={ACCENT_RETURN}
            backLabel="Edit details"
            onBack={() => setStep(2)}
            primaryIcon={RotateCcw}
            primaryLabel={submitting
              ? "Recording…"
              : selectedSales.length > 1 ? `Confirm return — ${selectedSales.length} sarees` : "Confirm return"}
            onPrimary={onConfirm}
            primaryDisabled={submitting}
          />
        </>
      )}
    </div>
  );
}
