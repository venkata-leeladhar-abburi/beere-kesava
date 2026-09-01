import React from "react";
import { motion } from "motion/react";
import {
  Camera, Check, ImagePlus, X, Loader2, Plus, Copy, Trash2, Printer, ScanLine, AlertCircle,
} from "lucide-react";
import { uploadsApi, resolveAssetUrl } from "@/shared/api/uploads";
import { ApiError } from "@/shared/api/client";
import { C, F } from "./theme";
import {
  Button, Combobox, Input, NumberInput, Select, SelectItem, Textarea,
} from "../../../../shared/ui/primitives";
import {
  Stepper, StepHeader, StepBody, FlowActions, SummaryPanel,
  ConsequenceNote, ACCENT_WHOLESALE, type FlowStep, type SummaryRow,
} from "./flow-kit";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { rupees, formatMoney } from "@/lib/domain/money";
import { IMAGE_ACCEPT_ATTR, IMAGE_REJECTION_MESSAGE, isAcceptedImageFile } from "@/shared/lib/imageTypes";
import {
  WS_RETURN_REASONS, duplicateDraft, draftProblem, emptyDraft,
  type WholesaleReturnDraft,
} from "./wholesale-return-draft";

type ReturnStep = "type" | 1 | 2 | 3 | "success";
type MyReturnType = "retail" | "wholesale" | "damage" | null;

export interface VendorOption {
  id: string;
  name: string;
  city: string | null;
}

export interface SareeTypeOption {
  code: string;
  name: string;
  retailPrice: number;
}

interface ProcessReturnWholesaleFlowProps {
  step: 1 | 2;
  setStep: (s: ReturnStep) => void;
  /** Wholesale customer id, or "" while the vendor is free text. */
  vendorId: string;
  setVendorId: (v: string) => void;
  vendorName: string;
  setVendorName: (v: string) => void;
  vendors: VendorOption[];
  vendorsLoading: boolean;
  sareeTypes: SareeTypeOption[];
  drafts: WholesaleReturnDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<WholesaleReturnDraft[]>>;
  canSeePrices: boolean;
  wsError?: string | null;
  submitting?: boolean;
  setReturnType: (t: MyReturnType) => void;
  onPrintTags: () => void;
  onConfirm: () => void;
}

const labelStyle: React.CSSProperties = {
  fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8,
};

/* ── One saree on the consignment ────────────────────────────────────────── */

function DraftCard({
  draft, index, total, allDrafts, sareeTypes, canSeePrices, onChange, onDuplicate, onRemove,
}: {
  draft: WholesaleReturnDraft;
  index: number;
  total: number;
  allDrafts: WholesaleReturnDraft[];
  sareeTypes: SareeTypeOption[];
  canSeePrices: boolean;
  onChange: (patch: Partial<WholesaleReturnDraft>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const problem = draftProblem(draft, allDrafts);
  const idBase = `ws-${draft.key}`;

  // The file is uploaded straight away so the return is saved with a real
  // photoUrl rather than a preview that dies with the component.
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAcceptedImageFile(file)) {
      onChange({ photoError: IMAGE_REJECTION_MESSAGE });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onChange({ photoError: "Photo must be under 5MB." });
      return;
    }
    onChange({
      photoError: null,
      photoPreview: URL.createObjectURL(file),
      photoUploading: true,
    });
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      onChange({ photoUrl: url, photoUploading: false });
    } catch (err) {
      onChange({
        photoError: err instanceof ApiError ? err.message : "Could not upload photo. Please try again.",
        photoPreview: null,
        photoUploading: false,
      });
    }
  };

  return (
    <div style={{
      border: `1px solid ${problem ? "rgba(192,57,43,0.28)" : ACCENT_WHOLESALE.softBorder}`,
      borderRadius: 16, background: C.white, marginBottom: 16, overflow: "hidden",
    }}>
      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={text => { setScannerOpen(false); onChange({ sareeId: text.trim() }); }}
        accent={ACCENT_WHOLESALE}
      />

      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        background: ACCENT_WHOLESALE.soft, borderBottom: `1px solid ${ACCENT_WHOLESALE.softBorder}`,
      }}>
        <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.4, color: "#6E0F2D", fontWeight: 700, textTransform: "uppercase" as const }}>
          Saree {index + 1} of {total}
        </span>
        <span style={{ flex: 1 }} />
        <Button
          variant="tertiary" size="sm" iconLeft={Copy} onClick={onDuplicate}
          className="h-8 px-2.5 text-[13px] text-[#6E0F2D]"
        >
          Duplicate
        </Button>
        <Button
          variant="tertiary" size="sm" iconLeft={Trash2} onClick={onRemove}
          disabled={total === 1}
          aria-label={`Remove saree ${index + 1}`}
          className="h-8 px-2.5 text-[13px] text-[#C0392B]"
        >
          Remove
        </Button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 18 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label htmlFor={`${idBase}-tag`} style={{ ...labelStyle, marginBottom: 0 }}>
                Tag ID to attach {!draft.noTagId && <span style={{ color: "#AB3832" }}>*</span>}
              </label>
              <Button
                variant="tertiary" size="sm"
                onClick={() => onChange({ noTagId: !draft.noTagId, sareeId: "" })}
                className="h-7 px-2 text-[12.5px] text-[#6E0F2D]"
              >
                {draft.noTagId ? "I have a tag" : "No tag / not in our records"}
              </Button>
            </div>
            {draft.noTagId ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
                borderRadius: 10, background: ACCENT_WHOLESALE.soft,
                border: `1px dashed ${ACCENT_WHOLESALE.softBorder}`,
                fontFamily: F.u, fontSize: 13, color: "#4F4A45",
              }}>
                <AlertCircle size={14} color="#6E0F2D" />
                No tag will be attached — a return id is generated automatically from the saree type and vendor below.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <Input
                  id={`${idBase}-tag`}
                  value={draft.sareeId}
                  onChange={e => onChange({ sareeId: e.target.value })}
                  placeholder="Scan or type the tag id"
                  size="lg"
                  className="flex-1 font-mono"
                />
                <Button
                  variant="secondary" iconLeft={ScanLine} onClick={() => setScannerOpen(true)}
                  className="h-12 shrink-0 rounded-xl border border-[rgba(110,15,45,0.45)] px-4 text-[14px] text-[#6E0F2D]"
                >
                  Scan
                </Button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`${idBase}-type`} style={labelStyle}>
              Saree type {draft.noTagId && <span style={{ color: "#AB3832" }}>*</span>}
            </label>
            <Select
              value={draft.sareeType}
              onValueChange={v => onChange({ sareeType: v })}
              size="lg"
              placeholder={sareeTypes.length ? "Select a saree type" : "No saree types configured"}
            >
              {sareeTypes.map(t => (
                <SelectItem key={t.code} value={t.code}>{t.code} · {t.name}</SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor={`${idBase}-color`} style={labelStyle}>Saree colour</label>
            <Input
              id={`${idBase}-color`}
              value={draft.color}
              onChange={e => onChange({ color: e.target.value })}
              placeholder="e.g. Maroon"
              size="lg"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor={`${idBase}-weight`} style={labelStyle}>
              Weight in grams <span style={{ color: "#AB3832" }}>*</span>
            </label>
            <NumberInput
              id={`${idBase}-weight`}
              value={draft.weight === "" ? "" : Number(draft.weight)}
              onValueChange={v => onChange({ weight: v === "" ? "" : String(v) })}
              placeholder="e.g. 840"
              size="lg"
              className="w-full font-mono"
            />
          </div>

          {canSeePrices && (
            <div>
              <label htmlFor={`${idBase}-price`} style={labelStyle}>Original purchase price (₹)</label>
              <NumberInput
                id={`${idBase}-price`}
                value={draft.price === "" ? "" : Number(draft.price)}
                onValueChange={v => onChange({ price: v === "" ? "" : String(v) })}
                step={0.01}
                placeholder="e.g. 6500"
                size="lg"
                className="w-full font-mono"
              />
            </div>
          )}
        </div>

        <fieldset style={{ border: "none", margin: "0 0 18px", padding: 0 }}>
          <legend style={{ ...labelStyle, marginBottom: 10 }}>
            Return reason <span style={{ color: "#AB3832" }}>*</span>
          </legend>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {WS_RETURN_REASONS.map(r => (
              <Button
                key={r}
                variant="tertiary"
                role="radio"
                aria-checked={draft.reason === r}
                onClick={() => onChange({ reason: r, reasonNote: r === "Other" ? draft.reasonNote : "" })}
                className={draft.reason === r
                  ? "h-9 rounded-full border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.14)] px-4 text-[13.5px] font-semibold text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.14)]"
                  : "h-9 rounded-full border border-[rgba(110,15,45,0.16)] bg-white px-4 text-[13.5px] text-[#4F4A45] hover:border-[rgba(110,15,45,0.32)]"}
              >
                {r}
              </Button>
            ))}
          </div>

          {draft.reason === "Other" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ overflow: "hidden" }}>
              <div style={{ marginTop: 14 }}>
                <label htmlFor={`${idBase}-note`} style={labelStyle}>
                  Describe the reason <span style={{ color: "#AB3832" }}>*</span>
                </label>
                <Textarea
                  id={`${idBase}-note`}
                  value={draft.reasonNote}
                  onChange={e => onChange({ reasonNote: e.target.value })}
                  placeholder="What did the vendor say? This is stored with the return."
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
            </motion.div>
          )}
        </fieldset>

        <div>
          <span style={{ ...labelStyle, marginBottom: 10 }}>
            Photo of the saree <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span>
          </span>
          <input type="file" accept={IMAGE_ACCEPT_ATTR} capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={e => { void handlePhotoSelect(e); }} aria-label={`Camera photo for saree ${index + 1}`} />
          <input type="file" accept={IMAGE_ACCEPT_ATTR} ref={galleryInputRef} style={{ display: "none" }} onChange={e => { void handlePhotoSelect(e); }} aria-label={`Gallery photo for saree ${index + 1}`} />
          {!draft.photoPreview && !draft.photoUrl ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="secondary" iconLeft={Camera} onClick={() => cameraInputRef.current?.click()} className="h-11 rounded-xl border border-dashed border-[rgba(110,15,45,0.28)] bg-transparent px-5 text-[14px] text-[#4F4A45]">
                Take photo
              </Button>
              <Button variant="secondary" iconLeft={ImagePlus} onClick={() => galleryInputRef.current?.click()} className="h-11 rounded-xl border border-dashed border-[rgba(110,15,45,0.28)] bg-transparent px-5 text-[14px] text-[#4F4A45]">
                Choose from gallery
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <img
                src={draft.photoPreview ?? resolveAssetUrl(draft.photoUrl) ?? undefined}
                alt={`Saree ${index + 1} being returned`}
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(110,15,45,0.16)" }}
              />
              {draft.photoUploading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted }}>
                  <Loader2 size={14} className="animate-spin" /> Uploading…
                </span>
              ) : (
                <>
                  <Button variant="secondary" iconLeft={ImagePlus} onClick={() => galleryInputRef.current?.click()} className="h-9 rounded-xl border border-dashed border-[rgba(110,15,45,0.28)] bg-transparent px-4 text-[13px] text-[#4F4A45]">
                    Replace
                  </Button>
                  <Button
                    variant="tertiary" iconLeft={X}
                    onClick={() => onChange({ photoUrl: null, photoPreview: null, photoError: null })}
                    className="h-9 px-3 text-[13px] text-[#C0392B]"
                  >
                    Remove photo
                  </Button>
                </>
              )}
            </div>
          )}
          {draft.photoError && <div style={{ marginTop: 8, fontSize: 12, color: "#C0392B" }}>{draft.photoError}</div>}
        </div>

        {problem && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontFamily: F.u, fontSize: 13, color: "#C0392B" }}>
            <AlertCircle size={14} /> {problem}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── The flow ────────────────────────────────────────────────────────────── */

export function ProcessReturnWholesaleFlow({
  step,
  setStep,
  vendorId,
  setVendorId,
  vendorName,
  setVendorName,
  vendors,
  vendorsLoading,
  sareeTypes,
  drafts,
  setDrafts,
  canSeePrices,
  wsError,
  submitting,
  setReturnType,
  onPrintTags,
  onConfirm,
}: ProcessReturnWholesaleFlowProps) {
  const typeByCode = React.useMemo(
    () => new Map(sareeTypes.map(t => [t.code, t])),
    [sareeTypes],
  );

  const patchDraft = (key: string, patch: Partial<WholesaleReturnDraft>) =>
    setDrafts(prev => prev.map(d => (d.key === key ? { ...d, ...patch } : d)));

  const steps: FlowStep[] = [
    {
      label: "Saree Details",
      summary: vendorName.trim()
        ? `${vendorName.trim()} · ${drafts.length} saree${drafts.length === 1 ? "" : "s"}`
        : undefined,
    },
    { label: "Review & Tags" },
  ];

  const problems = drafts.map(d => draftProblem(d, drafts));
  const firstProblem = problems.find(Boolean) ?? null;
  const canProceed = vendorName.trim() !== "" && drafts.length > 0 && !firstProblem;
  const hint = !vendorName.trim()
    ? "Pick the vendor this consignment came back from"
    : firstProblem
      ? `Saree ${problems.findIndex(Boolean) + 1}: ${firstProblem}`
      : undefined;

  const totalCost = drafts.reduce((sum, d) => sum + (Number(d.price) || 0), 0);

  return (
    <div>
      <Stepper
        steps={steps}
        current={step as number}
        accent={ACCENT_WHOLESALE}
        onJump={n => setStep(n as ReturnStep)}
      />

      {/* ── Step 1 — Vendor + the pieces ── */}
      {step === 1 && (
        <>
          <StepBody>
            <StepHeader
              title="Describe the returned sarees"
              subtitle="A wholesale return arrives with no barcode, so these details are the only record we will have of each piece. Add as many sarees as the vendor sent back."
            />

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="ws-vendor" style={labelStyle}>
                Vendor / source name <span style={{ color: "#AB3832" }}>*</span>
              </label>
              <Combobox
                options={vendors.map(v => ({
                  value: v.id,
                  label: v.city ? `${v.name} · ${v.city}` : v.name,
                }))}
                value={vendorId}
                onValueChange={id => {
                  setVendorId(id);
                  setVendorName(vendors.find(v => v.id === id)?.name ?? "");
                }}
                size="lg"
                className="w-full"
                placeholder={vendorsLoading ? "Loading wholesale customers…" : "Search or select a wholesale customer"}
                searchPlaceholder="Type a name to search…"
                emptyMessage="No wholesale customer by that name"
              />
              {/* A piece can come back from someone who was never registered as
                  a wholesale customer, so the list is a shortcut, not a gate. */}
              <div style={{ marginTop: 10 }}>
                <label htmlFor="ws-vendor-free" style={{ fontFamily: F.u, fontSize: 13, color: C.muted, display: "block", marginBottom: 6 }}>
                  Not in the list? Type the name instead
                </label>
                <Input
                  id="ws-vendor-free"
                  value={vendorName}
                  onChange={e => { setVendorName(e.target.value); setVendorId(""); }}
                  placeholder="e.g. Ravi Silks"
                  size="lg"
                  className="w-full"
                />
              </div>
            </div>

            {drafts.map((d, i) => (
              <DraftCard
                key={d.key}
                draft={d}
                index={i}
                total={drafts.length}
                allDrafts={drafts}
                sareeTypes={sareeTypes}
                canSeePrices={canSeePrices}
                onChange={patch => patchDraft(d.key, patch)}
                onDuplicate={() => setDrafts(prev => {
                  const next = [...prev];
                  next.splice(i + 1, 0, duplicateDraft(d));
                  return next;
                })}
                onRemove={() => setDrafts(prev => (prev.length === 1 ? prev : prev.filter(x => x.key !== d.key)))}
              />
            ))}

            <Button
              variant="secondary" fullWidth iconLeft={Plus}
              onClick={() => setDrafts(prev => [...prev, emptyDraft()])}
              className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.45)] bg-transparent text-[#6E0F2D]"
            >
              Add another saree
            </Button>
          </StepBody>

          <FlowActions
            accent={ACCENT_WHOLESALE}
            backLabel="Change return type"
            onBack={() => { setStep("type"); setReturnType(null); }}
            primaryLabel={`Next — Review ${drafts.length} saree${drafts.length === 1 ? "" : "s"}`}
            onPrimary={() => setStep(2)}
            primaryDisabled={!canProceed}
            hint={hint}
          />
        </>
      )}

      {/* ── Step 2 — Review, tags, confirm ── */}
      {step === 2 && (
        <>
          <StepBody>
            <StepHeader
              title="Review the consignment"
              subtitle="Check every piece, print its tag, and confirm. The sarees are recorded as returns — they only become sellable once you send them to inventory from Shop Inventory."
              aside={
                <Button
                  variant="secondary" size="sm" iconLeft={Printer} onClick={onPrintTags}
                  className="rounded-full border-[rgba(110,15,45,0.45)] px-4 text-[13px] text-[#6E0F2D]"
                >
                  Print {drafts.length} tag{drafts.length === 1 ? "" : "s"}
                </Button>
              }
            />

            <SummaryPanel
              title="Consignment"
              accent={ACCENT_WHOLESALE}
              rows={([
                { label: "Vendor", value: vendorName || "—" },
                { label: "Sarees", value: `${drafts.length}`, emphasis: true },
                ...(canSeePrices && totalCost > 0
                  ? [{ label: "Total purchase value", value: formatMoney(rupees(totalCost)) }]
                  : []),
              ] as SummaryRow[])}
            />

            <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
              {drafts.map((d, i) => {
                const t = typeByCode.get(d.sareeType);
                return (
                  <div key={d.key} style={{
                    display: "flex", gap: 14, alignItems: "flex-start", padding: 14,
                    border: `1px solid ${C.bdr}`, borderRadius: 14, background: C.white,
                  }}>
                    {(d.photoPreview ?? d.photoUrl) ? (
                      <img
                        src={d.photoPreview ?? resolveAssetUrl(d.photoUrl) ?? undefined}
                        alt={`Saree ${i + 1}`}
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: `1px solid ${C.bdr}` }}
                      />
                    ) : (
                      <div aria-hidden style={{
                        width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                        background: ACCENT_WHOLESALE.soft, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Camera size={20} color="#6E0F2D" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13.5, color: "#6E0F2D" }}>
                        {d.noTagId ? "ID generated on submit" : d.sareeId}
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginTop: 3 }}>
                        {t ? `${t.code} · ${t.name}` : "No saree type"}
                        {d.color.trim() ? ` · ${d.color.trim()}` : ""}
                        {d.weight ? ` · ${d.weight} g` : ""}
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 3 }}>
                        {d.reason}{d.reason === "Other" && d.reasonNote.trim() ? ` — ${d.reasonNote.trim()}` : ""}
                      </div>
                    </div>
                    {canSeePrices && d.price.trim() && (
                      <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                        {formatMoney(rupees(Number(d.price)))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <ConsequenceNote tone="info">
              On confirm, {drafts.length === 1 ? "this saree is" : `these ${drafts.length} sarees are`} recorded
              against <strong>{vendorName}</strong> and held under <strong>Wholesale returns</strong> in Shop
              Inventory. Print and attach the tags, then send them to inventory once checked — that is what makes
              them available to sell.
            </ConsequenceNote>
          </StepBody>

          {wsError && (
            <div style={{ margin: "0 0 14px", fontFamily: F.u, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.5 }}>
              {wsError}
            </div>
          )}
          <FlowActions
            accent={ACCENT_WHOLESALE}
            tone="confirm"
            backLabel="Edit sarees"
            onBack={() => setStep(1)}
            primaryIcon={Check}
            primaryLabel={submitting ? "Recording…" : `Confirm — record ${drafts.length} return${drafts.length === 1 ? "" : "s"}`}
            onPrimary={onConfirm}
            primaryDisabled={!canProceed || submitting}
            hint={hint}
          />
        </>
      )}
    </div>
  );
}
