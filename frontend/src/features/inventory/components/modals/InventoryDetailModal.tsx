import React from "react";
import { motion } from "motion/react";
import { Package, X, Hash, FileText, Truck, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { FinishingReturn, DispatchRecord } from "../../../finishing/contexts/FinishingContext";
import { T, F } from "../theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { InventoryRecord } from "../types";
import { getSareeColor } from "../utils";
import { StatusBadge } from "../common/primitives";

// ── Inventory Detail Modal ────────────────────────────────────────────────────
const INV_EASE = [0.25, 0.1, 0.25, 1] as const;
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

  const infoCell = (label: string, value: React.ReactNode) => (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{value}</div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(61,14,26,0.55)', backdropFilter: 'blur(5px)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.25, ease: INV_EASE }}
        style={{ position: 'relative', width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: '#FFFDF9', borderRadius: 20, boxShadow: '0 32px 80px rgba(61,14,26,0.28)', overflow: 'hidden', border: `1px solid ${T.borderDef}` }}
      >
        {/* Header */}
        <div style={{ background: T.deepWine, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} color={T.antiqueGold} />
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: '#FFF' }}>Saree Record</span>
          </div>
          <IconButton
            icon={X}
            label="Close"
            onClick={onClose}
            size="sm"
            className="bg-white/12 text-white hover:bg-white/20 active:bg-white/25"
          />
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ID Card */}
          <div style={{ textAlign: 'center' as const, padding: '16px 20px', background: 'rgba(110,15,45,0.04)', borderRadius: 14, border: `1px solid rgba(110,15,45,0.08)` }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: '2px', textTransform: 'uppercase' as const }}>Saree Barcode ID</div>
            <div style={{ fontFamily: F.mono, fontSize: 24, fontWeight: 700, color: T.royalBurgundy, marginTop: 4, letterSpacing: '1px' }}>{item.id}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {infoCell('Saree Type', item.sareeType)}
            {infoCell('Saree Color', getSareeColor(item.id))}
            {infoCell('Weaver', item.weaverName)}
            {infoCell(item.rawType === 'readySaree' ? 'QC Passed Date' : 'Received Date', <span style={{ fontFamily: F.mono }}>{item.date}</span>)}
          </div>

          {/* Dispatched */}
          {item.status === 'Dispatched' && disp && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} /> Dispatch &amp; Logistics
              </div>
              <div style={{ background: 'rgba(30,102,64,0.03)', border: '1px solid rgba(30,102,64,0.10)', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {infoCell('Dispatch Date', <span style={{ fontFamily: F.mono }}>{disp.dispatchDate}</span>)}
                {infoCell('Type', <span style={{ textTransform: 'capitalize' as const }}>{disp.type}</span>)}
                {infoCell('LR Number', <span style={{ fontFamily: F.mono }}>{disp.lrNumber}</span>)}
                {infoCell('Transport Co.', disp.transportCompany)}
                {infoCell('Vehicle No.', <span style={{ fontFamily: F.mono }}>{disp.vehicleNumber}</span>)}
                {disp.driverName ? infoCell('Driver', disp.driverName) : <div />}
                {disp.type === 'wholesale' && disp.customerName && (
                  <div style={{ gridColumn: '1 / -1', borderTop: `1px solid ${T.borderDef}`, paddingTop: 10, marginTop: 2 }}>
                    {infoCell('Customer', <span style={{ color: T.royalBurgundy, fontWeight: 700 }}>{disp.customerName}</span>)}
                    {disp.invoiceNumber && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 4 }}>Invoice: {disp.invoiceNumber}</div>}
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
              <div style={{ background: 'rgba(192,57,43,0.04)', border: '1px solid rgba(192,57,43,0.12)', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {infoCell('Damage Type', ret.damageType || 'Unspecified')}
                {infoCell('Severity', <span style={{ color: ret.damageSeverity === 'Severe' ? T.crimson : ret.damageSeverity === 'Moderate' ? '#C07A18' : T.luxuryBrown }}>{ret.damageSeverity || 'Unspecified'}</span>)}
                {infoCell('Reported By', ret.receivedBy)}
                {infoCell('Date', <span style={{ fontFamily: F.mono }}>{ret.receivedDate}</span>)}
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
          {item.status === 'Finishing complete' && (
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
      </motion.div>
    </div>
  );
}
