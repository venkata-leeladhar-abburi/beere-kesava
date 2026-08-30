import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Package, X, Hash, FileText, Truck, AlertTriangle, Clock, CheckCircle2, ShoppingBag } from "lucide-react";
import { FinishingReturn, DispatchRecord } from "@/features/finishing";
import { T, F } from "../theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { InventoryRecord } from "../types";
import { getSareeColor } from "../utils";
import { StatusBadge } from "../common/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { formatMoney, rupees } from "@/lib/domain/money";

const inr = (n: number) => formatMoney(rupees(n));

// ── Inventory Detail Modal ────────────────────────────────────────────────────
export function InventoryDetailModal({
  item, dispatches, returns, onClose
}: {
  item: InventoryRecord;
  dispatches: DispatchRecord[];
  returns: FinishingReturn[];
  onClose: () => void;
}) {
  const disp = dispatches.find(d => d.sareeIds.includes(item.id));
  const ret  = returns.find(r => r.sareeId === item.id);
  const isExternal = item.rawType === 'external';
  const ext = item.external;

  const infoCell = (label: string, value: React.ReactNode) => (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{value}</div>
    </div>
  );

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="sm">
        {/* Header */}
        <div style={{ background: T.deepWine, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} color={T.antiqueGold} />
            <Dialog.Title asChild>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: '#FFF' }}>Saree Record</span>
            </Dialog.Title>
            <Dialog.Description className="sr-only">Inventory record details</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close"
              onClick={onClose}
              size="sm"
              className="bg-white/12 text-white hover:bg-white/20 active:bg-white/25"
            />
          </Dialog.Close>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ID Card */}
          <div style={{ textAlign: 'center' as const, padding: '16px 20px', background: 'rgba(110,15,45,0.04)', borderRadius: 14, border: `1px solid rgba(110,15,45,0.08)` }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: '2px', textTransform: 'uppercase' as const }}>Saree Barcode ID</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: T.royalBurgundy, marginTop: 4, letterSpacing: '1px' }}>{item.id}</div>
            <div style={{ marginTop: 10 }}><StatusBadge status={item.status} /></div>
            {item.bulkOrderRef && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(200,155,71,0.10)', border: '1px solid rgba(200,155,71,0.25)', borderRadius: 999, padding: '3px 10px', fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: '#7A5310' }}>
                <Hash size={10} /> {item.bulkOrderRef}
              </div>
            )}
            {item.quotationRef && (
              <div style={{ marginTop: 8, marginLeft: item.bulkOrderRef ? 6 : 0, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(110,15,45,0.06)', border: '1px solid rgba(110,15,45,0.16)', borderRadius: 999, padding: '3px 10px', fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>
                <FileText size={10} /> {item.quotationRef}
              </div>
            )}
          </div>

          {/* Core info */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            {infoCell('Saree Type', item.sareeType)}
            {/* An external piece has its colour recorded on the purchase line;
                only a woven saree needs the id-derived fallback. */}
            {infoCell('Saree Color', isExternal ? (ext?.color || '—') : getSareeColor(item.id))}
            {infoCell(isExternal ? 'Supplier' : 'Weaver', item.weaverName)}
            {infoCell(item.rawType === 'readySaree' ? 'QC Passed Date' : isExternal ? 'Purchase Date' : 'Received Date', <span style={{ fontFamily: "var(--font-mono)" }}>{item.date || '—'}</span>)}
          </div>

          {/* External purchase */}
          {isExternal && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingBag size={14} /> External Purchase
              </div>
              <div style={{ background: 'rgba(200,155,71,0.06)', border: '1px solid rgba(200,155,71,0.18)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ext?.photoUrl && (
                  <img
                    src={ext.photoUrl}
                    alt={`Saree ${item.id}`}
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover' as const, borderRadius: 10, border: `1px solid ${T.borderDef}` }}
                  />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
                  {infoCell('Supplier', item.supplier || '—')}
                  {infoCell('Location', ext?.supplierLocation || '—')}
                  {infoCell('Purchase Order', <span style={{ fontFamily: "var(--font-mono)" }}>{ext?.purchaseId || '—'}</span>)}
                  {infoCell('Invoice No.', <span style={{ fontFamily: "var(--font-mono)" }}>{ext?.invoiceNumber || '—'}</span>)}
                  {infoCell('GST No.', <span style={{ fontFamily: "var(--font-mono)" }}>{ext?.gstNumber || '—'}</span>)}
                  {infoCell('Serial No.', <span style={{ fontFamily: "var(--font-mono)" }}>{ext?.serialCode || '—'}{ext?.pieceNo && ext?.lineQuantity && ext.lineQuantity > 1 ? ` · piece ${ext.pieceNo}/${ext.lineQuantity}` : ''}</span>)}
                  {infoCell('Weight', ext?.weight || '—')}
                  {infoCell('Payment', <span style={{ color: ext?.paymentStatus === 'Paid' ? T.green : ext?.paymentStatus === 'Partial' ? '#C07A18' : T.crimson }}>{ext?.paymentStatus || '—'}</span>)}
                  {infoCell('Cost Price', <span style={{ fontFamily: "var(--font-mono)" }}>{ext?.costPrice != null ? inr(ext.costPrice) : '—'}</span>)}
                  {infoCell('Markup', ext?.sellPercent != null ? `${ext.sellPercent}%` : '—')}
                  {infoCell('Selling Price', <span style={{ fontFamily: "var(--font-mono)", color: T.royalBurgundy, fontWeight: 700 }}>{ext?.finalAmount != null ? inr(ext.finalAmount) : '—'}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* Dispatched */}
          {item.status === 'Dispatched' && disp && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} /> Dispatch &amp; Logistics
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ background: 'rgba(30,102,64,0.03)', border: '1px solid rgba(30,102,64,0.10)', borderRadius: 12, padding: 14, gap: 12 }}>
                {infoCell('Dispatch Date', <span style={{ fontFamily: "var(--font-mono)" }}>{disp.dispatchDate}</span>)}
                {infoCell('Type', <span style={{ textTransform: 'capitalize' as const }}>{disp.type}</span>)}
                {infoCell('LR Number', <span style={{ fontFamily: "var(--font-mono)" }}>{disp.lrNumber}</span>)}
                {infoCell('Transport Co.', disp.transportCompany)}
                {infoCell('Vehicle No.', <span style={{ fontFamily: "var(--font-mono)" }}>{disp.vehicleNumber}</span>)}
                {disp.driverName ? infoCell('Driver', disp.driverName) : <div />}
                {disp.type === 'wholesale' && disp.customerName && (
                  <div style={{ gridColumn: '1 / -1', borderTop: `1px solid ${T.borderDef}`, paddingTop: 10, marginTop: 2 }}>
                    {infoCell('Customer', <span style={{ color: T.royalBurgundy, fontWeight: 700 }}>{disp.customerName}</span>)}
                    {disp.invoiceNumber && <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 4 }}>Invoice: {disp.invoiceNumber}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Damaged */}
          {item.status === 'Damaged — Review Needed' && ret && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> Damage Report
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ background: 'rgba(192,57,43,0.04)', border: '1px solid rgba(192,57,43,0.12)', borderRadius: 12, padding: 14, gap: 12 }}>
                {infoCell('Damage Type', ret.damageType || 'Unspecified')}
                {infoCell('Severity', <span style={{ color: ret.damageSeverity === 'Severe' ? T.crimson : ret.damageSeverity === 'Moderate' ? '#C07A18' : T.luxuryBrown }}>{ret.damageSeverity || 'Unspecified'}</span>)}
                {infoCell('Reported By', ret.receivedBy)}
                {infoCell('Date', <span style={{ fontFamily: "var(--font-mono)" }}>{ret.receivedDate}</span>)}
                {ret.damageNotes && (
                  <div style={{ gridColumn: '1 / -1', borderTop: 'rgba(192,57,43,0.10) solid 1px', paddingTop: 10, marginTop: 2 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontStyle: 'italic' }}>“{ret.damageNotes}”</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QC Passed */}
          {item.status === 'QC Passed' && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ background: 'rgba(200,155,71,0.06)', border: '1px solid rgba(200,155,71,0.18)', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                <Clock size={22} color="#A07020" style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: '#8B6018' }}>Awaiting Finishing Assignment</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6, lineHeight: 1.6 }}>This saree has passed QC and is in ready stock. It needs to be assigned to a finishing staff member before it can be dispatched.</div>
              </div>
            </div>
          )}

          {/* Finishing complete */}
          {item.status === 'Finishing complete' && !isExternal && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ background: 'rgba(30,102,64,0.04)', border: '1px solid rgba(30,102,64,0.12)', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                <CheckCircle2 size={22} color={T.green} style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green }}>Finishing Complete</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6, lineHeight: 1.6 }}>Finishing complete. Select this saree in the inventory table and use the Dispatch buttons to send it to the shop or a wholesale customer.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.borderDef}`, background: 'rgba(110,15,45,0.02)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <Button onClick={onClose} variant="primary">
            Close
          </Button>
        </div>
    </Modal>
  );
}
