import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ShoppingBag, X, CheckCircle2, ArrowRight, Package, Zap,
} from "lucide-react";
import { FinishingReturn } from "@/features/finishing";
import { T, F } from "../theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { TransportData } from "../types";
import { StatusBadge } from "../common/primitives";
import { TransportForm } from "./shared/TransportForm";
import { SareePicker } from "./shared/SareePicker";
import { NoSareesNotice } from "./shared/NoSareesNotice";
import { Modal } from "../../../../shared/ui/overlay";
import { BlockedActionHint } from "../../../../shared/ui/state";
import { ReceiptUploadField } from "../../../../shared/ui/ReceiptUploadField";

// ── Dispatch to Shop modal ────────────────────────────────────────────────────
export function DispatchShopModal({ sarees, available, onConfirm, onClose }: {
  sarees: FinishingReturn[];
  available: FinishingReturn[];
  onConfirm: (transport: TransportData, opts: { skipped?: boolean; picked: FinishingReturn[]; receiptUrl?: string | null }) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [transport, setTransport] = useState<TransportData>({ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: today, notes: "" });

  // Same LR-receipt upload as ResumeDispatchModal — a dispatch completed here
  // and one completed there attach the receipt the same way.
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const canNext2 = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;
  // Nothing can be dispatched until at least one saree is on the docket.
  const noSarees = picked.length === 0;

  const STEPS = ["Sarees", "Transport & LR", "Upload Receipt", "Confirm"];

  // Why the primary action is disabled — see BlockedActionHint. The transport
  // step needs four separate fields, and a disabled Continue named none of
  // them.
  const blockers: string[] = [];
  if (noSarees) blockers.push("select at least one saree");
  if (step === 2 && !canNext2) {
    const missing = [
      !transport.lrNumber.trim() && "LR number",
      !transport.transportCompany.trim() && "transport company",
      !transport.vehicleNumber.trim() && "vehicle number",
      !transport.dispatchDate && "dispatch date",
    ].filter((v): v is string => !!v);
    blockers.push(`fill in the ${missing.join(", ")}`);
  }

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 20px 14px", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <ShoppingBag size={20} color={T.antiqueGold} className="shrink-0" />
              <Dialog.Title asChild>
                <span className="truncate" style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Dispatch to Shop</span>
              </Dialog.Title>
              <Dialog.Description className="sr-only">Dispatch sarees to a shop</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                size="sm"
                className="bg-white/12 text-white hover:bg-white/20 active:bg-white/25 shrink-0"
              />
            </Dialog.Close>
          </div>
          <div className="w-full overflow-x-auto section-nav-scroll pb-1">
            <div className="flex items-center gap-0 min-w-[500px]">
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: step > i + 1 ? T.antiqueGold : step === i + 1 ? "#FFF" : "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {step > i + 1 ? <CheckCircle2 size={12} color={T.deepWine} /> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: step === i + 1 ? T.royalBurgundy : "rgba(255,255,255,0.50)" }}>{i + 1}</span>}
                    </div>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: step === i + 1 ? "#FFF" : "rgba(255,255,255,0.45)", fontWeight: step === i + 1 ? 600 : 400, whiteSpace: "nowrap" }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.20)", margin: "0 6px" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {step === 1 && (
            <div>
              <SareePicker
                available={available}
                picked={picked}
                onChange={setPicked}
                label="Sarees going to the shop"
              />
              {noSarees ? (
                <NoSareesNotice what="send to the shop" />
              ) : (
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>{picked.length} saree{picked.length > 1 ? "s" : ""} selected for dispatch to shop.</div>
                  <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
                    {picked.map((s, i) => (
                      <div key={s.sareeId || s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderBottom: i < picked.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream }}>
                        <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{s.sareeId}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{s.sareeTypeCode || s.designCode} · {s.sareeType} · {s.weaverName}</div>
                        </div>
                        <StatusBadge status={s.inventoryStatus} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && <TransportForm data={transport} onChange={setTransport} />}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Upload the LR receipt document (photo or PDF).</div>
              <ReceiptUploadField receiptUrl={receiptUrl} onChange={setReceiptUrl} />
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>You can skip this step and upload later from Dispatch Records.</div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 16 }}>Review dispatch details before confirming.</div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "10px 20px", background: T.silkCream, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                {[
                  ["Sarees",    picked.map(s => s.sareeId).join(", ")],
                  ["LR Number", transport.lrNumber],
                  ["Transport", transport.transportCompany],
                  ["Vehicle",   transport.vehicleNumber],
                  ["Date",      transport.dispatchDate],
                  ["Driver",    transport.driverName || "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.luxuryBrown, wordBreak: "break-all" as const }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 sm:px-7 sm:py-5 border-t border-[var(--border-default)] shrink-0 bg-white w-full">
          <BlockedActionHint blockers={blockers} />
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full">
          {step > 1 && (
            <Button
              onClick={() => setStep(s => s - 1)}
              variant="secondary"
              size="md"
              className="rounded-full px-2.5 sm:px-4 text-xs sm:text-sm shrink-0"
            >
              Back
            </Button>
          )}
          {step < 4 && (
            <Button
              onClick={() => onConfirm(transport, { skipped: true, picked, receiptUrl })}
              disabled={noSarees}
              title={noSarees ? "Select at least one saree first" : "Dispatch now — fill remaining details later from Dispatch History"}
              variant="secondary"
              size="md"
              iconLeft={Zap}
              className="rounded-full border-[1.5px] border-[var(--bk-gold-500)] text-[#8B6018] whitespace-nowrap disabled:opacity-55 px-2.5 sm:px-4 text-xs sm:text-sm shrink-0"
            >
              Dispatch Now
            </Button>
          )}
          {step < 4 ? (() => {
            const blocked = noSarees || (step === 2 && !canNext2);
            return (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={blocked}
                title={noSarees ? "Select at least one saree first" : undefined}
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                className="rounded-full bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)] px-2.5 sm:px-5 text-xs sm:text-sm flex-1 min-w-0"
              >
                <span className="truncate">Continue</span>
              </Button>
            );
          })() : (
            <Button
              onClick={() => onConfirm(transport, { picked, receiptUrl })}
              disabled={noSarees}
              variant="primary"
              size="md"
              iconLeft={CheckCircle2}
              className="rounded-full bg-[linear-gradient(135deg,#1E6640_0%,#145230_100%)] shadow-[0_4px_20px_rgba(30,102,64,0.25)] px-2.5 sm:px-5 text-xs sm:text-sm flex-1 min-w-0"
            >
              <span className="truncate">Confirm Shop Dispatch</span>
            </Button>
          )}
          </div>
        </div>
    </Modal>
  );
}
