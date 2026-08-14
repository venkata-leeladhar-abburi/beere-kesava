import React from "react";
import { ShoppingBag, Users, FileText } from "lucide-react";
import { T, F, card } from "../theme";
import { Button } from "../../../../shared/ui/primitives";

interface QuickActionsSidebarProps {
  showQuickDispatch: boolean;
  showCategorySplit: boolean;
  canDispatchShop: boolean;
  canDispatchWholesale: boolean;
  canRaiseQuotation: boolean;
  selectedCount: number;
  pendingCount: number;
  ready: number;
  dispatched: number;
  damaged: number;
  total: number;
  onOpenModal: (modalType: "shop" | "wholesale" | "quotation") => void;
}

export function QuickActionsSidebar({
  showQuickDispatch,
  showCategorySplit,
  canDispatchShop,
  canDispatchWholesale,
  canRaiseQuotation,
  selectedCount,
  pendingCount,
  ready,
  dispatched,
  damaged,
  total,
  onOpenModal,
}: QuickActionsSidebarProps) {
  if (!showQuickDispatch && !showCategorySplit) return null;

  const categories = [
    { label: "Pending Finishing",  val: pendingCount, total: Math.max(1, total), color: T.antiqueGold },
    { label: "Ready for Dispatch",  val: ready,        total: Math.max(1, total), color: T.green },
    { label: "Dispatched",          val: dispatched,   total: Math.max(1, total), color: T.royalBurgundy },
    { label: "Damaged / Review",    val: damaged,      total: Math.max(1, total), color: T.crimson },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 100 }}>
      {/* Dispatch buttons */}
      {showQuickDispatch && (
        <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
          <div
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 700,
              color: T.luxuryBrown,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              marginBottom: 14,
            }}
          >
            Quick Dispatch
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {canDispatchShop && (
              <Button
                onClick={() => onOpenModal("shop")}
                variant="primary"
                className="h-auto justify-start gap-2.5 rounded-xl bg-[linear-gradient(135deg,var(--bk-burgundy-700)_0%,var(--bk-burgundy-900)_100%)] px-4 py-3 text-left shadow-none hover:opacity-95"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShoppingBag size={18} color="#FFF" />
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF" }}>
                    Dispatch to Shop
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>
                    {selectedCount > 0 ? `${selectedCount} saree${selectedCount > 1 ? "s" : ""} ready` : "Select sarees first"}
                  </div>
                </div>
              </Button>
            )}
            {canDispatchWholesale && (
              <Button
                onClick={() => onOpenModal("wholesale")}
                variant="secondary"
                className="h-auto justify-start gap-2.5 rounded-xl bg-white px-4 py-3 text-left shadow-[0_1px_6px_rgba(44,24,16,0.06)]"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(110,15,45,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={18} color={T.royalBurgundy} />
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>
                    Dispatch to Wholesale
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>
                    With tax invoice generation
                  </div>
                </div>
              </Button>
            )}
            {canRaiseQuotation && (
              <Button
                onClick={() => onOpenModal("quotation")}
                variant="secondary"
                className="h-auto justify-start gap-2.5 rounded-xl bg-white px-4 py-3 text-left shadow-[0_1px_6px_rgba(44,24,16,0.06)]"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(200,155,71,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} color={T.antiqueGold} />
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>
                    Raise Quotation
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>
                    Send to finishing before dispatch
                  </div>
                </div>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Category split */}
      {showCategorySplit && (
        <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
          <div
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 700,
              color: T.luxuryBrown,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              marginBottom: 16,
            }}
          >
            Category Split
          </div>
          {categories.map((b) => {
            const pct = Math.round((b.val / b.total) * 100);
            return (
              <div key={b.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.label}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: b.color, fontVariantNumeric: "tabular-nums" }}>
                    {b.val} <span style={{ color: T.taupe, fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ background: "rgba(139,112,96,0.10)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: b.color,
                      borderRadius: 999,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
