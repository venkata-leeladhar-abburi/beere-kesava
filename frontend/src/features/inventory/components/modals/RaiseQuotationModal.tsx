import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CheckCircle2, X, Building2, FileText, ArrowRight, Send,
} from "lucide-react";
import { FinishingReturn } from "@/features/finishing";
import { useBulkOrders } from "@/features/bulk-orders";
import { useFirms } from "@/features/firms";
import { useBatches } from "@/features/production";
import { T, F } from "../theme";
import { Button, IconButton, SearchInput } from "../../../../shared/ui/primitives";
import { useAllWholesaleCustomers } from "@/features/bulk-orders";
import { InvoiceData } from "../types";
import { SareePicker } from "./shared/SareePicker";
import { NoSareesNotice } from "./shared/NoSareesNotice";
import { InvoiceGenerator } from "./shared/InvoiceGenerator";
import { SelectInput } from "../common/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DocumentViewer, QuotationDocument, toQuotationItems, DEFAULT_LETTERHEAD_FIRM } from "../../../../shared/ui/document";

// ── Raise Quotation modal (Customer → Quotation → Sarees) ─────────────────────
// Sarees are added inside the Quotation step — by scan or from inventory — so
// the flow works whether or not anything was ticked on the page first.
export function RaiseQuotationModal({ sarees, available, onConfirm, onClose, initialBulkOrderRef, initialCustomerId }: {
  sarees: FinishingReturn[];
  available: FinishingReturn[];
  onConfirm: (inv: InvoiceData, customerId: string, bulkOrderRef: string | undefined, picked: FinishingReturn[]) => void;
  onClose: () => void;
  initialBulkOrderRef?: string;
  initialCustomerId?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState(initialCustomerId || "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [bulkOrderRef, setBulkOrderRef] = useState(initialBulkOrderRef || "");
  const { bulkOrders } = useBulkOrders();
  const { firms } = useFirms();
  const { batches } = useBatches();
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [inv, setInv] = useState<InvoiceData>({ invoiceNumber: `QT-2026-${String(Date.now()).slice(-3)}`, invoiceDate: today, prices: {}, applyGst: false, gstPct: "5", firmId: "", paymentDueDate: "", invoiceNotes: "" });

  const wholesaleCustomersList = useAllWholesaleCustomers();
  const filteredCustomers = wholesaleCustomersList.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.city.toLowerCase().includes(customerSearch.toLowerCase()));
  const selectedCustomer  = wholesaleCustomersList.find(c => c.id === customerId) ?? null;

  const canNext1 = !!customerId;
  const noSarees = picked.length === 0;
  // Every picked saree must carry a price — an empty map would pass the length
  // check on its own, so the count is guarded explicitly.
  const pricesComplete = picked.every(s => (Number(inv.prices[s.sareeId || s.id]) || 0) > 0);
  const canQuote = !noSarees && !!inv.invoiceNumber.trim() && !!inv.firmId && pricesComplete;

  const STEPS = ["Customer", "Quotation", "Sarees"];
  const QUOTE_STEP = 2;
  const nextDisabled = (step === 1 && !canNext1) || (step === QUOTE_STEP && !canQuote);

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={20} color={T.antiqueGold} />
              <Dialog.Title asChild>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Raise Quotation</span>
              </Dialog.Title>
              {selectedCustomer && <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>→ {selectedCustomer.name}</span>}
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                size="sm"
                className="bg-white/12 text-white hover:bg-white/20 active:bg-white/25"
              />
            </Dialog.Close>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: step > i + 1 ? T.antiqueGold : step === i + 1 ? "#FFF" : "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step > i + 1 ? <CheckCircle2 size={10} color={T.deepWine} /> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: step === i + 1 ? T.royalBurgundy : "rgba(255,255,255,0.45)" }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: step === i + 1 ? "#FFF" : "rgba(255,255,255,0.40)", fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Step 1 — Customer */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>Select the customer for this quotation.</div>
              <div style={{ marginBottom: 14 }}>
                <SearchInput value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers…" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredCustomers.map(c => (
                  <Button
                    key={c.id}
                    onClick={() => setCustomerId(c.id)}
                    variant="secondary"
                    className={
                      "h-auto justify-start gap-3.5 rounded-xl border-[1.5px] px-4 py-3 text-left " +
                      (customerId === c.id ? "border-[var(--bk-burgundy-900)] bg-[rgba(110,15,45,0.04)]" : "border-[var(--border-default)] bg-white")
                    }
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: customerId === c.id ? "rgba(110,15,45,0.12)" : T.silkCream, border: `1.5px solid ${customerId === c.id ? T.royalBurgundy : T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={16} color={customerId === c.id ? T.royalBurgundy : T.taupe} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{c.name}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{c.city} · {c.phone}</div>
                    </div>
                    {customerId === c.id && <CheckCircle2 size={18} color={T.royalBurgundy} />}
                  </Button>
                ))}
              </div>
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link to Bulk Order <span style={{ fontWeight: 400, textTransform: "none" as const }}>(optional)</span></div>
                <SelectInput value={bulkOrderRef} onChange={setBulkOrderRef}>
                  <option value="">— Not linked to a bulk order —</option>
                  {bulkOrders.map(o => (<option key={o.ref} value={o.ref}>{o.ref} · {o.customer} · {o.total} sarees · Due {o.due}</option>))}
                </SelectInput>
              </div>
            </div>
          )}

          {/* Step 2 — Quotation (sarees are added here) */}
          {step === QUOTE_STEP && (
            <div>
              <SareePicker
                available={available}
                picked={picked}
                onChange={setPicked}
                label="Sarees on this quotation"
              />
              {noSarees ? (
                <NoSareesNotice what="quote for" />
              ) : (
                <InvoiceGenerator
                  sarees={picked}
                  customer={selectedCustomer}
                  transport={{ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: "", notes: "" }}
                  data={inv}
                  onChange={setInv}
                  bulkOrderRef={bulkOrderRef || undefined}
                  mode="quotation"
                  embedded
                  onSend={() => {}}
                  onDraft={() => {}}
                  onCancel={onClose}
                />
              )}
            </div>
          )}

          {/* Step 3 — the real QuotationDocument (Part H.2), not the old
              hand-rolled review list — this is the actual document that gets
              printed/sent, so what's reviewed here is what the customer
              sees, not a summary of it. */}
          {step === 3 && (
            <div style={{ height: "60vh", border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
              <DocumentViewer>
                <QuotationDocument
                  quotationNumber={inv.invoiceNumber}
                  quotationDate={inv.invoiceDate || today}
                  firm={firms.find(f => f.id === inv.firmId)
                    ? { name: firms.find(f => f.id === inv.firmId)!.firmName, address: firms.find(f => f.id === inv.firmId)!.address, gstin: firms.find(f => f.id === inv.firmId)!.gstNumber }
                    : DEFAULT_LETTERHEAD_FIRM}
                  customer={{ name: selectedCustomer?.name ?? "—", address: selectedCustomer?.address, phone: selectedCustomer?.phone, city: selectedCustomer?.city }}
                  items={toQuotationItems(
                    picked.map(s => ({ id: s.id, sareeId: s.sareeId, designCode: s.designCode, sareeType: s.sareeType })),
                    sId => batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId,
                    inv.prices
                  )}
                  estGstPct={inv.applyGst ? Number(inv.gstPct) || undefined : undefined}
                  bulkOrderRef={bulkOrderRef || undefined}
                  notes={inv.invoiceNotes || undefined}
                />
              </DocumentViewer>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {step > 1 && (
            <Button onClick={() => setStep(s => s - 1)} variant="secondary" size="lg" className="rounded-full">
              Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={nextDisabled}
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              fullWidth
              className="rounded-full bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)]"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={() => onConfirm(inv, customerId, bulkOrderRef || undefined, picked)}
              disabled={!canQuote}
              variant="primary"
              size="lg"
              iconLeft={Send}
              fullWidth
              className="rounded-full bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)] shadow-[0_4px_20px_rgba(110,15,45,0.25)]"
            >
              Raise Quotation
            </Button>
          )}
        </div>
    </Modal>
  );
}
