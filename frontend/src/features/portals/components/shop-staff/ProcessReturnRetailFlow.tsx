import React from "react";
import { motion } from "motion/react";
import { Camera, Check, AlertTriangle, RotateCcw, List } from "lucide-react";
import { C, F, Card, Btn } from "./theme";
import { Button, Input, Textarea } from "../../../../shared/ui/primitives";
import {
  Stepper, StepHeader, StepBody, FlowActions, ScanPanel, FoundBanner,
  SummaryPanel, OptionCard, ConsequenceNote, ACCENT_RETURN,
  type FlowStep, type SummaryRow,
} from "./flow-kit";
import { Money } from "../../../../shared/ui/domain/Money";
import { rupees } from "../../../../lib/domain/money";
import type { BackendSaleRecord } from "../../../../shared/api/sales";

interface ProcessReturnRetailFlowProps {
  step: 1 | 2 | 3;
  setStep: (s: any) => void;
  saleFound: boolean;
  setSaleFound: (v: boolean) => void;
  foundSale: BackendSaleRecord | null;
  findError: string | null;
  retailManualId: string;
  setRetailManualId: (v: string) => void;
  handleFindSale: (overrideId?: string) => void;
  availableSales: BackendSaleRecord[];
  showSaleList: boolean;
  setShowSaleList: (v: boolean) => void;
  handleSelectSale: (id: string) => void;
  reason: string | null;
  setReason: (r: string | null) => void;
  otherReason: string;
  setOtherReason: (v: string) => void;
  returnReasons: any[];
  canSeePrices: boolean;
  onConfirm: () => void;
}

export function ProcessReturnRetailFlow({
  step,
  setStep,
  saleFound,
  setSaleFound,
  foundSale,
  findError,
  retailManualId,
  setRetailManualId,
  handleFindSale,
  availableSales,
  showSaleList,
  setShowSaleList,
  handleSelectSale,
  reason,
  setReason,
  otherReason,
  setOtherReason,
  returnReasons,
  canSeePrices,
  onConfirm,
}: ProcessReturnRetailFlowProps) {
  const chosenReason = returnReasons.find(r => r.id === reason);
  const sareeRef = foundSale?.sareeId ?? retailManualId.trim();
  const customerName = foundSale?.customer?.name ?? "Walk-in Customer";
  const saleDateLabel = foundSale ? new Date(foundSale.saleDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const amount = foundSale ? Number(foundSale.amount) : 0;

  const steps: FlowStep[] = [
    { label: "Find Sale",     summary: saleFound ? sareeRef : undefined },
    { label: "Return Reason", summary: chosenReason?.label },
    { label: "Confirm" },
  ];

  // "Other" needs the note actually written — otherwise the return lands in
  // the ledger with no explanation at all.
  const reasonComplete = reason !== null && (reason !== "other" || otherReason.trim() !== "");

  return (
    <div>
      <Stepper
        steps={steps}
        current={step as number}
        accent={ACCENT_RETURN}
        onJump={n => setStep(n)}
      />

      {/* ── Step 1 — Find the original sale ── */}
      {step === 1 && (
        !saleFound ? (
          <>
            <StepBody>
              <StepHeader
                title="Find the original sale"
                subtitle="Scan the saree tag, or type the Saree ID printed on the customer's bill."
              />
              <ScanPanel
                accent={ACCENT_RETURN}
                title="Scan Saree Barcode"
                hint="Scanning locates the original sale record — customer, date and amount all fill in automatically."
                value={retailManualId}
                onValueChange={v => { setRetailManualId(v); setShowSaleList(true); }}
                onSubmit={overrideId => handleFindSale(overrideId)}
                error={findError}
              />

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
                  <div style={{ padding: "8px 14px", background: "rgba(171,56,50,0.03)", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                      {availableSales.length} Sold, Not Yet Returned
                    </span>
                    <Button variant="link" onClick={() => setShowSaleList(false)} className="p-0 text-xs text-[#69635E] underline">
                      Hide
                    </Button>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto" as const }}>
                    {availableSales.length > 0 ? availableSales.slice(0, 50).map((s, i) => (
                      <Button key={s.sareeId} variant="tertiary" fullWidth onClick={() => handleSelectSale(s.sareeId)}
                        className={`justify-start gap-3 rounded-none border-0 px-3.5 py-3 ${i < Math.min(availableSales.length, 50) - 1 ? "border-b border-[rgba(171,56,50,0.12)]" : ""}`}>
                        <div style={{ flex: 1, textAlign: "left" as const }}>
                          <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.crim }}>{s.sareeId}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                            {s.customer?.name ?? "Walk-in Customer"} · {new Date(s.saleDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </div>
                        </div>
                        {canSeePrices && (
                          <div style={{ textAlign: "right" as const, flexShrink: 0, fontFamily: F.m, fontSize: 13, color: C.gold, fontWeight: 700 }}>
                            <Money value={rupees(Number(s.amount))} />
                          </div>
                        )}
                      </Button>
                    )) : (
                      <div style={{ padding: "20px", textAlign: "center" as const }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No eligible sold sarees to return.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </StepBody>
            <FlowActions
              accent={ACCENT_RETURN}
              primaryLabel="Next — Return Reason"
              onPrimary={() => setStep(2)}
              primaryDisabled
              hint="Locate the original sale before continuing"
            />
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <StepBody>
              <StepHeader
                title="Confirm the original sale"
                subtitle="Check this is the sale the customer is returning against."
                aside={
                  <Button variant="secondary" size="sm" onClick={() => setSaleFound(false)} className="rounded-full border-[rgba(110,15,45,0.20)] px-4 text-[13px] text-[#4F4A45]">
                    Search again
                  </Button>
                }
              />
              <FoundBanner title="Original sale found" detail={`Matched ${sareeRef} in the sales ledger`} />
              <SummaryPanel
                title="Original sale details"
                accent={ACCENT_RETURN}
                rows={([
                  { label: "Saree ID", value: sareeRef, mono: true },
                  { label: "Sale date", value: saleDateLabel },
                  { label: "Customer", value: customerName },
                  { label: "Channel", value: foundSale?.channel === "WHOLESALE" ? "Wholesale" : "Retail" },
                  ...(canSeePrices ? [{ label: "Amount paid", value: <Money value={rupees(amount)} />, emphasis: true }] : []),
                ] as SummaryRow[])}
              />
            </StepBody>
            <FlowActions
              accent={ACCENT_RETURN}
              primaryLabel="Next — Return Reason"
              onPrimary={() => setStep(2)}
            />
          </motion.div>
        )
      )}

      {/* ── Step 2 — Return reason ── */}
      {step === 2 && (
        <>
          <StepBody>
            <StepHeader
              title="Why is it coming back?"
              subtitle="The reason drives whether the saree returns to sale stock or goes to the defective pile — pick carefully."
            />
            <div role="radiogroup" aria-label="Return reason" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {returnReasons.map((r: any) => (
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
                { label: "Saree", value: sareeRef, mono: true },
                { label: "Customer", value: customerName },
                { label: "Original sale", value: saleDateLabel },
                { label: "Return reason", value: chosenReason?.label ?? "Other", emphasis: true },
                ...(otherReason && reason === "other" ? [{ label: "Notes", value: otherReason }] : []),
                ...(canSeePrices ? [{ label: "Refund amount", value: <Money value={rupees(amount)} />, emphasis: true }] : []),
              ] as SummaryRow[])}
            />
            <ConsequenceNote>
              Confirming puts <strong>{sareeRef}</strong> back into shop inventory, updates the customer's purchase record, and notifies admin. It cannot be undone from this screen.
            </ConsequenceNote>
          </StepBody>
          <FlowActions
            accent={ACCENT_RETURN}
            backLabel="Edit details"
            onBack={() => setStep(2)}
            primaryIcon={RotateCcw}
            primaryLabel="Confirm return"
            onPrimary={onConfirm}
          />
        </>
      )}
    </div>
  );
}
