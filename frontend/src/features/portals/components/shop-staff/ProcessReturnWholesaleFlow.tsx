import React from "react";
import { motion } from "motion/react";
import { Camera, QrCode, Check, ImagePlus, X, Loader2 } from "lucide-react";
import { uploadsApi } from "@/shared/api/uploads";
import { ApiError } from "@/shared/api/client";
import { C, F } from "./theme";
import { Button, Input, NumberInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import {
  Stepper, StepHeader, StepBody, FlowActions, SummaryPanel,
  ConsequenceNote, ACCENT_WHOLESALE, type FlowStep, type SummaryRow,
} from "./flow-kit";
import { rupees, formatMoney } from "@/lib/domain/money";

type ReturnStep = "type" | 1 | 2 | 3 | "success";
type MyReturnType = "retail" | "wholesale" | "damage" | null;

interface ProcessReturnWholesaleFlowProps {
  step: 1 | 2;
  setStep: (s: ReturnStep) => void;
  wsVendor: string;
  setWsVendor: (v: string) => void;
  wsDesign: string;
  setWsDesign: (v: string) => void;
  wsColor: string;
  setWsColor: (v: string) => void;
  wsType: string;
  setWsType: (v: string) => void;
  wsWeight: string;
  setWsWeight: (v: string) => void;
  wsPrice: string;
  setWsPrice: (v: string) => void;
  wsReason: string | null;
  setWsReason: (v: string | null) => void;
  wsReasonOptions: string[];
  wsNewId: string;
  setWsNewId: (v: string) => void;
  wsBarcodeGenerated: boolean;
  wsError?: string | null;
  setWsBarcodeGenerated: (v: boolean) => void;
  canSeePrices: boolean;
  canProceedWsStep1: boolean;
  setReturnType: (t: MyReturnType) => void;
  /** Reports the uploaded condition photo's server-relative path up to the
   *  parent, which sends it with the return. Null clears it. */
  setPhotoUrl: (u: string | null) => void;
  onConfirm: () => void;
}

export function ProcessReturnWholesaleFlow({
  step,
  setStep,
  wsVendor,
  setWsVendor,
  wsDesign,
  setWsDesign,
  wsColor,
  setWsColor,
  wsType,
  setWsType,
  wsWeight,
  setWsWeight,
  wsPrice,
  setWsPrice,
  wsReason,
  setWsReason,
  wsReasonOptions,
  wsNewId,
  setWsNewId,
  wsBarcodeGenerated,
  wsError,
  setWsBarcodeGenerated,
  canSeePrices,
  canProceedWsStep1,
  setReturnType,
  setPhotoUrl,
  onConfirm,
}: ProcessReturnWholesaleFlowProps) {
  // Camera / gallery pickers, mirroring WorkerQCInspectionScreen. The chosen
  // file is uploaded straight away (POST /uploads/photo) so the return is saved
  // with a real photoUrl rather than a preview that dies with the component.
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [photoError, setPhotoError] = React.useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setPhotoError("Photo must be a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be under 5MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    setPhotoUploading(true);
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      setPhotoUrl(url);
    } catch (err) {
      setPhotoError(err instanceof ApiError ? err.message : "Could not upload photo. Please try again.");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoError(null);
    setPhotoUrl(null);
  };

  const steps: FlowStep[] = [
    { label: "Saree Details",    summary: wsVendor.trim() || undefined },
    { label: "Generate Barcode", summary: wsNewId || undefined },
  ];

  // Spell out what is still missing rather than just greying the button out.
  const missing: string[] = [];
  if (!wsVendor.trim()) missing.push("vendor");
  if (!wsWeight.trim()) missing.push("weight");
  if (!wsReason) missing.push("return reason");
  const missingHint = missing.length ? `Still needed: ${missing.join(", ")}` : undefined;

  const labelStyle: React.CSSProperties = {
    fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8,
  };

  return (
    <div>
      <Stepper
        steps={steps}
        current={step as number}
        accent={ACCENT_WHOLESALE}
        onJump={n => setStep(n as ReturnStep)}
      />

      {/* ── Step 1 — Saree details ── */}
      {step === 1 && (
        <>
          <StepBody>
            <StepHeader
              title="Describe the returned saree"
              subtitle="A wholesale return arrives with no barcode, so these details are the only record we will have of the piece."
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 24 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="ws-vendor" style={labelStyle}>
                  Vendor / source name <span style={{ color: "#AB3832" }}>*</span>
                </label>
                <Input id="ws-vendor" value={wsVendor} onChange={e => setWsVendor(e.target.value)} placeholder="e.g. Ravi Silks" size="lg" className="w-full" />
              </div>
              <div>
                <label htmlFor="ws-design" style={labelStyle}>Design code</label>
                <Input id="ws-design" value={wsDesign} onChange={e => setWsDesign(e.target.value)} placeholder="e.g. BKB-045" size="lg" className="w-full font-mono" />
              </div>
              <div>
                <label htmlFor="ws-color" style={labelStyle}>Saree colour</label>
                <Input id="ws-color" value={wsColor} onChange={e => setWsColor(e.target.value)} placeholder="e.g. Maroon" size="lg" className="w-full" />
              </div>
              <div>
                <label htmlFor="ws-type" style={labelStyle}>Saree type</label>
                <Select value={wsType} onValueChange={setWsType} size="lg">
                  {["Self Brocade", "Heavy Zari", "Plain Silk", "Kanjivaram", "Cotton"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </Select>
              </div>
              <div>
                <label htmlFor="ws-weight" style={labelStyle}>
                  Weight in grams <span style={{ color: "#AB3832" }}>*</span>
                </label>
                <NumberInput id="ws-weight" value={wsWeight === "" ? "" : Number(wsWeight)} onValueChange={v => setWsWeight(v === "" ? "" : String(v))} placeholder="e.g. 840" size="lg" className="w-full font-mono" />
              </div>
              {canSeePrices && (
                <div>
                  <label htmlFor="ws-price" style={labelStyle}>Original purchase price (₹)</label>
                  <NumberInput id="ws-price" value={wsPrice === "" ? "" : Number(wsPrice)} onValueChange={v => setWsPrice(v === "" ? "" : String(v))} step={0.01} placeholder="e.g. 6500" size="lg" className="w-full font-mono" />
                </div>
              )}
            </div>

            <fieldset style={{ border: "none", margin: "0 0 24px", padding: 0 }}>
              <legend style={{ ...labelStyle, marginBottom: 12 }}>
                Return reason <span style={{ color: "#AB3832" }}>*</span>
              </legend>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {wsReasonOptions.map(r => (
                  <Button
                    key={r}
                    variant="tertiary"
                    role="radio"
                    aria-checked={wsReason === r}
                    onClick={() => setWsReason(r)}
                    className={wsReason === r
                      ? "h-10 rounded-full border-2 border-[#845E04] bg-[rgba(200,155,71,0.14)] px-4 text-[14px] font-semibold text-[#845E04] hover:bg-[rgba(200,155,71,0.14)]"
                      : "h-10 rounded-full border border-[rgba(110,15,45,0.16)] bg-white px-4 text-[14px] text-[#4F4A45] hover:border-[rgba(110,15,45,0.32)]"}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div>
              <span style={{ ...labelStyle, marginBottom: 10 }}>Photo of the saree <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></span>
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={e => { void handlePhotoSelect(e); }} aria-label="Camera photo input" />
              <input type="file" accept="image/*" ref={galleryInputRef} style={{ display: "none" }} onChange={e => { void handlePhotoSelect(e); }} aria-label="Gallery photo input" />
              {!photoPreview ? (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button variant="secondary" iconLeft={Camera} onClick={() => cameraInputRef.current?.click()} className="h-11 rounded-xl border border-dashed border-[rgba(110,15,45,0.28)] bg-transparent px-5 text-[14px] text-[#4F4A45]">
                    Take photo
                  </Button>
                  <Button variant="secondary" iconLeft={ImagePlus} onClick={() => galleryInputRef.current?.click()} className="h-11 rounded-xl border border-dashed border-[rgba(110,15,45,0.28)] bg-transparent px-5 text-[14px] text-[#4F4A45]">
                    Choose from gallery
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={photoPreview} alt="Saree being returned" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(110,15,45,0.16)" }} />
                  {photoUploading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted }}>
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </span>
                  ) : (
                    <Button variant="tertiary" iconLeft={X} onClick={clearPhoto} className="h-9 px-3 text-[13px] text-[#C0392B]">
                      Remove photo
                    </Button>
                  )}
                </div>
              )}
              {photoError && <div style={{ marginTop: 8, fontSize: 12, color: "#C0392B" }}>{photoError}</div>}
            </div>
          </StepBody>

          <FlowActions
            accent={ACCENT_WHOLESALE}
            backLabel="Change return type"
            onBack={() => { setStep("type"); setReturnType(null); }}
            primaryLabel="Next — Generate Barcode"
            onPrimary={() => setStep(2)}
            primaryDisabled={!canProceedWsStep1}
            hint={missingHint}
          />
        </>
      )}

      {/* ── Step 2 — Barcode ── */}
      {step === 2 && (
        <>
          <StepBody>
            <StepHeader
              title="Tag it and add to stock"
              subtitle="Generate a fresh barcode for this piece, print the tag, and it joins shop inventory."
            />

            <SummaryPanel
              title="Saree details"
              accent={ACCENT_WHOLESALE}
              rows={([
                { label: "Vendor", value: wsVendor || "—" },
                { label: "Design code", value: wsDesign || "—", mono: true },
                { label: "Colour", value: wsColor || "—" },
                { label: "Type", value: wsType },
                { label: "Weight", value: wsWeight ? `${wsWeight} g` : "—", mono: true },
                ...(canSeePrices ? [{ label: "Purchase price", value: wsPrice && !isNaN(Number(wsPrice)) ? formatMoney(rupees(Number(wsPrice))) : "—" }] : []),
                { label: "Return reason", value: wsReason || "—", emphasis: true },
              ] as SummaryRow[])}
            />

            <div style={{ marginTop: 22 }}>
              {!wsBarcodeGenerated ? (
                <div style={{ border: `1.5px dashed ${ACCENT_WHOLESALE.softBorder}`, background: ACCENT_WHOLESALE.soft, borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
                  <QrCode size={30} color={ACCENT_WHOLESALE.base} style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.wine, marginBottom: 5 }}>No barcode yet</div>
                  <div className="max-w-[420px] mx-auto" style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 18, lineHeight: 1.55 }}>
                    This saree needs a new tag before it can be tracked. Enter or scan the tag ID you are attaching to it.
                  </div>
                  <form
                    onSubmit={e => { e.preventDefault(); if (wsNewId.trim()) setWsBarcodeGenerated(true); }}
                    className="mx-auto flex max-w-[380px] items-center gap-8"
                    style={{ gap: 8 }}
                  >
                    <Input
                      value={wsNewId}
                      onChange={e => setWsNewId(e.target.value)}
                      placeholder="Scan or type tag ID"
                      aria-label="Tag ID for this saree"
                      className="h-12 flex-1 font-mono"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      iconLeft={QrCode}
                      disabled={!wsNewId.trim()}
                      className="h-12 shrink-0 rounded-full bg-[#845E04] px-6 text-[15px] font-semibold text-white hover:bg-[#6B4B01]"
                    >
                      Use tag
                    </Button>
                  </form>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ background: "#14100C", borderRadius: 16, padding: "26px 20px", textAlign: "center" }}>
                    <div aria-hidden style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 56, justifyContent: "center", marginBottom: 12 }}>
                      {[3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 2, 1, 4].map((w, i) => (
                        // Decorative barcode bars — values repeat, so array index is the only
                        // way to distinguish otherwise-identical bar entries.
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={i} style={{ width: w * 2, background: "#FFFDF9", height: i % 3 === 0 ? 56 : i % 2 === 0 ? 44 : 50, borderRadius: 1 }} />
                      ))}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 14, color: "#F5E8D0", letterSpacing: "2px" }}>{wsNewId}</div>
                  </div>
                  <ConsequenceNote tone="info">
                    On confirm, this saree enters shop inventory as <strong>{wsNewId}</strong> and becomes available to sell. Print the tag and attach it before shelving.
                  </ConsequenceNote>
                </motion.div>
              )}
            </div>
          </StepBody>

          {wsError && (
            <div style={{ margin: "0 0 14px", fontFamily: F.u, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.5 }}>
              {wsError}
            </div>
          )}
          <FlowActions
            accent={ACCENT_WHOLESALE}
            tone="confirm"
            onBack={() => setStep(1)}
            primaryIcon={Check}
            primaryLabel="Confirm — add to inventory"
            onPrimary={onConfirm}
            primaryDisabled={!wsBarcodeGenerated}
            hint="Enter the tag ID first"
          />
        </>
      )}
    </div>
  );
}
