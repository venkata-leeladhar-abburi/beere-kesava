import React from "react";
import { ShoppingBag, Send, Save } from "lucide-react";
import { FinishingReturn } from "../../../../finishing/contexts/FinishingContext";
import { useFirms } from "../../../../firms/contexts/FirmsContext";
import { useBulkOrders } from "../../../../bulk-orders/contexts/BulkOrderContext";
import { useBatches } from "../../../../production/contexts/BatchContext";
import { T, F, inp } from "../../theme";
import { WHOLESALE_CUSTOMERS } from "../../data";
import { TransportData, InvoiceData } from "../../types";
import { Field, TextInput, SelectInput } from "../../common/primitives";
import { Button, CurrencyInput, NumberInput, Checkbox, Textarea } from "../../../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../../../shared/ui/date";

// ── Invoice generator (wholesale step 5) ─────────────────────────────────────
export function InvoiceGenerator({
  sarees, customer, transport, data, onChange, onSend, onDraft, onCancel, bulkOrderRef,
  mode = "invoice", embedded = false,
}: {
  sarees: FinishingReturn[];
  customer: typeof WHOLESALE_CUSTOMERS[0] | null;
  transport: TransportData;
  data: InvoiceData;
  onChange: (d: InvoiceData) => void;
  onSend: () => void;
  onDraft: () => void;
  onCancel: () => void;
  bulkOrderRef?: string;
  mode?: "invoice" | "quotation";
  embedded?: boolean;
}) {
  const isQuotation = mode === "quotation";
  const docLabel = isQuotation ? "Quotation" : "Invoice";
  const { firms } = useFirms();
  const { bulkOrders } = useBulkOrders();
  const { batches } = useBatches();
  const linkedOrder = bulkOrders.find(o => o.ref === bulkOrderRef);
  const set = (k: keyof InvoiceData) => (v: string | boolean | Record<string, string>) => onChange({ ...data, [k]: v });
  const setPrice = (sId: string, p: string) => onChange({ ...data, prices: { ...data.prices, [sId]: p } });

  const qty          = sarees.length;
  const subtotal     = sarees.reduce((sum, s) => sum + (parseFloat(data.prices[s.sareeId || s.id]) || 0), 0);
  const gstAmount    = data.applyGst ? subtotal * (parseFloat(data.gstPct) || 0) / 100 : 0;
  const grandTotal   = subtotal + gstAmount;
  const selectedFirm = firms.find(f => f.id === data.firmId);

  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const sareeIds = sarees.map(s => s.sareeId || s.id);
  const detectedBatches = Array.from(new Set(
    sareeIds.map(id => batches.find(b => b.rows.some(row => row.sareeId === id))?.batchId).filter(Boolean)
  ));
  const batchStr = detectedBatches.length > 0 ? detectedBatches.join(", ") : "—";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* Left — form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Auto-filled (read-only)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["Customer",     customer?.name ?? "—"],
              ["Bulk Order",   bulkOrderRef || "—"],
              ["Batch(es)",    batchStr],
              ["Dispatch Date",transport.dispatchDate],
              ["LR Number",   transport.lrNumber],
              ["Transport",   transport.transportCompany],
              ["Sarees",      sarees.map(s => s.sareeId).join(", ")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, minWidth: 110, flexShrink: 0 }}>{k}</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: (k === "Bulk Order" || k === "Batch(es)") && v !== "—" ? T.royalBurgundy : T.luxuryBrown, flex: 1, wordBreak: "break-all" as const, fontWeight: (k === "Bulk Order" || k === "Batch(es)") && v !== "—" ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          <Field label={`${docLabel} Number`} req>
            <TextInput value={data.invoiceNumber} onChange={set("invoiceNumber") as (v: string) => void} placeholder={isQuotation ? "QT-2026-001" : "INV-2026-001"} mono />
          </Field>
          <Field label={`${docLabel} Date`} req>
            <DatePicker value={data.invoiceDate ? new Date(data.invoiceDate) : null} onChange={d => set("invoiceDate")(d ? formatDate(d, "iso") : "")} />
          </Field>

          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Enter Price per Saree *</div>
            <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFF" }}>
              {sarees.map((s, i) => {
                const sId = s.sareeId || s.id;
                const sareeBatch = batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < sarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{sId}</div>
                        {sareeBatch && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{sareeBatch}</div>}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{s.designCode} · {s.sareeType}</div>
                    </div>
                    <div style={{ width: 120 }}>
                      <CurrencyInput
                        value={data.prices[sId] ? Number(data.prices[sId]) : ""}
                        onValueChange={v => setPrice(sId, v === "" ? "" : String(v))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="Total Amount">
            <div style={{ ...inp, background: "rgba(245,232,208,0.40)", color: T.royalBurgundy, fontFamily: F.mono, fontWeight: 600, display: "flex", alignItems: "center" }}>
              ₹{subtotal.toLocaleString("en-IN")}
            </div>
          </Field>

          {/* GST */}
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Checkbox checked={data.applyGst} onCheckedChange={checked => set("applyGst")(checked === true)} />
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Apply GST</span>
            </label>
            {data.applyGst && (
              <NumberInput
                value={data.gstPct === "" ? "" : Number(data.gstPct)}
                onValueChange={v => set("gstPct")(v === "" ? "" : String(v))}
                placeholder="%"
                min={0}
                max={100}
                className="w-[70px] text-center font-code text-[13px]"
              />
            )}
            {data.applyGst && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>% GST = ₹{gstAmount.toLocaleString("en-IN")}</span>}
          </div>

          <div style={{ gridColumn: "1 / -1", background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
            <span style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={`${docLabel} raised by (Firm)`} req>
              <SelectInput value={data.firmId} onChange={set("firmId") as (v: string) => void}>
                <option value="">Select firm…</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
              </SelectInput>
            </Field>
          </div>

          {!isQuotation && (
          <Field label="Payment Due Date">
            <DatePicker value={data.paymentDueDate ? new Date(data.paymentDueDate) : null} onChange={d => set("paymentDueDate")(d ? formatDate(d, "iso") : "")} />
          </Field>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Additional Notes">
              <Textarea
                value={data.invoiceNotes}
                onChange={e => set("invoiceNotes")(e.target.value)}
                rows={2}
                placeholder={`Any notes for this ${docLabel.toLowerCase()}…`}
                className="resize-none leading-[1.55]"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Right — live invoice preview */}
      <div style={{ background: "#FFFDF9", border: `1.5px solid ${T.borderGold}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(200,155,71,0.12)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "18px 24px" }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>
            {selectedFirm?.firmName ?? "Beere Kesava & Brothers Silks"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
            {selectedFirm?.address ?? "Hyderabad, Telangana"}
          </div>
          {selectedFirm?.gstNumber && (
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, marginTop: 4 }}>GST: {selectedFirm.gstNumber}</div>
          )}
        </div>

        <div style={{ padding: "18px 24px" }}>
          {/* Invoice meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.borderDef}` }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.royalBurgundy }}>{isQuotation ? "QUOTATION" : "TAX INVOICE"}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{data.invoiceNumber || (isQuotation ? "QT-XXXX" : "INV-XXXX")}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>Date: {data.invoiceDate || todayStr}</div>
              {bulkOrderRef && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.07)", border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 6, padding: "3px 8px", width: "fit-content" }}>
                    <ShoppingBag size={10} color={T.royalBurgundy} />
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrderRef}</span>
                  </div>
                  {linkedOrder && (
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1, textTransform: "capitalize" as const, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {linkedOrder.sareeType.split(" · ")[0]} · {linkedOrder.design}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" as const, maxWidth: "55%" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Bill To</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{customer?.name ?? "—"}</div>
              {customer?.address ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3, lineHeight: 1.4 }}>{customer.address}</div>
              ) : (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>{customer?.city}</div>
              )}
              {customer?.phone && (
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{customer.phone}</div>
              )}
              {customer?.gstCode && (
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginTop: 2 }}>GST: {customer.gstCode}</div>
              )}
            </div>
          </div>

          {/* Sarees table */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "6px 0", borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 4 }}>
              {["Item", "Amount (₹)"].map((h, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i > 0 ? "right" as const : "left" as const }}>{h}</div>
              ))}
            </div>
            {sarees.slice(0, 4).map((s, i) => {
              const sId = s.sareeId || s.id;
              const sareeBatch = batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId;
              const p = parseFloat(data.prices[sId]) || 0;
              return (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "5px 0", borderBottom: i < Math.min(sarees.length, 4) - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{sId}</span>
                      {sareeBatch && (
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{sareeBatch}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.designCode} · {s.sareeType}</div>
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const }}>₹{p ? p.toLocaleString("en-IN") : "—"}</div>
                </div>
              );
            })}
            {sarees.length > 4 && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, padding: "5px 0" }}>+ {sarees.length - 4} more sarees…</div>
            )}
          </div>

          {/* Totals */}
          <div style={{ borderTop: `1.5px solid ${T.borderDef}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Subtotal ({qty} sarees)</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {data.applyGst && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>GST ({data.gstPct}%)</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
              <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            {data.paymentDueDate && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>Payment due: {data.paymentDueDate}</div>
            )}
          </div>

          {/* Dispatch details */}
          {!isQuotation && (
          <div style={{ marginTop: 14, background: T.silkCream, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Dispatch Details</div>
            {bulkOrderRef && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(110,15,45,0.06)", border: `1px solid rgba(110,15,45,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bulk Order: </span>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrderRef}</span>
              </div>
            )}
            {detectedBatches.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(200,155,71,0.06)", border: `1px solid rgba(200,155,71,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Production Batch: </span>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{batchStr}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
              {[
                ["LR Number", transport.lrNumber || "—"],
                ["Transport", transport.transportCompany || "—"],
                ["Vehicle",   transport.vehicleNumber || "—"],
                ["Date",      transport.dispatchDate || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{k}: </span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Action buttons — full width below both columns */}
      {!embedded && (
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          iconLeft={Send}
          onClick={onSend}
          className="flex-1 rounded-full shadow-[0_4px_20px_rgba(110,15,45,0.25)]"
        >
          {isQuotation ? "Send Quotation to Customer" : "Send Invoice to Customer"}
        </Button>
        <Button variant="secondary" size="lg" iconLeft={Save} onClick={onDraft} className="rounded-full">
          Save as Draft
        </Button>
        <Button variant="tertiary" size="lg" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
      </div>
      )}
    </div>
  );
}
