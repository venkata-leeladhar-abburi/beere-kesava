import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ShoppingCart, PackageCheck, RefreshCw, FileText, Plus } from "lucide-react";
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
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";

const TopDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginBottom: 12 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

const MiddleDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, margin: "4px 0 16px 0" }}>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6 }} />
  </div>
);

const BottomDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginTop: 16 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ paddingRight: 4, display: "flex", alignItems: "center" }}>
      <svg width="14" height="14" viewBox="0 0 16 16">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M8,0 C9,3 11,5 16,8 C11,11 9,13 8,16 C7,13 5,11 0,8 C5,5 7,3 8,0 Z" fill={T.antiqueGold} />
        <circle cx="8" cy="8" r="2" fill="#FFFDF9" />
      </svg>
    </div>
  </div>
);

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
  const pag = usePagination(filtered, 9);

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
        <Button onClick={onCreatePO} variant="secondary" size="sm" className="flex items-center gap-1.5">
          <Plus size={14} /> Create New PO
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
            onClick={() => { setFilter(p.key); pag.setPage(1); }}
            variant={filter === p.key ? "primary" : "secondary"}
            size="sm"
            className="rounded-[10px]"
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
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {pag.pageItems.map(po => {
              const cfg = PO_STATUS_CFG[po.status];
              return (
                <motion.div
                  key={po.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedPO(po)}
                  style={{
                    background: "#FFFDF9",
                    borderRadius: 12,
                    border: `1.5px solid ${T.antiqueGold}`,
                    boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ height: 4, background: T.royalBurgundy, width: "100%" }} />

                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <TopDivider />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <EntityCode type="purchaseOrder" value={po.poNumber} size="sm" />
                      </div>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: "#F7F2EA", padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
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
                      {po.status === "received" && po.receivedBy && (
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>
                          Received by <span style={{ color: T.royalBurgundy, fontWeight: 600 }}>{po.receivedBy.id.substring(0, 8)} - {po.receivedBy.firstName} {po.receivedBy.lastName}</span>
                        </div>
                      )}
                    </div>

                    <MiddleDivider />

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
                        <div style={{ border: `1.5px solid ${T.borderGold}`, background: "linear-gradient(135deg, rgba(200,155,71,0.06) 0%, rgba(200,155,71,0.01) 100%)", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>Total Invoice Value</span>
                            <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: "#8B6018" }}>
                              <Money value={rupees(totalInvoiceAmount)} />
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex gap-2 mb-[18px] items-stretch w-full">
                      <div style={{ flex: po.status === "received" && po.grnId ? "0 0 auto" : "1 1 0%", background: cfg.badgeBg, border: `1px solid ${cfg.border}22`, borderRadius: 10, padding: "8px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 0 }}>
                        <div className="shrink-0 flex items-center">{cfg.icon}</div>
                        <span className="truncate">{cfg.badge}</span>
                      </div>
                      {po.status === "received" && po.grnId && (
                        <div className="flex-1 px-2.5 rounded-[10px] bg-[rgba(30,102,64,0.06)] border border-[rgba(30,102,64,0.18)] text-[11px] font-bold text-[#1E6640] flex items-center justify-center min-w-0">
                          <span className="truncate">✓ {po.grnId}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-auto">
                      {po.status === "approved" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.("ReceiveStock", { poId: po.poNumber });
                          }}
                          variant="primary"
                          size="sm"
                          className="w-full px-3 text-[12px] whitespace-nowrap justify-center bg-[var(--bk-green-700,#1E6640)] hover:bg-[#154d30] flex items-center gap-1.5"
                        >
                          <PackageCheck size={14} /> Receive
                        </Button>
                      )}
                      {po.status === "rejected" && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); onCreatePO(); }}
                          variant="secondary"
                          size="sm"
                          className="w-full px-3 text-[12px] whitespace-nowrap justify-center flex items-center gap-1.5"
                        >
                          <RefreshCw size={14} /> Recreate
                        </Button>
                      )}
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          onClick={(e) => { e.stopPropagation(); onViewPO(po); }}
                          variant="secondary"
                          size="sm"
                          className="flex-1 px-3 text-[12px] whitespace-nowrap justify-center flex items-center gap-1.5"
                        >
                          <FileText size={14} /> View PO
                        </Button>
                        {po.status !== "received" && (
                          <IconButton
                            onClick={(e) => { e.stopPropagation(); setDeletingPO(po); }}
                            icon={Trash2}
                            label="Delete purchase order"
                            variant="ghost"
                            className="text-[#C0392B] bg-[rgba(192,57,43,0.06)]"
                          />
                        )}
                      </div>
                    </div>
                    <BottomDivider />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div style={{ marginTop: 24 }}>
            <Pagination
              page={pag.page}
              pageCount={pag.pageCount}
              total={pag.total}
              pageSize={pag.pageSize}
              start={pag.start}
              onPageChange={pag.setPage}
              onPageSizeChange={pag.setPageSize}
              itemLabel="purchase orders"
            />
          </div>
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
