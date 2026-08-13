import React from "react";
import { Factory } from "lucide-react";
import { useBatches, SareeRow } from "../../contexts/BatchContext";
import { T, F, Pip } from "./constants";
import { PickerShell, pipColor } from "./PickerModals";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";
import { rupees, formatMoney } from "@/lib/domain/money";

// ── Detail Modals ────────────────────────────────────────────────────────────
export function WeaverDetailsModal({ weaver, onClose }: { weaver: WeaverOption; onClose: () => void }) {
  const { batches } = useBatches();
  const weaverBatches = batches.filter(b => b.rows.some(r => r.weaverId === weaver.id));
  const activeBatch = weaverBatches.find(b => b.status === "active");
  const isWeaving = !!activeBatch;
  const totalSarees = weaverBatches.reduce((sum, b) => sum + b.rows.filter(r => r.weaverId === weaver.id).length, 0);
  const completedSarees = weaverBatches.reduce((sum, b) => sum + b.rows.filter(r => r.weaverId === weaver.id && r.qcPassed === true).length, 0);
  const completedBatches = weaverBatches.filter(b => b.status === "completed").length;

  return (
    <PickerShell title="Weaver Details" onClose={onClose} width={420}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Pip initials={weaver.initials} bg={pipColor(weaver.id)} size={48} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{weaver.name}</span>
                {activeBatch && (
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "2px 8px" }}>{activeBatch.batchId}</span>
                )}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>ID: {weaver.id}</div>
            </div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: isWeaving ? T.green : T.taupe, background: isWeaving ? "rgba(30,102,64,0.10)" : "rgba(139,112,96,0.10)", borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" as const }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isWeaving ? T.green : T.taupe }} />
            {isWeaving ? "Currently Weaving" : "Idle"}
          </span>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Looms Owned</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{weaver.looms} Loom{weaver.looms !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Experience</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>Master Weaver</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Sarees Woven</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{totalSarees} <span style={{ fontSize: 12, fontWeight: 500, color: T.taupe }}>({completedSarees} passed)</span></div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Batches Completed</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.green, marginTop: 3 }}>{completedBatches}</div>
          </div>
        </div>
      </div>
    </PickerShell>
  );
}

export function FactoryLoomDetailsModal({ loom, onClose }: { loom: LoomOption; onClose: () => void }) {
  const { batches } = useBatches();
  const statusLower = loom.status.toLowerCase();
  const statusColor = statusLower === "active" ? T.green : statusLower === "maintenance" ? T.red : T.taupe;
  const statusBg = statusLower === "active" ? "rgba(30,102,64,0.10)" : statusLower === "maintenance" ? "rgba(192,57,43,0.09)" : "rgba(139,112,96,0.10)";
  const loomBatches = batches.filter(b => b.rows.some(r => r.factoryLoomId === loom.id));
  const activeBatchesCount = loomBatches.filter(b => b.status === "active").length;
  const totalBatchesCount = loomBatches.length;
  const shareesDone = loomBatches.reduce((sum, b) => sum + b.rows.filter(r => r.factoryLoomId === loom.id && r.qcPassed === true).length, 0);

  return (
    <PickerShell title="Factory Loom Details" onClose={onClose} width={420}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Factory size={24} color={T.royalBurgundy} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{loom.loomNumber}</div>
              <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{loom.id}</div>
            </div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: statusColor, background: statusBg, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" as const, textTransform: "capitalize" as const }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
            {statusLower}
          </span>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Location</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{loom.location}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Operator</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{loom.operatorName}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Phone</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{loom.operatorPhone}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Installed</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{loom.installedYear}</div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 10 }}>
          <div style={{ background: "rgba(110,15,45,0.05)", borderRadius: 12, padding: "12px 8px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{activeBatchesCount}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>Active Batches</div>
          </div>
          <div style={{ background: "rgba(30,102,64,0.07)", borderRadius: 12, padding: "12px 8px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>{shareesDone}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>Sarees Done</div>
          </div>
          <div style={{ background: "rgba(200,155,71,0.10)", borderRadius: 12, padding: "12px 8px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>{totalBatchesCount}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>Total Batches</div>
          </div>
        </div>

        {loom.notes && (
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            {loom.notes}
          </div>
        )}
      </div>
    </PickerShell>
  );
}

export function BulkOrderDetailsModal({ order, onClose }: { order: any; onClose: () => void }) {
  const priority = order.status === "overdue" ? "Urgent" : order.status === "at-risk" ? "High" : "Normal";
  const priorityColor = priority === "Urgent" ? T.red : priority === "High" ? T.amber : T.green;
  const estimatedValue = order.amountDue !== undefined ? order.amountDue : undefined;

  return (
    <PickerShell title="Order Details" onClose={onClose} width={450}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Pip initials={(order.customer || "?").charAt(0)} bg={T.royalBurgundy} size={40} />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{order.customer}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{order.ref}</div>
            </div>
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, color: order.status === "completed" ? T.green : order.status === "overdue" ? T.red : T.amber, whiteSpace: "nowrap" as const }}>
            {order.status}
          </span>
        </div>

        {/* Order photos */}
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>Order Photos</div>
          {order.photoUrls && order.photoUrls.length > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {order.photoUrls.map((url: string, i: number) => (
                <img key={i} src={url} alt={`Order photo ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
              ))}
            </div>
          ) : (
            <div style={{ width: 96, height: 72, borderRadius: 10, border: `1.5px dashed ${T.borderDef}`, background: T.warmIvory, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              No photos
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Quantity (Sarees)</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{order.total}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Delivery Deadline</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{order.due}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Estimated Value (₹)</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.antiqueGold, marginTop: 3 }}>{estimatedValue !== undefined ? formatMoney(rupees(estimatedValue)) : "—"}</div>
          </div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Priority</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: priorityColor, marginTop: 3 }}>{priority}</div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>Special Instructions</div>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px", fontFamily: F.ui, fontSize: 12, color: order.instructions ? T.luxuryBrown : T.taupe, fontStyle: order.instructions ? "normal" : "italic" }}>
            {order.instructions || "No special instructions provided."}
          </div>
        </div>
      </div>
    </PickerShell>
  );
}

export function SareeDetailsModal({ row, onClose }: { row: SareeRow; onClose: () => void }) {
  return (
    <PickerShell title="Saree Item Details" onClose={onClose} width={450}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8 }}>
            {row.sareeId || "UNASSIGNED"}
          </span>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>
            Serial #{row.serial}
          </span>
        </div>
        <div style={{ height: 1, background: T.borderDef }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {row.recipientType === "factoryLoom" ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Factory Loom</span>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{row.factoryLoomNumber || "Not assigned"}</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Weaver Name</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{row.weaverName || "Not assigned"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loom Assigned</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{row.weaverLoom ? `Loom ${row.weaverLoom}` : "Not assigned"}</span>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Saree Type</span>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{row.sareeTypeName || "Not assigned"} ({row.sareeTypeCode || "N/A"})</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Bulk Order Link</span>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy }}>{row.bulkOrderLabel || "General Stock"}</span>
          </div>
        </div>
      </div>
    </PickerShell>
  );
}
