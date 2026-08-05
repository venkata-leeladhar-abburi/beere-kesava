import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Search, CheckCircle2, ChevronDown, X, Building2, ShoppingBag, FileText,
  Upload, ArrowRight, Users, Truck, Zap,
} from "lucide-react";
import { useFinishing, FinishingReturn } from "../../../../finishing/contexts/FinishingContext";
import { useBulkOrders } from "../../../../bulk-orders/contexts/BulkOrderContext";
import { useBatches } from "../../../../production/contexts/BatchContext";
import { T, F, EASE, inp } from "../../theme";
import { WHOLESALE_CUSTOMERS } from "../../data";
import { TransportData, InvoiceData } from "../../types";
import { TransportForm } from "../shared/TransportForm";
import { SareePicker } from "../shared/SareePicker";
import { NoSareesNotice } from "../shared/NoSareesNotice";
import { InvoiceGenerator } from "../shared/InvoiceGenerator";
import { SareeReviewList } from "../shared/SareeReviewList";

// ── Dispatch to Wholesale modal ───────────────────────────────────────────────
// Customer → Quotation (optional) → Tax Invoice → Sarees → Transport → Receipt.
// Picking a previously raised quotation pre-fills the invoice; everything stays
// editable. Skipping it goes straight to a fresh invoice where sarees are added
// by scan or from inventory.
export function DispatchWholesaleModal({ sarees, available, onConfirm, onClose, initialBulkOrderRef, initialCustomerId }: {
  sarees: FinishingReturn[];
  available: FinishingReturn[];
  onConfirm: (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef: string | undefined, opts: { skipped?: boolean; picked: FinishingReturn[]; quotationRef?: string }) => void;
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
  const { batches } = useBatches();
  const { quotations } = useFinishing();
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [browsing, setBrowsing] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");
  const [transport, setTransport] = useState<TransportData>({ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: today, notes: "", expectedDelivery: "", specialInstructions: "" });
  const [inv, setInv] = useState<InvoiceData>({ invoiceNumber: `INV-2026-${String(Date.now()).slice(-3)}`, invoiceDate: today, prices: {}, applyGst: false, gstPct: "18", firmId: "", paymentDueDate: "", invoiceNotes: "" });

  const filteredCustomers = WHOLESALE_CUSTOMERS.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.city.toLowerCase().includes(customerSearch.toLowerCase()));
  const selectedCustomer  = WHOLESALE_CUSTOMERS.find(c => c.id === customerId) ?? null;

  // Quotations already raised for this customer and not yet dispatched.
  const customerQuotations = useMemo(
    () => quotations.filter(q => q.customerId === customerId && q.status !== "dispatched"),
    [quotations, customerId]
  );
  const chosenQuotation = customerQuotations.find(q => q.id === quotationId) ?? null;

  // Pull a quotation's sarees, prices, GST and firm into the invoice. Everything
  // stays editable afterwards.
  const applyQuotation = (qId: string) => {
    const q = customerQuotations.find(x => x.id === qId);
    setQuotationId(qId);
    if (!q) return;
    setPicked(q.sarees.map(s => ({
      id: s.sareeId,
      assignmentId: `QT:${q.quotationNumber}`,
      sareeId: s.sareeId,
      designCode: s.designCode,
      sareeTypeCode: s.sareeTypeCode,
      sareeType: s.sareeType,
      weaverName: s.weaverName,
      condition: "perfect" as const,
      receivedBy: "Admin",
      receivedDate: q.quotationDate,
      inventoryStatus: "Ready for Dispatch" as const,
      quotationRef: q.quotationNumber,
    })));
    setInv(prev => ({
      ...prev,
      prices: { ...q.prices },
      applyGst: q.applyGst,
      gstPct: q.gstPct,
      firmId: q.firmId || prev.firmId,
      invoiceNotes: q.notes || prev.invoiceNotes,
    }));
    if (q.bulkOrderRef) setBulkOrderRef(q.bulkOrderRef);
  };

  const clearQuotation = () => { setQuotationId(""); setPicked(sarees); };

  const canNext1 = !!customerId;
  const noSarees = picked.length === 0;
  // Every picked saree must carry a price — an empty map would pass a length
  // check on its own, so the count is guarded explicitly.
  const pricesComplete = picked.every(s => parseFloat(inv.prices[s.sareeId || s.id]) > 0);
  const canInvoice = !noSarees && !!inv.invoiceNumber.trim() && !!inv.firmId && pricesComplete;
  const canTransport = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;

  const STEPS = ["Customer", "Quotation", "Tax Invoice", "Sarees", "Transport & LR", "Upload Receipt"];
  const QUOTATION_STEP = 2;
  const INVOICE_STEP = 3;
  const REVIEW_STEP = 4;
  const TRANSPORT_STEP = 5;
  const nextDisabled = (step === 1 && !canNext1) || (step === INVOICE_STEP && !canInvoice) || (step === REVIEW_STEP && noSarees) || (step === TRANSPORT_STEP && !canTransport);
  const confirmOpts = { picked, quotationRef: chosenQuotation?.quotationNumber };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: step === INVOICE_STEP ? (browsing ? 1240 : 1100) : 680, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden", transition: "width 0.3s ease" }}>

        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={20} color={T.antiqueGold} />
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Dispatch to Wholesale</span>
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
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>Select the wholesale customer for this dispatch.</div>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers…"
                  style={{ ...inp, paddingLeft: 36 }} />
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

              {/* Bulk Order linkage */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link to Bulk Order <span style={{ fontWeight: 400, textTransform: "none" as const }}>(optional)</span></div>
                <div style={{ position: "relative" }}>
                  <select
                    value={bulkOrderRef}
                    onChange={e => setBulkOrderRef(e.target.value)}
                    style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 }}
                  >
                    <option value="">— Not linked to a bulk order —</option>
                    {bulkOrders.map(o => (
                      <option key={o.ref} value={o.ref}>{o.ref} · {o.customer} · {o.total} sarees · Due {o.due}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
                {bulkOrderRef && (() => {
                  const linked = bulkOrders.find(o => o.ref === bulkOrderRef);
                  return linked ? (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(110,15,45,0.04)", border: `1.5px solid rgba(110,15,45,0.14)`, borderRadius: 10 }}>
                      <ShoppingBag size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{linked.ref}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{linked.customer} · {linked.total} sarees · Due {linked.due}</div>
                      </div>
                      <div style={{ background: linked.status === "on-track" ? "rgba(30,102,64,0.10)" : "rgba(192,57,43,0.10)", border: `1px solid ${linked.status === "on-track" ? "rgba(30,102,64,0.22)" : "rgba(192,57,43,0.22)"}`, borderRadius: 6, padding: "3px 8px" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: linked.status === "on-track" ? T.green : T.crimson }}>{linked.status}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* Step 2 — Previously raised quotations (optional) */}
          {step === QUOTATION_STEP && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>
                Pick a quotation already raised for {selectedCustomer?.name} to carry its sarees and prices into the invoice — or continue without one and build the invoice from scratch.
              </div>

              {customerQuotations.length === 0 ? (
                <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" as const }}>
                  <FileText size={26} color={T.taupe} style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>No open quotations for this customer</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 5 }}>Continue to the tax invoice and add sarees there.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {customerQuotations.map(q => {
                    const on = quotationId === q.id;
                    return (
                      <button key={q.id} onClick={() => (on ? clearQuotation() : applyQuotation(q.id))}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1.5px solid ${on ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: on ? "rgba(110,15,45,0.04)" : "#FFF", cursor: "pointer", textAlign: "left" as const }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: on ? "rgba(110,15,45,0.12)" : T.silkCream, border: `1.5px solid ${on ? T.royalBurgundy : T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={16} color={on ? T.royalBurgundy : T.taupe} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{q.quotationNumber}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const, color: q.status === "received" ? T.green : "#8B6018", background: q.status === "received" ? T.greenBg : "rgba(200,155,71,0.14)", borderRadius: 20, padding: "2px 9px" }}>{q.status.replace(/-/g, " ")}</span>
                            {q.bulkOrderRef && <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 6px", borderRadius: 4 }}>{q.bulkOrderRef}</span>}
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                            {q.quotationDate} · {q.sarees.length} saree{q.sarees.length === 1 ? "" : "s"} · {q.firmName || "—"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{q.grandTotal.toLocaleString("en-IN")}</div>
                          {on && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginTop: 3 }}>Tap to unlink</div>}
                        </div>
                        {on && <CheckCircle2 size={18} color={T.royalBurgundy} style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {chosenQuotation && (
                <div style={{ marginTop: 16, background: T.greenBg, border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <CheckCircle2 size={17} color={T.green} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.6 }}>
                    <strong>{chosenQuotation.quotationNumber}</strong> loaded — {chosenQuotation.sarees.length} saree{chosenQuotation.sarees.length === 1 ? "" : "s"} and their prices are carried into the tax invoice. You can add, remove or reprice anything on the next step.
                  </div>
                </div>
              )}

              {!chosenQuotation && customerQuotations.length > 0 && (
                <button onClick={() => setStep(INVOICE_STEP)}
                  style={{ marginTop: 16, width: "100%", height: 44, background: "transparent", border: `1.5px dashed ${T.borderMed}`, borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                  Skip — raise a tax invoice without a quotation
                </button>
              )}
            </div>
          )}

          {/* Step 3 — Tax Invoice (sarees are added here) */}
          {step === INVOICE_STEP && (
            <div>
              {chosenQuotation && (
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(110,15,45,0.04)", border: `1.5px solid rgba(110,15,45,0.14)`, borderRadius: 10 }}>
                  <FileText size={15} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                    Prefilled from quotation <strong style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{chosenQuotation.quotationNumber}</strong> — edit freely.
                  </span>
                </div>
              )}
              <SareePicker
                available={available}
                picked={picked}
                onChange={setPicked}
                onBrowseChange={setBrowsing}
                label="Sarees on this invoice"
              />
              {noSarees ? (
                <NoSareesNotice what="send to wholesale" />
              ) : (
                <InvoiceGenerator
                  sarees={picked}
                  customer={selectedCustomer}
                  transport={transport}
                  data={inv}
                  onChange={setInv}
                  bulkOrderRef={bulkOrderRef || undefined}
                  embedded
                  onSend={() => {}}
                  onDraft={() => {}}
                  onCancel={onClose}
                />
              )}
            </div>
          )}

          {/* Step 4 — Sarees review */}
          {step === REVIEW_STEP && (
            <div>
              {bulkOrderRef && (() => {
                const linked = bulkOrders.find(o => o.ref === bulkOrderRef);
                return linked ? (
                  <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(110,15,45,0.05)", border: `1.5px solid rgba(110,15,45,0.16)`, borderRadius: 12 }}>
                    <ShoppingBag size={18} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{linked.ref}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{linked.customer} · {linked.total} sarees · Due {linked.due}</div>
                    </div>
                    <div style={{ background: linked.status === "on-track" ? "rgba(30,102,64,0.10)" : "rgba(192,57,43,0.10)", border: `1px solid ${linked.status === "on-track" ? "rgba(30,102,64,0.22)" : "rgba(192,57,43,0.22)"}`, borderRadius: 6, padding: "3px 8px" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: linked.status === "on-track" ? T.green : T.crimson }}>{linked.status}</span>
                    </div>
                  </div>
                ) : null;
              })()}
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 12 }}>
                Invoice <strong style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{inv.invoiceNumber}</strong> for {selectedCustomer?.name}
                {chosenQuotation && <> · from quotation <strong style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{chosenQuotation.quotationNumber}</strong></>}
              </div>
              <SareeReviewList
                sarees={picked}
                prices={inv.prices}
                applyGst={inv.applyGst}
                gstPct={inv.gstPct}
                docLabel="Invoice"
              />
            </div>
          )}

          {step === TRANSPORT_STEP && <TransportForm data={transport} onChange={setTransport} wholesale />}

          {step === STEPS.length && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Upload the LR receipt document for this wholesale dispatch. You can skip this and upload later from Dispatch Records.</div>
              <div style={{ border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 14, padding: "40px 24px", textAlign: "center" as const, cursor: "pointer", background: T.silkCream }}>
                <Upload size={32} color={T.taupe} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Click to upload LR receipt</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>JPG, PNG or PDF — max 10 MB</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ height: 46, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
              Back
            </button>
          )}
          {(step === INVOICE_STEP || step === REVIEW_STEP) && (
            <button onClick={() => onConfirm(transport, inv, customerId, bulkOrderRef || undefined, { ...confirmOpts, skipped: true })} disabled={!canInvoice}
              title={canInvoice ? "Dispatch now — fill transport & receipt later from Dispatch History" : "Add sarees and prices first"}
              style={{ height: 46, padding: "0 18px", background: "transparent", border: `1.5px solid ${!canInvoice ? T.borderMed : T.antiqueGold}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: !canInvoice ? T.taupe : "#8B6018", cursor: !canInvoice ? "not-allowed" : "pointer", opacity: !canInvoice ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" as const }}>
              <Zap size={14} /> Dispatch Now
            </button>
          )}
          {step < STEPS.length ? (
            <button onClick={() => setStep(s => s + 1)} disabled={nextDisabled}
              style={{ flex: 1, height: 46, background: nextDisabled ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: nextDisabled ? T.taupe : "#FFF", cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={() => onConfirm(transport, inv, customerId, bulkOrderRef || undefined, confirmOpts)} disabled={!canInvoice}
              style={{ flex: 1, height: 46, background: !canInvoice ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: !canInvoice ? T.taupe : "#FFF", cursor: !canInvoice ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: !canInvoice ? "none" : "0 4px 20px rgba(110,15,45,0.25)" }}>
              <Truck size={16} /> Confirm &amp; Dispatch
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
