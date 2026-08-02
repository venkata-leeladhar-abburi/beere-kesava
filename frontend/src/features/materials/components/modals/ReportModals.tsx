import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, BarChart2, FileText, AlertTriangle, Download, Check, X } from "lucide-react";
import type { PurchaseOrder } from "../../../purchasing/contexts/POContext";
import { T, F } from "../theme";
import { HISTORY_ENTRIES, RECENT_DATA, PO_STATUS_CFG } from "../data";
import { ModalOverlay, ModalHeader } from "../common/primitives";

// ─── FULL REPORTS MODAL ───────────────────────────────────────────────────────
export function FullReportsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Full Reports" subtitle="Detailed stock analysis and material reports" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
          {[
            { icon: <Package size={20} color={T.royalBurgundy} />, title: "Current Stock Report", desc: "Full breakdown of all materials currently in stock with quantities and values", bg: "rgba(110,15,45,0.05)" },
            { icon: <BarChart2 size={20} color={T.antiqueGold} />, title: "Stock Movement Report", desc: "All inward and outward movement of materials over the selected period", bg: "rgba(200,155,71,0.07)" },
            { icon: <FileText size={20} color={T.green} />, title: "Vendor Purchase Report", desc: "Total purchases from each vendor with cost breakdown and order history", bg: "rgba(30,102,64,0.06)" },
            { icon: <AlertTriangle size={20} color={T.crimson} />, title: "Low Stock Alert Report", desc: "All materials that have gone below minimum stock levels requiring reorder", bg: "rgba(192,57,43,0.06)" },
          ].map((r, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.01, boxShadow: "0 6px 20px rgba(74,6,27,0.10)" }}
              style={{ display: "flex", alignItems: "flex-start", gap: 16, background: r.bg, borderRadius: 14, padding: "18px 20px", cursor: "pointer", border: `1px solid rgba(110,15,45,0.09)` }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
              <Download size={16} color={T.taupe} style={{ flexShrink: 0, marginTop: 4 }} />
            </motion.div>
          ))}
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── FULL ISSUE HISTORY MODAL ─────────────────────────────────────────────────
export function FullIssueHistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const statusColors: Record<string, string> = { Active: T.green, "Quality Check": "#7A5E1C", Overdue: T.crimson, Completed: T.taupe };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Full Issue History" subtitle="All material issues to weavers — complete record" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
          {HISTORY_ENTRIES.map((entry, i) => (
            <motion.div
              key={entry.ref}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 18px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, marginBottom: 3 }}>{entry.weaver}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{entry.weaverId}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe }}>{entry.batch}</span>
                  </div>
                </div>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: statusColors[entry.status] || T.taupe, background: `${statusColors[entry.status] || T.silkCream}18`, padding: "4px 10px", borderRadius: 20 }}>{entry.status}</span>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 6 }}>{entry.materials}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{entry.date}</div>
            </motion.div>
          ))}
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── DOWNLOAD REPORT MODAL ────────────────────────────────────────────────────
export function DownloadReportModal({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => { setDownloading(false); setDone(true); }, 1500);
    setTimeout(() => { setDone(false); onClose(); }, 3000);
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title={`Download ${title}`} subtitle="Choose format and export options" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,102,64,0.12)", border: "2px solid rgba(30,102,64,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Check size={32} color={T.green} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.green, marginBottom: 8 }}>Report Downloaded!</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Your report has been saved successfully.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              {[
                { fmt: "PDF Report", icon: <FileText size={20} color={T.royalBurgundy} />, desc: "Formatted document with charts and tables", bg: "rgba(110,15,45,0.05)" },
                { fmt: "Excel Spreadsheet", icon: <BarChart2 size={20} color={T.green} />, desc: "Raw data in .xlsx format for analysis", bg: "rgba(30,102,64,0.05)" },
                { fmt: "CSV File", icon: <Download size={20} color={T.antiqueGold} />, desc: "Simple comma-separated values file", bg: "rgba(200,155,71,0.07)" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: f.bg, borderRadius: 12, padding: "14px 16px", cursor: "pointer", border: `1px solid rgba(110,15,45,0.08)` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{f.fmt}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
                Cancel
              </motion.button>
              <motion.button
                onClick={handleDownload}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {downloading ? "Generating..." : <><Download size={16} /> Download Report</>}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}

// ─── SET ALERT THRESHOLDS MODAL ───────────────────────────────────────────────
export function ThresholdsModal({ open, onClose, thresholds, onSave }: {
  open: boolean; onClose: () => void;
  thresholds: { warp: number; resham: number; jari: { qty: number; unit: "Buns" | "Reels" } };
  onSave: (t: { warp: number; resham: number; jari: { qty: number; unit: "Buns" | "Reels" } }) => void;
}) {
  const [warp, setWarp] = useState(thresholds.warp);
  const [resham, setResham] = useState(thresholds.resham);
  const [jari, setJari] = useState(thresholds.jari);

  React.useEffect(() => {
    if (open) { setWarp(thresholds.warp); setResham(thresholds.resham); setJari(thresholds.jari); }
  }, [open, thresholds]);

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, background: T.silkCream, borderRadius: 12, padding: "14px 16px" };
  const chipStyle = (col: string, bg: string): React.CSSProperties => ({ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: col, background: bg, borderRadius: 6, padding: "4px 10px", flexShrink: 0 });
  const inputStyle: React.CSSProperties = { width: 90, fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8, padding: "8px 10px", outline: "none", background: "#FFFFFF" };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Set Alert Thresholds" subtitle="Define minimum stock levels that trigger a low-stock alert" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={rowStyle}>
          <span style={chipStyle(T.royalBurgundy, "rgba(110,15,45,0.09)")}>Warp</span>
          <div style={{ flex: 1 }} />
          <input type="number" value={warp} onChange={e => setWarp(parseFloat(e.target.value) || 0)} style={inputStyle} />
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>kg</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginLeft: 8 }}>Current: 4 kg</span>
        </div>
        <div style={rowStyle}>
          <span style={chipStyle("#7A5E1C", "rgba(200,155,71,0.13)")}>Resham</span>
          <div style={{ flex: 1 }} />
          <input type="number" value={resham} onChange={e => setResham(parseFloat(e.target.value) || 0)} style={inputStyle} />
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>kg</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginLeft: 8 }}>Current: 2 kg</span>
        </div>
        <div style={rowStyle}>
          <span style={chipStyle(T.luxuryBrown, "rgba(59,35,20,0.09)")}>Jari</span>
          <div style={{ flex: 1 }} />
          <input type="number" value={jari.qty} onChange={e => setJari(prev => ({ ...prev, qty: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
          <div style={{ display: "flex", border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8, overflow: "hidden" }}>
            {(["Buns", "Reels"] as const).map(u => (
              <button key={u} onClick={() => setJari(prev => ({ ...prev, unit: u }))}
                style={{ padding: "7px 12px", fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "none", background: jari.unit === u ? T.royalBurgundy : "#FFFFFF", color: jari.unit === u ? "#FFFDF9" : T.taupe }}>
                {u}
              </button>
            ))}
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginLeft: 8 }}>Current: 6 Buns / 24 Reels</span>
        </div>
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Cancel
          </motion.button>
          <motion.button onClick={() => { onSave({ warp, resham, jari }); onClose(); }} whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }} whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
            Save Thresholds
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── PO VENDOR DETAIL PANEL ────────────────────────────────────────────────────
export function POVendorDetailModal({ po, onClose }: { po: PurchaseOrder | null; onClose: () => void }) {
  if (!po) return null;
  const cfg = PO_STATUS_CFG[po.status];
  const MT: Record<string, { col: string; bg: string }> = {
    Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"  },
    Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)" },
    Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"   },
  };
  return (
    <AnimatePresence>
      <motion.div
        key="po-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1800, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "flex-end" }}
      >
        <motion.div
          key="po-panel"
          initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={e => e.stopPropagation()}
          style={{ width: 430, maxWidth: "95vw", height: "100vh", background: "#FFFDF9", display: "flex", flexDirection: "column", boxShadow: "-24px 0 64px rgba(74,6,27,0.20)", overflowY: "auto" }}
        >
          <div style={{ background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 24px 20px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 4 }}>Purchase Order</div>
                <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{po.poNumber}</div>
              </div>
              <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.10)", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "5px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.badgeColor }} />
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{cfg.label}</span>
            </div>
          </div>

          <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
            <div style={{ background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "rgba(110,15,45,0.04)", padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe }}>Vendor Details</div>
              </div>
              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${T.darkBurgundy}, ${T.royalBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(110,15,45,0.25)" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 800, color: "#FFF" }}>{po.vendor.charAt(0)}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown }}>{po.vendor}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>📍 {po.vendorCity}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Contact",       val: po.vendorContact || "—" },
                    { label: "Purchasing Firm", val: po.firmName || "—" },
                    { label: "Submitted",     val: new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                    { label: "Delivery By",   val: po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: T.taupe, marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "rgba(110,15,45,0.04)", padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe }}>Materials Ordered</div>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {po.materials.map((m, mi) => {
                  const mt = MT[m.materialType] || MT.Warp;
                  return (
                    <div key={mi} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: T.silkCream, borderRadius: 10 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, color: mt.col, background: mt.bg, padding: "3px 9px", borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{m.materialType}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{m.subtype || m.description || "—"}</div>
                        {m.description && m.subtype && <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{m.description}</div>}
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{m.quantity} {m.unit}</div>
                        {m.pricePerUnit > 0 && <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 1 }}>₹{m.pricePerUnit.toLocaleString("en-IN")}/{m.unit}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(200,155,71,0.08) 0%, rgba(200,155,71,0.02) 100%)", border: `1.5px solid ${T.borderGold}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe }}>Total Order Value</span>
                <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 800, color: "#8B6018" }}>₹{po.totalValue.toLocaleString("en-IN")}</span>
              </div>
              {po.urgency === "Urgent" && (
                <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(192,57,43,0.10)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson }}>🚨 Urgent Priority</span>
                </div>
              )}
            </div>

            {(po.notesVendor || po.notesAdmin) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {po.notesVendor && (
                  <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: T.taupe, marginBottom: 6 }}>Note to Vendor</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.55, fontStyle: "italic" }}>"{po.notesVendor}"</div>
                  </div>
                )}
                {po.notesAdmin && (
                  <div style={{ background: "rgba(200,155,71,0.05)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: T.taupe, marginBottom: 6 }}>Admin Note</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.55 }}>{po.notesAdmin}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── RECENT RECEIVED DETAIL MODAL ─────────────────────────────────────────────
export function RecentReceivedDetailModal({ item, onClose }: { item: typeof RECENT_DATA[0] | null; onClose: () => void }) {
  if (!item) return null;
  return (
    <ModalOverlay open={!!item} onClose={onClose}>
      <ModalHeader title="Material Receipt Details" subtitle={item.po} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Vendor", value: item.vendor },
            { label: "Vendor City", value: item.vendorCity },
            { label: "Purchasing Firm", value: item.firmName },
            { label: "Material Type", value: item.type },
            { label: "Description", value: item.description },
            { label: "Quantity", value: item.quantity },
            { label: "Received Date", value: item.date },
            { label: "PO Reference", value: item.po },
          ].map(row => (
            <div key={row.label} style={{ background: T.silkCream, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5 }}>{row.label}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{row.value}</div>
            </div>
          ))}
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}
