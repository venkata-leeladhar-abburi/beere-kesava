import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ShoppingCart } from "lucide-react";
import { usePO, PurchaseOrder } from "@/features/purchasing";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { ConfirmDialog } from "../../../../shared/ui/ConfirmDialog";
import { ApiError } from "../../../../shared/api/client";
import { T, F, MobileCtx } from "../theme";
import { PO_STATUS_CFG, MAT_TAG } from "../materialConfig";
import type { POFilter } from "../types";
import { FadeUp, SectionCard } from "../common/primitives";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { POVendorDetailModal } from "../modals/ReportModals";
import { rupees } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";

export function POTrackerSection({
  onCreatePO,
  onViewPO,
  onNavigate,
}: {
  onCreatePO: () => void;
  onViewPO: (po: PurchaseOrder) => void;
  onNavigate?: (tab: string, ctx?: unknown) => void;
}) {
  const { px } = useContext(MobileCtx);
  const { pos, isError, deletePO } = usePO();
  const [filter, setFilter] = useState<POFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [deletingPO, setDeletingPO] = useState<PurchaseOrder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function cancelDelete() {
    if (deleting) return;
    setDeletingPO(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deletingPO || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePO(deletingPO.id);
      setDeletingPO(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : `Could not delete ${deletingPO.poNumber}. Please try again.`);
    } finally {
      setDeleting(false);
    }
  }

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
    <SectionCard
      icon={ShoppingCart}
      title="Purchase Orders"
      subtitle="Orders placed with vendors for material — track approvals, receipts, and delivery deadlines."
      actions={
        <Button onClick={onCreatePO} variant="secondary" size="sm">
          ➕ Create New PO
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {PILL_LABELS.map(p => (
          <Button
            key={p.key}
            onClick={() => setFilter(p.key)}
            variant={filter === p.key ? "primary" : "secondary"}
            size="sm"
            className="rounded-full"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {isError ? (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid rgba(192,57,43,0.25)`, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: "#C0392B", fontWeight: 700 }}>Failed to load purchase orders.</div>
        </div>
      ) : filtered.length === 0 ? (
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
                    <EntityCode type="purchaseOrder" value={po.poNumber} size="sm" />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: "#F7F2EA", padding: "4px 10px", borderRadius: 8 }}>
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
                    {po.raisedBy && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>
                        Created by <span style={{ color: T.royalBurgundy, fontWeight: 600 }}>{po.raisedBy}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Materials Requested</div>
                      {po.materials.map((m, mi) => {
                        const mt = MAT_TAG[m.materialType] || MAT_TAG.Warp;
                        return (
                          <div key={`${m.materialType}-${m.subtype || m.description || "item"}`} style={{ display: "flex", flexDirection: "column", gap: 8, borderBottom: mi < po.materials.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", paddingBottom: mi < po.materials.length - 1 ? 12 : 0, paddingTop: mi > 0 ? 8 : 0 }}>
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
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 7px", borderRadius: 5, marginTop: 1, whiteSpace: "nowrap" as const }}>
                                {m.quantity} {m.unit}
                                {m.pricePerUnit > 0 && <> · <Money value={rupees(m.pricePerUnit)} />/{m.unit}</>}
                              </span>
                            </div>

                            <div style={{ paddingLeft: 60, marginTop: 4 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.borderGold}40` }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: m.invoiceAmount ? "#8B6018" : T.taupe }}>
                                  {m.invoiceAmount ? <Money value={rupees(m.invoiceAmount)} /> : "Not yet invoiced"}
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
                            <Money value={rupees(totalInvoiceAmount)} />
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
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.("ReceiveStock", { poId: po.poNumber });
                        }}
                        variant="primary"
                        size="sm"
                        className="flex-[1.8] bg-[var(--bk-green-700,#1E6640)] hover:bg-[#154d30]"
                      >
                        📦 Receive Materials
                      </Button>
                    )}
                    {po.status === "received" && po.grnId && (
                      <div style={{ flex: 1.8, height: 38, borderRadius: 10, background: "rgba(30,102,64,0.06)", border: `1.5px solid rgba(30,102,64,0.18)`, fontFamily: F.ui, fontSize: 12, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ✓ {po.grnId} Created
                      </div>
                    )}
                    {po.status === "rejected" && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); onCreatePO(); }}
                        variant="secondary"
                        size="sm"
                        className="flex-[1.8]"
                      >
                        📋 Recreate PO
                      </Button>
                    )}
                    <Button
                      onClick={(e) => { e.stopPropagation(); onViewPO(po); }}
                      variant="secondary"
                      size="sm"
                      className={po.status === "pending" ? "flex-1" : "flex-[0.8]"}
                    >
                      📄 View PO
                    </Button>
                    {po.status !== "received" && (
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); setDeletingPO(po); }}
                        icon={Trash2}
                        label="Delete purchase order"
                        variant="ghost"
                        className="w-[38px] h-[38px] shrink-0 text-[#C0392B] bg-[#C0392B]/10 hover:bg-[#C0392B]/20"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionCard>
    </FadeUp>
    <POVendorDetailModal po={selectedPO} onClose={() => setSelectedPO(null)} />
    <AnimatePresence>
      {deletingPO && (
        <ConfirmDialog
          title={`Delete ${deletingPO.poNumber}?`}
          message={`This permanently deletes the purchase order for ${deletingPO.vendor}. This can't be undone.`}
          confirmLabel="Delete Permanently"
          loading={deleting}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={cancelDelete}
        />
      )}
    </AnimatePresence>
    </>
  );
}
