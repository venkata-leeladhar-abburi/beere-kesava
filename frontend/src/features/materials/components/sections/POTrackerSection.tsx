import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import { usePO, PurchaseOrder } from "../../../purchasing/contexts/POContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { T, F, MobileCtx } from "../theme";
import { PO_STATUS_CFG, MAT_TAG } from "../data";
import type { POFilter } from "../types";
import { FadeUp } from "../common/primitives";
import { POVendorDetailModal } from "../modals/ReportModals";

export function POTrackerSection({
  onCreatePO,
  onViewPO,
  onNavigate,
}: {
  onCreatePO: () => void;
  onViewPO: (po: PurchaseOrder) => void;
  onNavigate?: (tab: string, ctx?: any) => void;
}) {
  const { px } = useContext(MobileCtx);
  const { pos } = usePO();
  const [filter, setFilter] = useState<POFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const counts = {
    all: pos.length,
    pending: pos.filter(p => p.status === "pending").length,
    approved: pos.filter(p => p.status === "approved").length,
    received: pos.filter(p => p.status === "received").length,
    rejected: pos.filter(p => p.status === "rejected").length,
  };

  const filtered = filter === "all" ? pos : pos.filter(p => p.status === filter);

  const PILL_LABELS: { key: POFilter; label: string }[] = [
    { key: "all",      label: `All POs (${counts.all})` },
    { key: "pending",  label: `Pending Approval (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "received", label: `Received (${counts.received})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <>
    <FadeUp id="mat-po-tracker" style={{ padding: `32px ${px}px 0` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 4, height: 26, borderRadius: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)", flexShrink: 0 }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, color: T.luxuryBrown, letterSpacing: "-0.3px", lineHeight: 1.15 }}>
            Purchase Orders
          </span>
        </div>
        <motion.button
          onClick={onCreatePO}
          whileHover={{ x: 3 }}
          transition={{ duration: 0.2 }}
          style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.antiqueGold, cursor: "pointer", background: "none", border: "none" }}
        >
          ➕ Create New PO →
        </motion.button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {PILL_LABELS.map(p => (
          <motion.button
            key={p.key}
            onClick={() => setFilter(p.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily: F.ui, fontWeight: 600, fontSize: 12, padding: "7px 14px", borderRadius: 99, cursor: "pointer",
              background: filter === p.key ? T.royalBurgundy : "transparent",
              color: filter === p.key ? "#FFFDF9" : T.taupe,
              border: filter === p.key ? "none" : `1px solid rgba(110,15,45,0.16)`,
              transition: "all 0.2s",
            }}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No purchase orders in this category.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(po => {
            const cfg = PO_STATUS_CFG[po.status];
            return (
              <motion.div
                key={po.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedPO(po)}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 20,
                  border: `1.5px solid ${T.borderDef}`,
                  boxShadow: "0 8px 30px rgba(74,6,27,0.04)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}
                whileHover={{ y: -4, boxShadow: "0 18px 45px rgba(74,6,27,0.09)" }}
              >
                <div style={{ height: 6, background: cfg.border, width: "100%" }} />

                <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8 }}>
                      {po.poNumber}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "#F7F2EA", padding: "4px 10px", borderRadius: 8 }}>
                      {new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, letterSpacing: "-0.2px", marginBottom: 4 }}>
                      {po.vendor}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                      <span>{po.vendorCity}</span>
                      {po.firmName && (
                        <>
                          <span style={{ color: T.borderDef }}>•</span>
                          <span style={{ color: T.antiqueGold, fontWeight: 600 }}>{po.firmName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Materials Requested</div>
                      {po.materials.map((m, mi) => {
                        const mt = MAT_TAG[m.materialType] || MAT_TAG.Warp;
                        return (
                          <div key={mi} style={{ display: "flex", flexDirection: "column", gap: 8, borderBottom: mi < po.materials.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", paddingBottom: mi < po.materials.length - 1 ? 12 : 0, paddingTop: mi > 0 ? 8 : 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 6, padding: "2px 8px", minWidth: 50, textAlign: "center", marginTop: 1, flexShrink: 0 }}>
                                {m.materialType}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {(m.subtype || m.description) ? (
                                  <>
                                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                      {m.subtype || m.description}
                                    </div>
                                    {m.description && m.subtype && (
                                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, marginTop: 1 }}>
                                        {m.description}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</div>
                                )}
                              </div>
                              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 7px", borderRadius: 5, marginTop: 1 }}>
                                {m.quantity} {m.unit}
                              </span>
                            </div>

                            <div style={{ paddingLeft: 60, marginTop: 4 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.borderGold}40` }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
                                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: m.invoiceAmount ? "#8B6018" : T.taupe }}>
                                  {m.invoiceAmount ? `₹${m.invoiceAmount.toLocaleString("en-IN")}` : "Not yet invoiced"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {(po.deliveryDate || po.notesVendor) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18, paddingLeft: 2 }}>
                      {po.deliveryDate && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
                          <span style={{ color: T.taupe }}>Deadline:</span>
                          <span style={{ fontWeight: 600, color: T.royalBurgundy }}>
                            {new Date(po.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {po.notesVendor && (
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", lineHeight: 1.4 }}>
                          "{po.notesVendor}"
                        </div>
                      )}
                    </div>
                  )}

                  {(() => {
                    const totalInvoiceAmount = po.materials.reduce((sum, m) => sum + (m.invoiceAmount || 0), 0);
                    const hasAnyAmount = po.materials.some(m => !!m.invoiceAmount);
                    if (!hasAnyAmount) return null;
                    return (
                      <div style={{ border: `1.5px solid ${T.borderGold}`, background: "linear-gradient(135deg, rgba(200,155,71,0.06) 0%, rgba(200,155,71,0.01) 100%)", borderRadius: 12, padding: "12px 14px", marginBottom: 18, marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>Total Invoice Value</span>
                          <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: "#8B6018" }}>
                            ₹{totalInvoiceAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ background: cfg.badgeBg, border: `1px solid ${cfg.border}22`, borderRadius: 10, padding: "8px 12px", marginBottom: 18, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.badgeColor }} />
                    {cfg.badge}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    {po.status === "approved" && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.("ReceiveStock", { poId: po.poNumber });
                        }}
                        whileHover={{ scale: 1.02, backgroundColor: "#154d30" }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          flex: 1.8, height: 38, borderRadius: 10, cursor: "pointer",
                          fontFamily: F.ui, fontWeight: 700, fontSize: 12,
                          background: T.green, color: "#FFFFFF", border: "none",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        📦 Receive Materials
                      </motion.button>
                    )}
                    {po.status === "received" && po.grnId && (
                      <div style={{ flex: 1.8, height: 38, borderRadius: 10, background: "rgba(30,102,64,0.06)", border: `1.5px solid rgba(30,102,64,0.18)`, fontFamily: F.ui, fontSize: 12, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ✓ {po.grnId} Created
                      </div>
                    )}
                    {po.status === "rejected" && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); onCreatePO(); }}
                        whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          flex: 1.8, height: 38, borderRadius: 10, cursor: "pointer",
                          fontFamily: F.ui, fontWeight: 700, fontSize: 12,
                          background: "transparent", color: T.royalBurgundy,
                          border: `1.5px solid rgba(110,15,45,0.22)`,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        📋 Recreate PO
                      </motion.button>
                    )}
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); onViewPO(po); }}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.10)" }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: po.status === "pending" ? 1 : 0.8,
                        height: 38, borderRadius: 10, cursor: "pointer",
                        fontFamily: F.ui, fontWeight: 700, fontSize: 12,
                        background: "rgba(110,15,45,0.04)", color: T.royalBurgundy,
                        border: `1.5px solid rgba(110,15,45,0.16)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      📄 View PO
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </FadeUp>
    <POVendorDetailModal po={selectedPO} onClose={() => setSelectedPO(null)} />
    </>
  );
}
