import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import { Package, Eye, Printer, CheckCircle2 } from "lucide-react";
import { T, F, MobileCtx } from "../theme";
import { RECENT_DATA } from "../data";
import { SectionHeader, FadeUp } from "../common/primitives";
import { RecentReceivedDetailModal } from "../modals/ReportModals";

export function RecentProcurementSection({ onViewAllPurchases }: { onViewAllPurchases: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [viewItem, setViewItem] = useState<typeof RECENT_DATA[0] | null>(null);
  return (
    <section id="mat-recent" style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader title="Recently Received from Vendors" action="View All Purchases" actionIcon={<Package size={15} />} actionVariant="outline" onAction={onViewAllPurchases} />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, margin: "0 0 22px", lineHeight: 1.65 }}>
        These are the last few deliveries of raw material to the factory — most recent first.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: isMobile ? 16 : 22, alignItems: "stretch" }}>
        {RECENT_DATA.map((r, i) => {
          const typeGrad = r.type === "Warp"
            ? "linear-gradient(135deg, #6E0F2D 0%, #A0334F 100%)"
            : r.type === "Resham"
            ? "linear-gradient(135deg, #7A5010 0%, #C89B47 100%)"
            : "linear-gradient(135deg, #1E5E40 0%, #2E9E6A 100%)";
          const typeAccent = r.type === "Warp" ? T.royalBurgundy : r.type === "Resham" ? T.antiqueGold : T.green;
          const typeLight = r.type === "Warp" ? "rgba(110,15,45,0.07)" : r.type === "Resham" ? "rgba(200,155,71,0.10)" : "rgba(30,102,64,0.07)";
          const initials = r.vendor.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
          return (
            <FadeUp key={r.po} delay={i * 0.09} style={{ height: "100%" }}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0px 28px 64px rgba(74,6,27,0.18)" }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                style={{ background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", height: "100%", boxShadow: "0px 4px 20px rgba(74,6,27,0.08)" }}
              >
                <div style={{ background: typeGrad, padding: "18px 20px 20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.90)", background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: 6, letterSpacing: "2px", textTransform: "uppercase" as const }}>{r.type}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.70)", letterSpacing: "0.5px" }}>#{r.po.split("-").slice(-1)[0]}</span>
                  </div>
                  <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 38, color: "#FFFFFF", lineHeight: 1, marginBottom: 4, letterSpacing: "-0.5px" }}>{r.quantity}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", fontWeight: 500 }}>{r.description}</div>
                </div>

                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: typeLight, borderRadius: 8, padding: "5px 10px", alignSelf: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: typeAccent }} />
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: typeAccent }}>{r.date}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: typeGrad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(74,6,27,0.15)" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: "#FFFFFF" }}>{initials}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.vendor}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.vendorCity}</div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(110,15,45,0.08)" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1.3px", textTransform: "uppercase" as const, color: T.taupe }}>Firm</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: typeAccent, textAlign: "right" as const, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.firmName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1.3px", textTransform: "uppercase" as const, color: T.taupe }}>PO Ref</span>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 5 }}>{r.po}</span>
                    </div>
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "7px 12px", alignSelf: "flex-start" }}>
                    <CheckCircle2 size={13} color={T.green} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.green }}>Entry Complete</span>
                  </div>
                </div>

                <div style={{ padding: "0 20px 20px", display: "flex", gap: 8, marginTop: "auto" }}>
                  <motion.button onClick={() => setViewItem(r)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.14 }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: typeLight, color: typeAccent, border: `1.5px solid ${typeAccent}30`, borderRadius: 12, padding: "11px 10px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    <Eye size={15} strokeWidth={2.2} /> View
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.14 }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: typeGrad, color: "#FFF", border: "none", borderRadius: 12, padding: "11px 10px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    <Printer size={15} strokeWidth={2.2} /> Print
                  </motion.button>
                </div>
              </motion.div>
            </FadeUp>
          );
        })}
      </div>
      <RecentReceivedDetailModal item={viewItem} onClose={() => setViewItem(null)} />
    </section>
  );
}
