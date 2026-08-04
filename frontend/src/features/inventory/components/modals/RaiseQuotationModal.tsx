import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Search, CheckCircle2, ChevronDown, X, Building2, FileText, ArrowRight, Send,
} from "lucide-react";
import { FinishingReturn } from "../../../finishing/contexts/FinishingContext";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { T, F, EASE, inp } from "../theme";
import { WHOLESALE_CUSTOMERS } from "../data";
import { InvoiceData } from "../types";
import { SareePicker } from "./shared/SareePicker";
import { NoSareesNotice } from "./shared/NoSareesNotice";
import { InvoiceGenerator } from "./shared/InvoiceGenerator";
import { SareeReviewList } from "./shared/SareeReviewList";

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
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [browsing, setBrowsing] = useState(false);
  const [inv, setInv] = useState<InvoiceData>({ invoiceNumber: `QT-2026-${String(Date.now()).slice(-3)}`, invoiceDate: today, prices: {}, applyGst: false, gstPct: "5", firmId: "", paymentDueDate: "", invoiceNotes: "" });

  const filteredCustomers = WHOLESALE_CUSTOMERS.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.city.toLowerCase().includes(customerSearch.toLowerCase()));
  const selectedCustomer  = WHOLESALE_CUSTOMERS.find(c => c.id === customerId) ?? null;

  const canNext1 = !!customerId;
  const noSarees = picked.length === 0;
  // Every picked saree must carry a price — an empty map would pass the length
  // check on its own, so the count is guarded explicitly.
  const pricesComplete = picked.every(s => parseFloat(inv.prices[s.sareeId || s.id]) > 0);
  const canQuote = !noSarees && !!inv.invoiceNumber.trim() && !!inv.firmId && pricesComplete;

  const STEPS = ["Customer", "Quotation", "Sarees"];
  const QUOTE_STEP = 2;
  const nextDisabled = (step === 1 && !canNext1) || (step === QUOTE_STEP && !canQuote);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: step === QUOTE_STEP ? (browsing ? 1240 : 1100) : 680, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden", transition: "width 0.3s ease" }}>

        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={20} color={T.antiqueGold} />
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Raise Quotation</span>
              {selectedCustomer && <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>→ {selectedCustomer.name}</span>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={15} color="#FFF" /></button>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: step > i + 1 ? T.antiqueGold : step === i + 1 ? "#FFF" : "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step > i + 1 ? <CheckCircle2 size={10} color={T.deepWine} /> : <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: step === i + 1 ? T.royalBurgundy : "rgba(255,255,255,0.45)" }}>{i + 1}</span>}
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
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers…" style={{ ...inp, paddingLeft: 36 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredCustomers.map(c => (
                  <button key={c.id} onClick={() => setCustomerId(c.id)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: `1.5px solid ${customerId === c.id ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: customerId === c.id ? "rgba(110,15,45,0.04)" : "#FFF", cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: customerId === c.id ? "rgba(110,15,45,0.12)" : T.silkCream, border: `1.5px solid ${customerId === c.id ? T.royalBurgundy : T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={16} color={customerId === c.id ? T.royalBurgundy : T.taupe} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{c.name}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{c.city} · {c.phone}</div>
                    </div>
                    {customerId === c.id && <CheckCircle2 size={18} color={T.royalBurgundy} />}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link to Bulk Order <span style={{ fontWeight: 400, textTransform: "none" as const }}>(optional)</span></div>
                <div style={{ position: "relative" }}>
                  <select value={bulkOrderRef} onChange={e => setBulkOrderRef(e.target.value)} style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 }}>
                    <option value="">— Not linked to a bulk order —</option>
                    {bulkOrders.map(o => (<option key={o.ref} value={o.ref}>{o.ref} · {o.customer} · {o.total} sarees · Due {o.due}</option>))}
                  </select>
                  <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
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
                onBrowseChange={setBrowsing}
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

          {/* Step 3 — Sarees review */}
          {step === 3 && (
            <SareeReviewList
              sarees={picked}
              prices={inv.prices}
              applyGst={inv.applyGst}
              gstPct={inv.gstPct}
              docLabel="Quotation"
            />
          )}
        </div>

        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ height: 46, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
              Back
            </button>
          )}
          {step < STEPS.length ? (
            <button onClick={() => setStep(s => s + 1)} disabled={nextDisabled}
              style={{ flex: 1, height: 46, background: nextDisabled ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: nextDisabled ? T.taupe : "#FFF", cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={() => onConfirm(inv, customerId, bulkOrderRef || undefined, picked)} disabled={!canQuote}
              style={{ flex: 1, height: 46, background: !canQuote ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: !canQuote ? T.taupe : "#FFF", cursor: !canQuote ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(110,15,45,0.25)" }}>
              <Send size={16} /> Raise Quotation
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
