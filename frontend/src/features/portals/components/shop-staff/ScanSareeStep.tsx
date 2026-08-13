import React from "react";
import { motion } from "motion/react";
import { Camera, Check, List } from "lucide-react";
import { C, F, Card, Btn, Chip } from "./theme";
import { Button, Input, CurrencyInput } from "../../../../shared/ui/primitives";
import { StepHeader, StepBody, FlowActions, ScanPanel, FoundBanner, ACCENT_SALE } from "./flow-kit";
import type { BackendStockItem } from "../../../../shared/api/inventory";

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
  handleScan: (overrideId?: string) => void;
  scanError?: string | null;
  availableSarees: BackendStockItem[];
  showSareeList: boolean;
  setShowSareeList: (v: boolean) => void;
  handleSelectSaree: (id: string) => void;
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
  availableSarees,
  showSareeList,
  setShowSareeList,
  handleSelectSaree,
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
              onValueChange={v => { setManualId(v); setShowSareeList(true); }}
              onSubmit={() => handleScan()}
              error={scanError}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.bdr }} />
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>or pick from sarees in stock</span>
              <div style={{ flex: 1, height: 1, background: C.bdr }} />
            </div>

            {!showSareeList ? (
              <Button variant="secondary" fullWidth iconLeft={List} onClick={() => setShowSareeList(true)}
                className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.30)] bg-transparent text-[#6E0F2D]">
                Browse All Sarees ({availableSarees.length} in stock)
              </Button>
            ) : (
              <div style={{
                background: C.white, border: `1.5px solid ${C.burg}`, borderRadius: 14,
                boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
              }}>
                <div style={{ padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                    {manualId.trim().length >= 2 ? `${availableSarees.length} result${availableSarees.length !== 1 ? "s" : ""} for "${manualId.trim()}"` : `${availableSarees.length} Available in Stock`}
                  </span>
                  <Button variant="link" onClick={() => setShowSareeList(false)} className="p-0 text-xs text-[#69635E] underline">
                    Hide
                  </Button>
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto" as const }}>
                  {availableSarees.length > 0 ? availableSarees.slice(0, 50).map((s, i) => (
                    <Button key={s.sareeId} variant="tertiary" fullWidth onClick={() => handleSelectSaree(s.sareeId)}
                      className={`justify-start gap-3 rounded-none border-0 px-3.5 py-3 ${i < Math.min(availableSarees.length, 50) - 1 ? "border-b border-[rgba(110,15,45,0.12)]" : ""}`}>
                      <div style={{ flex: 1, textAlign: "left" as const }}>
                        <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{s.sareeId}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {s.sareeTypeLabel || "—"}{s.designCode ? ` · ${s.designCode}` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{s.weaverName ?? (s.loomNumber ? `Loom ${s.loomNumber}` : "—")}</div>
                        <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, textTransform: "capitalize" as const }}>{s.source}</div>
                      </div>
                    </Button>
                  )) : (
                    <div style={{ padding: "20px", textAlign: "center" as const }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No sarees in stock match "{manualId.trim()}"</div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
