import React from "react";
import { motion } from "motion/react";
import { Camera, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { C, F, Card, Btn } from "./theme";
import { Button, Input, Textarea } from "../../../../shared/ui/primitives";
import {
  Stepper, StepHeader, StepBody, FlowActions, ScanPanel, FoundBanner,
  SummaryPanel, OptionCard, ConsequenceNote, ACCENT_RETURN,
  type FlowStep, type SummaryRow,
} from "./flow-kit";
import { Money } from "../../../../shared/ui/domain/Money";
import { rupees } from "../../../../lib/domain/money";

interface ProcessReturnRetailFlowProps {
  step: 1 | 2 | 3;
  setStep: (s: any) => void;
  saleFound: boolean;
  setSaleFound: (v: boolean) => void;
  retailManualId: string;
  setRetailManualId: (v: string) => void;
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
  retailManualId,
  setRetailManualId,
  reason,
  setReason,
  otherReason,
  setOtherReason,
  returnReasons,
  canSeePrices,
  onConfirm,
}: ProcessReturnRetailFlowProps) {
  const chosenReason = returnReasons.find(r => r.id === reason);
  const sareeRef = retailManualId.trim() || "PADMA-L1-004";

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
                onValueChange={setRetailManualId}
                onSubmit={() => setSaleFound(true)}
              />
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
                  { label: "Design", value: "BKB-045 · Cream Zari Border Saree" },
                  { label: "Sale date", value: "05 Jun 2026" },
                  { label: "Customer", value: "Smt. Meenakshi" },
                  ...(canSeePrices ? [{ label: "Amount paid", value: <Money value={rupees(8500)} />, emphasis: true }] : []),
                  { label: "Payment method", value: "UPI", mono: true },
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
                { label: "Saree", value: `${sareeRef} · BKB-045`, mono: true },
                { label: "Customer", value: "Smt. Meenakshi" },
                { label: "Original sale", value: "05 Jun 2026" },
                { label: "Return reason", value: chosenReason?.label ?? "Other", emphasis: true },
                ...(otherReason && reason === "other" ? [{ label: "Notes", value: otherReason }] : []),
                ...(canSeePrices ? [{ label: "Refund amount", value: <Money value={rupees(8500)} />, emphasis: true }] : []),
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
