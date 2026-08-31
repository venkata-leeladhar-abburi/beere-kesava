import { Send, Save } from "lucide-react";
import { FinishingReturn } from "@/features/finishing";
import { useFirms } from "@/features/firms";
import { useBatches } from "@/features/production";
import { T, F, inp } from "../../theme";
import { WholesaleCustomer } from "@/features/bulk-orders";
import { TransportData, InvoiceData } from "../../types";
import { Field, SelectInput } from "../../common/primitives";
import { Button, CurrencyInput, NumberInput, CheckboxField, Textarea } from "../../../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../../../shared/ui/date";
import { toPaise, fromPaise } from "../../../../../lib/gst";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import {
  DocumentThumb, InvoiceDocument, QuotationDocument, DEFAULT_LETTERHEAD_FIRM,
  type InvoiceLineItem, type LetterheadFirm,
} from "../../../../../shared/ui/document";

// ── Invoice generator (wholesale step 5) ─────────────────────────────────────
export function InvoiceGenerator({
  sarees, customer, transport, data, onChange, onSend, onDraft, onCancel, bulkOrderRef,
  mode = "invoice", embedded = false,
}: {
  sarees: FinishingReturn[];
  customer: WholesaleCustomer | null;
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
  const { batches } = useBatches();
  const set = (k: keyof InvoiceData) => (v: string | boolean | Record<string, string>) => onChange({ ...data, [k]: v });
  const setPrice = (sId: string, p: string) => onChange({ ...data, prices: { ...data.prices, [sId]: p } });

  // Part A.4/I.5 — every line converts to integer paise BEFORE summing, so
  // the total is exact by construction rather than drifting from summing
  // floats. gstPct is a percentage entered as a string, not a currency
  // value, so it stays a plain Number() parse; only money paths route
  // through toPaise.
  const subtotalPaise = sarees.reduce((sum, s) => sum + toPaise(Number(data.prices[s.sareeId || s.id]) || 0), 0);
  const gstPaise       = data.applyGst ? Math.round(subtotalPaise * (Number(data.gstPct) || 0) / 100) : 0;
  const grandTotalPaise = subtotalPaise + gstPaise;
  const subtotal        = fromPaise(subtotalPaise);
  const gstAmount        = fromPaise(gstPaise);
  const grandTotal        = fromPaise(grandTotalPaise);
  const selectedFirm = firms.find(f => f.id === data.firmId);

  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const sareeIds = sarees.map(s => s.sareeId || s.id);
  const detectedBatches = Array.from(new Set(
    sareeIds.map(id => batches.find(b => b.rows.some(row => row.sareeId === id))?.batchId).filter(Boolean)
  ));
  const batchStr = detectedBatches.length > 0 ? detectedBatches.join(", ") : "—";

  // ── Adapters onto the real document components ─────────────────────────
  // The preview renders InvoiceDocument/QuotationDocument directly, so these
  // map the generator's form state onto those components' props. Money
  // crosses over in integer paise (toPaise), never as a float, matching the
  // totals maths above.
  const docFirm: LetterheadFirm = selectedFirm
    ? {
        name: selectedFirm.firmName,
        tagline: DEFAULT_LETTERHEAD_FIRM.tagline,
        address: selectedFirm.address || DEFAULT_LETTERHEAD_FIRM.address,
        gstin: selectedFirm.gstNumber || undefined,
      }
    : DEFAULT_LETTERHEAD_FIRM;

  const docCustomer = {
    name: customer?.name ?? "—",
    address: customer?.address || customer?.city,
    phone: customer?.phone,
    gstin: customer?.gstCode,
  };

  const docItems: InvoiceLineItem[] = sarees.map(s => {
    const sId = s.sareeId || s.id;
    return {
      id: sId,
      description: [s.designCode, s.sareeType].filter(Boolean).join(" · ") || "Saree",
      batchLabel: batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId,
      ratePaise: toPaise(Number(data.prices[sId]) || 0),
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24, alignItems: "start" }}>
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
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: (k === "Bulk Order" || k === "Batch(es)") && v !== "—" ? T.royalBurgundy : T.luxuryBrown, flex: 1, wordBreak: "break-all" as const, fontWeight: (k === "Bulk Order" || k === "Batch(es)") && v !== "—" ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "12px 16px" }}>
          {/* Server-assigned: the number is allocated by the backend's sequential
              id generator when the document is saved, so it is shown read-only
              rather than typed. It was previously an editable field pre-filled
              from Date.now(), which produced random, colliding numbers. */}
          <Field label={`${docLabel} Number`}>
            <div style={{ ...inp, display: "flex", alignItems: "center", color: T.taupe, fontFamily: "var(--font-mono)", fontSize: 13 }}>
              {data.invoiceNumber || "Auto-generated on save"}
            </div>
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
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{sId}</div>
                        {sareeBatch && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{sareeBatch}</div>}
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
            <div style={{ ...inp, background: "rgba(245,232,208,0.40)", color: T.royalBurgundy, fontFamily: "var(--font-mono)", fontWeight: 600, display: "flex", alignItems: "center" }}>
              <Money value={rupees(subtotal)} />
            </div>
          </Field>

          {/* GST */}
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
            <CheckboxField
              checked={data.applyGst}
              onCheckedChange={checked => set("applyGst")(checked === true)}
              label={<span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Apply GST</span>}
            />
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
            {data.applyGst && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>% GST = <Money value={rupees(gstAmount)} /></span>}
          </div>

          <div style={{ gridColumn: "1 / -1", background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(grandTotal)} /></span>
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

      {/* Right — live document preview.
          ═══════════════════════════════════════════════════════════════════
          This panel used to be a hand-built lookalike of the invoice: its
          own gradient header, its own DataTable, its own totals stack. It
          was a second implementation of the document, so it drifted from
          the real InvoiceDocument/QuotationDocument that actually prints
          and gets sent — the preview and the output disagreed.

          It now renders the REAL document (scaled to fit the panel), so
          what the operator sees while typing is exactly the sheet that will
          be printed and downloaded. */}
      <div
        style={{
          background: T.silkCream,
          border: `1.5px solid ${T.borderGold}`,
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 24px rgba(200,155,71,0.12)",
          position: "sticky",
          top: 0,
        }}
      >
        <div
          style={{
            fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe,
            textTransform: "uppercase" as const, letterSpacing: "0.05em",
            textAlign: "center" as const, marginBottom: 12,
          }}
        >
          Live {docLabel} Preview
        </div>

        <DocumentThumb>
          {isQuotation ? (
            <QuotationDocument
              quotationNumber={data.invoiceNumber || "Auto-generated on save"}
              quotationDate={data.invoiceDate || todayStr}
              validUntil={data.paymentDueDate || undefined}
              firm={docFirm}
              customer={docCustomer}
              items={docItems}
              estGstPct={data.applyGst ? Number(data.gstPct) || undefined : undefined}
              bulkOrderRef={bulkOrderRef || undefined}
              notes={data.invoiceNotes || undefined}
            />
          ) : (
            <InvoiceDocument
              invoiceNumber={data.invoiceNumber || "Auto-generated on save"}
              invoiceDate={data.invoiceDate || todayStr}
              dueDate={data.paymentDueDate || undefined}
              firm={docFirm}
              customer={docCustomer}
              items={docItems}
              applyGst={!!data.applyGst}
              bulkOrderRef={bulkOrderRef || undefined}
              dispatch={{
                lrNumber: transport.lrNumber,
                transportCompany: transport.transportCompany,
                vehicleNumber: transport.vehicleNumber,
                dispatchDate: transport.dispatchDate,
              }}
              notes={data.invoiceNotes || undefined}
            />
          )}
        </DocumentThumb>

        <div
          style={{
            fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic",
            textAlign: "center" as const, marginTop: 12,
          }}
        >
          This preview is the document — it updates live as you fill the form
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
          className="flex-1 rounded-[14px] shadow-[0_4px_20px_rgba(110,15,45,0.25)]"
        >
          {isQuotation ? "Send Quotation to Customer" : "Send Invoice to Customer"}
        </Button>
        <Button variant="secondary" size="lg" iconLeft={Save} onClick={onDraft} className="rounded-[14px]">
          Save as Draft
        </Button>
        <Button variant="tertiary" size="lg" onClick={onCancel} className="rounded-[14px]">
          Cancel
        </Button>
      </div>
      )}
    </div>
  );
}
