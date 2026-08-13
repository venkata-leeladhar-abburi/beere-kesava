import React from "react";
import { motion } from "motion/react";
import { Camera, Check } from "lucide-react";
import { C, F, Card, Btn, Chip } from "./theme";
import { Button, Input, CurrencyInput } from "../../../../shared/ui/primitives";
import { StepHeader, StepBody, FlowActions, ScanPanel, FoundBanner, ACCENT_SALE } from "./flow-kit";

interface Saree {
  id: string;
  design: string;
  name: string;
  type: string;
  typeCode: string;
  weight: string;
  weaver: string;
}

interface ScanSareeStepProps {
  sareeFound: boolean;
  setSareeFound: (v: boolean) => void;
  manualId: string;
  setManualId: (v: string) => void;
  saree: Saree;
  soldPrice: number;
  setSoldPrice: (p: number) => void;
  originalPrice: number;
  canSeePrices: boolean;
  isMobile?: boolean;
  fmtPrice: (n: number) => string;
  handleScan: () => void;
  scanError?: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function ScanSareeStep({
  sareeFound,
  setSareeFound,
  manualId,
  setManualId,
  saree,
  soldPrice,
  setSoldPrice,
  originalPrice,
  canSeePrices,
  isMobile,
  fmtPrice,
  handleScan,
  scanError,
  onBack,
  onNext,
}: ScanSareeStepProps) {
  return (
    <>
      {!sareeFound ? (
        <>
          <StepBody>
            <StepHeader title="Which saree?" subtitle="Scan the barcode on the saree tag, or type its ID to pull up the details." />
            <ScanPanel
              accent={ACCENT_SALE}
              title="Scan Saree Barcode"
              hint="Point the camera at the barcode tag on the saree label."
              value={manualId}
              onValueChange={setManualId}
              onSubmit={handleScan}
              error={scanError}
            />
          </StepBody>
          <FlowActions
            accent={ACCENT_SALE}
            onBack={onBack}
            primaryLabel="Next — Payment"
            onPrimary={onNext}
            primaryDisabled
            hint="Find the saree before continuing"
          />
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <StepBody>
            <StepHeader
              title="Confirm the saree"
              subtitle="Check this is the right piece, and set the price it is actually selling for."
              aside={
                <Button variant="secondary" size="sm" onClick={() => setSareeFound(false)} className="rounded-full border-[rgba(110,15,45,0.20)] px-4 text-[13px] text-[#4F4A45]">
                  Scan a different saree
                </Button>
              }
            />
            <FoundBanner title="Saree found" detail={`Matched ${saree.id} in inventory`} />

          {/* Saree details card */}
          <Card style={{ marginBottom: 4, overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
            <div style={{ padding: 18, display: isMobile ? "block" : "flex", gap: isMobile ? 0 : 24, alignItems: isMobile ? undefined : "flex-start" }}>
              <div style={{ flex: isMobile ? undefined : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.burg, marginBottom: 4 }}>{saree.id}</div>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>{saree.name}</div>
                  </div>
                  <Chip label="Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
                </div>
                <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: "10px 16px" }}>
                  {[
                    ["Design Code", saree.design, true],
                    ["Type", saree.type, false],
                    ["Weight", saree.weight, true],
                    ["Weaver", saree.weaver, false],
                  ].map(([k, v, mono], i) => (
                    <div key={i}>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>{k as string}</div>
                      <div style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v as string}</div>
                    </div>
                  ))}
                </div>
              </div>
              {canSeePrices && (
                <div style={{ borderTop: isMobile ? `1px solid ${C.bdr}` : "none", borderLeft: isMobile ? "none" : `1px solid ${C.bdr}`, paddingTop: isMobile ? 14 : 0, marginTop: isMobile ? 16 : 0, paddingLeft: isMobile ? 0 : 24, width: isMobile ? undefined : 220, flexShrink: 0 }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Selling Price (₹)</label>
                  <CurrencyInput
                    value={soldPrice}
                    onValueChange={v => setSoldPrice(v === "" ? 0 : v)}
                    size="lg"
                    className="w-full font-['Plus_Jakarta_Sans'] text-2xl font-bold"
                  />
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 6 }}>Default: {fmtPrice(originalPrice)}</div>
                </div>
              )}
            </div>
          </Card>

          </StepBody>
          <FlowActions
            accent={ACCENT_SALE}
            onBack={onBack}
            primaryLabel="Next — Payment"
            onPrimary={onNext}
          />
        </motion.div>
      )}
    </>
  );
}
