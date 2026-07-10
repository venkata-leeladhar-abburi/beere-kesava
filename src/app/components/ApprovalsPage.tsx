import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, X, Package, AlertTriangle, TrendingUp, Download,
  ChevronRight, Bell, Clock, Users, ShoppingCart, Settings,
} from "lucide-react";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../constants/weaverImages";
import { usePO, PurchaseOrder } from "./POContext";
import { PODocumentModal } from "./PODocumentModal";
import { toast } from "sonner";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
  cream:         "#F0E8D0",
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ─── History type colours (for data constants) ────────────────────────────────
const T_burgundy = "#6E0F2D";
const T_gold     = "#C89B47";
const T_brown    = "#3B2314";

// ─── Data ─────────────────────────────────────────────────────────────────────
const PO_DATA = [
  {
    id: "PO-2026-022", raised: "2 days ago",
    vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",
    materials: [
      { label: "Warp", qty: "50 kg", icon: "pkg" },
    ],
    estimated: "₹1,40,000",
    stock: "Warp 142 kg",
    raisedBy: "Admin (BK)",
  },
  {
    id: "PO-2026-021", raised: "1 day ago",
    vendor: "Kanchipuram Silks", vendorCity: "Kanchipuram, TN",
    materials: [
      { label: "Resham Red", qty: "30 kg", icon: "tag" },
      { label: "Resham Gold", qty: "25 kg", icon: "tag" },
    ],
    estimated: "₹3,75,000",
    stock: "Resham Red 22 kg · Resham Gold 15 kg",
    raisedBy: "Admin (RK)",
  },
  {
    id: "PO-2026-020", raised: "Today",
    vendor: "Surat Zari Works", vendorCity: "Surat, GJ",
    materials: [
      { label: "Jari PLY 2G Gold", qty: "6 Buns (24 Reels)", icon: "layers" },
      { label: "Jari SF 1G Silver", qty: "4 Buns (16 Reels)", icon: "layers" },
    ],
    estimated: "₹1,92,000",
    stock: "PLY-2G-Gold 8 Buns · SF-1G-Silver 2 Buns",
    raisedBy: "Admin (MK)",
  },
];

const WARP_DATA = [
  {
    id: "W001", name: "Ravi Kumar", code: "WV-001", photo: imgRaviKumar,
    batch: "BATCH-089", raised: "2 days ago",
    material: "3 kg Warp", reason: "Extra sarees for Lakshmi Silks order",
    done: 4, total: 8, pct: 50, qualifies: true,
    design: "BKB-045 · Self Brocade · SB-001 · ₹450/saree",
    stock: "Warp 142 kg — enough to fulfil this request",
  },
  {
    id: "W002", name: "Padma Veni", code: "WV-002", photo: imgPadmaVeni,
    batch: "BATCH-086", raised: "1 day ago",
    material: "2 kg Warp + Resham Red 500g", reason: "Design change by admin",
    done: 3, total: 5, pct: 60, qualifies: true,
    design: "BKB-031 · Heavy Zari · HZ-003",
    stock: "Warp 142 kg · Resham Red 22 kg available",
  },
  {
    id: "W003", name: "Suresh Murti", code: "WV-007", photo: imgSureshMurti,
    batch: "BATCH-081", raised: "Today",
    material: "4 kg Warp", reason: "More sarees for stock",
    done: 2, total: 4, pct: 50, qualifies: true,
    design: "BKB-022 · Plain Silk · PS-002",
    stock: "Warp 142 kg available",
  },
];

const RATE_DATA = [
  {
    id: "R001",
    sareeType: "Self Brocade", code: "SB-001",
    currentRate: "₹420", requestedRate: "₹450", diff: "+₹30",
    raisedBy: "Admin (BK)", raised: "3 days ago",
    reason: "Market rate increase — raw material costs have gone up",
  },
  {
    id: "R002",
    sareeType: "Heavy Zari", code: "HZ-003",
    currentRate: "₹650", requestedRate: "₹680", diff: "+₹30",
    raisedBy: "Admin (MK)", raised: "1 day ago",
    reason: "Weaver demand — skilled weavers asking for higher rate",
  },
];

const HISTORY_ROWS = [
  { date: "10 Jun 2026 · 10:30 AM", type: "Purchase Order", typeColor: T_burgundy, by: "Admin (BK)",   details: "PO-2026-019 · Sri Venkateswara · ₹1,28,000",   decision: "Approved" },
  { date: "10 Jun 2026 · 10:15 AM", type: "Warp Request",   typeColor: T_gold,     by: "Weaver (KB)",  details: "Kamala B. · BATCH-079 · 2 kg Warp",            decision: "Approved" },
  { date: "09 Jun 2026 · 3:45 PM",  type: "Rate Change",    typeColor: T_brown,    by: "Admin (MK)",   details: "Plain Silk PS-002 · ₹260 → ₹280",              decision: "Approved" },
  { date: "09 Jun 2026 · 2:20 PM",  type: "Warp Request",   typeColor: T_gold,     by: "Weaver (LD)",  details: "Lakshmi D. · BATCH-077 · 3 kg Warp",           decision: "Rejected" },
  { date: "08 Jun 2026 · 11:00 AM", type: "Purchase Order", typeColor: T_burgundy, by: "Admin (RK)",   details: "PO-2026-018 · Mysore Silk Co. · ₹1,20,000",    decision: "Approved" },
  { date: "08 Jun 2026 · 9:30 AM",  type: "Warp Request",   typeColor: T_gold,     by: "Weaver (VR)",  details: "Venkat Rao · BATCH-074 · 4 kg Warp",           decision: "Rejected" },
  { date: "07 Jun 2026 · 4:10 PM",  type: "Rate Change",    typeColor: T_brown,    by: "Admin (BK)",   details: "Bridal Special BS-004 · ₹1,150 → ₹1,200",     decision: "Approved" },
  { date: "07 Jun 2026 · 2:00 PM",  type: "Purchase Order", typeColor: T_burgundy, by: "Admin (MK)",   details: "PO-2026-017 · Surat Zari Works · ₹1,60,000",  decision: "Approved" },
  { date: "06 Jun 2026 · 10:45 AM", type: "Warp Request",   typeColor: T_gold,     by: "Weaver (AK)",  details: "Anand K. · BATCH-071 · 2 kg Warp",             decision: "Approved" },
  { date: "05 Jun 2026 · 3:30 PM",  type: "Rate Change",    typeColor: T_brown,    by: "Admin (RK)",   details: "Light Cotton LC-005 · ₹200 → ₹220",            decision: "Approved" },
  { date: "04 Jun 2026 · 11:20 AM", type: "Purchase Order", typeColor: T_burgundy, by: "Admin (BK)",   details: "PO-2026-016 · Kanchipuram Silks · ₹2,80,000", decision: "Rejected" },
  { date: "03 Jun 2026 · 9:00 AM",  type: "Warp Request",   typeColor: T_gold,     by: "Weaver (MR)",  details: "Meena R. · BATCH-068 · 3 kg Warp",             decision: "Rejected" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GreenBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: T.green, color: "#FFF", border: "none", borderRadius: 999,
        padding: "9px 20px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function CrimsonBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", color: T.crimson, border: "1px solid " + T.crimson,
        borderRadius: 999, padding: "9px 20px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function InfoStrip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.cream, borderRadius: 8, padding: "8px 12px",
      fontFamily: F.mono, fontSize: 11, color: T.taupe, ...style,
    }}>
      {children}
    </div>
  );
}

function BulkActionStrip({ count, noun, onApproveAll }: { count: number; noun: string; onApproveAll: () => void }) {
  return (
    <div style={{
      background: T.cream, borderRadius: 12, padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 20,
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
        {count} {noun} {count === 1 ? "is" : "are"} waiting for your approval.
      </span>
      <GreenBtn onClick={onApproveAll}>
        <Check size={14} />
        Approve All {count} {noun}
      </GreenBtn>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      background: "#FFF", borderRadius: 16, border: "1px solid " + T.borderDef,
      boxShadow: "0 2px 12px rgba(44,24,16,0.07)", padding: "48px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      <Check size={48} color={T.green} strokeWidth={1.5} />
      <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
        {message}
      </span>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", maxWidth: 340 }}>
        All items in this category have been reviewed and actioned.
      </span>
    </div>
  );
}

// ─── PO Card ──────────────────────────────────────────────────────────────────
function POCard({
  item,
  onAction,
  onApprove,
  onReject,
  onViewDoc,
}: {
  item: typeof PO_DATA[0] & { notesAdmin?: string; urgency?: string; totalValue?: number };
  onAction: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDoc?: (id: string) => void;
}) {
  const handleApprove = () => {
    if (onApprove) onApprove(item.id);
    onAction(item.id);
    toast.success(`${item.id} approved. Admin has been notified. PO document ready for download.`);
  };
  const handleReject = () => {
    if (onReject) onReject(item.id);
    onAction(item.id);
    toast.error(`${item.id} rejected. Admin has been notified.`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: "4px solid " + T.antiqueGold,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row: ID + raised */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy,
          background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 8px",
        }}>
          {item.id}
        </span>
        <span style={{
          fontFamily: F.mono, fontSize: 10, color: T.taupe,
          background: T.cream, borderRadius: 6, padding: "3px 8px",
        }}>
          Raised {item.raised}
        </span>
      </div>

      {/* Urgency chip */}
      {item.urgency === "Urgent" && (
        <div style={{ background: "rgba(192,57,43,0.09)", borderRadius: 7, padding: "6px 10px", fontFamily: F.mono, fontSize: 10, color: T.crimson, fontWeight: 600 }}>
          🔴 Urgent — Low Stock Alert
        </div>
      )}

      {/* Vendor */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={16} color={T.taupe} />
          <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>
            {item.vendor}
          </span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, paddingLeft: 24 }}>
          {item.vendorCity}
        </span>
      </div>

      {/* Status strip */}
      <div style={{
        background: "rgba(200,155,71,0.10)", borderRadius: 8, padding: "7px 12px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.antiqueGold,
      }}>
        ⏳ Waiting for your approval
      </div>

      {/* Materials */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {item.materials.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.taupe }}>
              {m.label}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
              {m.qty}
            </span>
          </div>
        ))}
      </div>

      {/* Estimated total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Estimated Total:</span>
        <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.antiqueGold }}>
          {item.estimated || (item.totalValue ? `₹${item.totalValue.toLocaleString("en-IN")}` : "—")}
        </span>
      </div>

      {/* Stock strip */}
      {item.stock && <InfoStrip>Current Stock: {item.stock}</InfoStrip>}

      {/* Admin note */}
      {item.notesAdmin && (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", background: "rgba(200,155,71,0.07)", borderRadius: 7, padding: "7px 10px" }}>
          <strong style={{ fontStyle: "normal" }}>Admin's note:</strong> {item.notesAdmin}
        </div>
      )}

      {/* Raised by */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Raised by:</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
          {item.raisedBy}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GreenBtn style={{ flex: 1, justifyContent: "center" }} onClick={handleApprove}>
          <Check size={14} /> Approve — Send PO to Vendor
        </GreenBtn>
        <CrimsonBtn style={{ flex: 1, justifyContent: "center" }} onClick={handleReject}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>

      {/* View PO Document button */}
      {onViewDoc && (
        <button
          onClick={() => onViewDoc(item.id)}
          style={{
            width: "100%", height: 44, borderRadius: 9, cursor: "pointer",
            fontFamily: F.ui, fontWeight: 600, fontSize: 13,
            background: "transparent", color: T.royalBurgundy,
            border: `1.5px solid rgba(110,15,45,0.22)`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          📄 View PO Document
        </button>
      )}
    </motion.div>
  );
}

// ─── Warp Card ────────────────────────────────────────────────────────────────
function WarpCard({ item, onAction }: { item: typeof WARP_DATA[0]; onAction: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: "4px solid " + T.green,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row: avatar + name + batch */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid " + T.borderGold }}>
            {item.photo ? (
              <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%", background: T.cream,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy,
              }}>
                {item.name.split(" ").map(n => n[0]).join("")}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>
              {item.name}
            </div>
            <span style={{
              fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy,
              background: "rgba(110,15,45,0.07)", borderRadius: 5, padding: "2px 7px",
            }}>
              {item.code}
            </span>
          </div>
        </div>
        <span style={{
          fontFamily: F.mono, fontSize: 12, color: T.taupe,
          background: T.cream, borderRadius: 6, padding: "4px 10px",
        }}>
          {item.batch}
        </span>
      </div>

      {/* Raised chip */}
      <span style={{
        fontFamily: F.mono, fontSize: 10, color: T.taupe,
        background: T.cream, borderRadius: 6, padding: "4px 10px", alignSelf: "flex-start",
      }}>
        Request raised: {item.raised}
      </span>

      {/* Qualifies strip */}
      <div style={{
        background: T.greenBg, borderRadius: 8, padding: "7px 12px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.green,
      }}>
        ✓ Qualifies — {item.pct}%+ of batch completed
      </div>

      {/* Material */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Material Requested:</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{item.material}</span>
        </div>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", paddingLeft: 24 }}>
          {item.reason}
        </span>
      </div>

      {/* Batch progress */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Batch progress</span>
          <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
            {item.done} of {item.total} sarees done
          </span>
        </div>
        <div style={{ height: 8, background: "rgba(200,155,71,0.15)", borderRadius: 4, position: "relative" }}>
          <div style={{
            background: T.antiqueGold, borderRadius: 4, height: "100%",
            width: item.pct + "%",
          }} />
        </div>
        <div style={{ textAlign: "right", fontFamily: F.mono, fontSize: 11, color: T.green }}>
          {item.pct}%
        </div>
      </div>

      {/* Stock strip */}
      <InfoStrip>{item.stock}</InfoStrip>

      {/* Design */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={14} color={T.taupe} />
        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{item.design}</span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GreenBtn style={{ flex: 1, justifyContent: "center" }} onClick={() => onAction(item.id)}>
          <Check size={14} /> Approve Warp Request
        </GreenBtn>
        <CrimsonBtn style={{ flex: 1, justifyContent: "center" }} onClick={() => onAction(item.id)}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>
    </motion.div>
  );
}

// ─── Rate Card ────────────────────────────────────────────────────────────────
function RateCard({ item, onAction }: { item: typeof RATE_DATA[0]; onAction: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: "4px solid " + T.royalBurgundy,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={16} color={T.royalBurgundy} />
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
            Rate Change Request
          </span>
        </div>
        <span style={{
          fontFamily: F.mono, fontSize: 10, color: T.taupe,
          background: T.cream, borderRadius: 6, padding: "4px 10px",
        }}>
          {item.raised}
        </span>
      </div>

      {/* Status strip */}
      <div style={{
        background: "rgba(110,15,45,0.07)", borderRadius: 8, padding: "7px 12px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.taupe,
      }}>
        Admin has requested a rate change. Review and approve or reject.
      </div>

      {/* Saree type */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Saree Type:</span>
        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
          {item.sareeType} <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>({item.code})</span>
        </span>
      </div>

      {/* Rate comparison */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Current rate box */}
        <div style={{
          flex: 1, background: T.crimsonBg, borderRadius: 10, padding: "12px 16px",
          border: "1px solid rgba(192,57,43,0.15)", textAlign: "center",
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.crimson, marginBottom: 4, letterSpacing: 1 }}>
            CURRENT RATE
          </div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.crimson }}>
            {item.currentRate}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ fontFamily: F.display, fontSize: 20, color: T.antiqueGold, flexShrink: 0 }}>→</div>

        {/* Requested rate box */}
        <div style={{
          flex: 1, background: T.greenBg, borderRadius: 10, padding: "12px 16px",
          border: "1px solid rgba(30,102,64,0.15)", textAlign: "center",
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.green, marginBottom: 4, letterSpacing: 1 }}>
            REQUESTED RATE
          </div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.green }}>
            {item.requestedRate}
          </div>
        </div>
      </div>

      {/* Diff */}
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        Difference: <strong style={{ color: T.green }}>{item.diff}</strong> per saree · Impact on weaver earnings will apply immediately after approval.
      </div>

      {/* Reason */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Reason given:</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontStyle: "italic" }}>
          "{item.reason}"
        </span>
      </div>

      {/* Requested by */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Requested by:</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{item.raisedBy}</span>
        <span style={{
          fontFamily: F.mono, fontSize: 10, color: T.taupe,
          background: T.cream, borderRadius: 5, padding: "2px 7px",
        }}>
          {item.raised}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GreenBtn style={{ flex: 1, justifyContent: "center" }} onClick={() => onAction(item.id)}>
          <Check size={14} /> Approve Rate Change
        </GreenBtn>
        <CrimsonBtn style={{ flex: 1, justifyContent: "center" }} onClick={() => onAction(item.id)}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>
    </motion.div>
  );
}

// ─── History type pill ────────────────────────────────────────────────────────
function TypePill({ type, typeColor }: { type: string; typeColor: string }) {
  const isPO = type === "Purchase Order";
  const isWarp = type === "Warp Request";
  const bg = isPO ? typeColor : isWarp ? "rgba(200,155,71,0.15)" : T.luxuryBrown;
  const color = isPO ? "#FFF" : isWarp ? T.luxuryBrown : "#FFF";
  return (
    <span style={{
      background: bg, color, borderRadius: 6,
      padding: "3px 8px", fontFamily: F.ui, fontSize: 11, fontWeight: 500,
      whiteSpace: "nowrap",
    }}>
      {type}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"po" | "warp" | "rate">("po");
  const [poList, setPoList]       = useState(PO_DATA);
  const [warpList, setWarpList]   = useState(WARP_DATA);
  const [rateList, setRateList]   = useState(RATE_DATA);
  const [histFilter, setHistFilter] = useState("All History");
  const [histPeriod, setHistPeriod] = useState("This Month");
  const [viewDocPOId, setViewDocPOId] = useState<string | null>(null);

  const { pos, approvePO, rejectPO } = usePO();

  // Build combined PO list: context pending POs first, then static ones not duplicated
  const contextPendingIds = new Set(pos.filter(p => p.status === "pending").map(p => p.id));
  const contextPendingItems = pos
    .filter(p => p.status === "pending")
    .map(p => ({
      id: p.id,
      raised: new Date(p.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      vendor: p.vendor,
      vendorCity: p.vendorCity,
      materials: p.materials.map(m => ({ label: `${m.materialType}${m.subtype ? ` ${m.subtype}` : ""}`, qty: `${m.quantity} ${m.unit}`, icon: "pkg" })),
      estimated: `₹${p.totalValue?.toLocaleString("en-IN")}`,
      stock: "",
      raisedBy: p.raisedBy,
      notesAdmin: p.notesAdmin,
      urgency: p.urgency,
      totalValue: p.totalValue,
    }));
  const staticItems = poList.filter(p => !contextPendingIds.has(p.id));
  const combinedPOList = [...contextPendingItems, ...staticItems];

  // Find PO for document view
  const viewDocPO = viewDocPOId
    ? pos.find(p => p.id === viewDocPOId) ?? null
    : null;

  const allEmpty = combinedPOList.length === 0 && warpList.length === 0 && rateList.length === 0;

  const HIST_FILTERS = ["All History", "Purchase Orders", "Warp Requests", "Rate Changes", "Approved Only", "Rejected Only"];
  const HIST_PERIODS = ["This Month", "Last 3 Months", "All Time"];

  const tabs: { key: "po" | "warp" | "rate"; label: string; count: number }[] = [
    { key: "po",   label: "Purchase Orders", count: combinedPOList.length },
    { key: "warp", label: "Warp Requests",   count: warpList.length },
    { key: "rate", label: "Rate Changes",    count: rateList.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── 1. PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        background: T.darkBurgundy,
        padding: "40px 56px 80px",
        position: "relative",
        overflow: "hidden",
        minHeight: 160,
      }}>
        {/* Decorative rings */}
        <div style={{
          position: "absolute", right: -60, bottom: -80,
          width: 320, height: 320,
          borderRadius: "50%",
          border: "2px solid rgba(200,155,71,0.18)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: -20, bottom: -40,
          width: 220, height: 220,
          borderRadius: "50%",
          border: "1.5px solid rgba(200,155,71,0.12)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
          {/* Left copy */}
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 10 }}>
              SINCE 1999 · SUPERADMIN · APPROVALS
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#FFF", lineHeight: 1.1, marginBottom: 4 }}>
              Approvals
            </div>
            <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 28, color: T.antiqueGold, marginBottom: 12 }}>
              &amp; Pending Actions
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, lineHeight: 1.6 }}>
              Review and action purchase orders, warp material requests, and rate change proposals from your admin team.
            </div>
          </div>

          {/* Right stat chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <div style={{
              background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
              padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              color: "#FFF", display: "flex", alignItems: "center", gap: 8,
            }}>
              <ShoppingCart size={14} color={T.antiqueGold} />
              3 Purchase Orders Pending
            </div>
            <div style={{
              background: "rgba(192,57,43,0.15)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12,
              padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              color: "#FFF", display: "flex", alignItems: "center", gap: 8,
            }}>
              <Package size={14} color={T.goldLight} />
              3 Warp Requests Pending
            </div>
            <div style={{
              background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
              padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              color: "#FFF", display: "flex", alignItems: "center", gap: 8,
            }}>
              <TrendingUp size={14} color={T.antiqueGold} />
              2 Rate Change Requests Pending
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. STATS STRIP ──────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 24,
        margin: "-40px 56px 0",
        padding: "0 48px",
        zIndex: 20,
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        boxShadow: "0 8px 32px rgba(44,9,19,0.32)",
      }}>
        {/* Col 1 */}
        <div style={{ padding: "28px 0", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
            TOTAL PENDING
          </div>
          <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>8</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
            Require your action today
          </div>
        </div>

        {/* Col 2 */}
        <div style={{ padding: "28px 0 28px 32px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
            PURCHASE ORDERS
          </div>
          <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>3</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
            From admin · Awaiting approval
          </div>
        </div>

        {/* Col 3 — GOLD highlight */}
        <div style={{
          padding: "28px 0 28px 32px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(200,155,71,0.12)",
          borderTop: "3px solid " + T.antiqueGold,
          position: "relative",
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.goldLight, letterSpacing: 2, marginBottom: 8 }}>
            WARP REQUESTS
          </div>
          <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>3</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(231,201,131,0.70)", marginTop: 6 }}>
            Oldest: 2 days ago
          </div>
        </div>

        {/* Col 4 */}
        <div style={{ padding: "28px 0 28px 32px" }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
            RATE CHANGES
          </div>
          <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.crimson, lineHeight: 1 }}>2</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
            ⚠ From admin · Pending
          </div>
        </div>
      </div>

      {/* ── 3. TABS ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 90, zIndex: 50,
        background: "#FFF",
        borderBottom: "1px solid " + T.borderDef,
        marginTop: 32,
        display: "flex", alignItems: "center",
        padding: "0 56px",
        boxShadow: "0 2px 8px rgba(44,24,16,0.05)",
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "14px 24px",
              fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              background: activeTab === tab.key ? T.royalBurgundy : "transparent",
              color: activeTab === tab.key ? "#FFF" : T.luxuryBrown,
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid " + T.antiqueGold : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.18s",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? "rgba(255,255,255,0.20)" : T.cream,
              color: activeTab === tab.key ? "#FFF" : T.taupe,
              borderRadius: 10, padding: "1px 7px", fontSize: 11,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── 4. TAB CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ padding: "32px 56px 0" }}>
        <AnimatePresence mode="wait">
          {/* — Purchase Orders — */}
          {activeTab === "po" && (
            <motion.div
              key="po"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {combinedPOList.length === 0 ? (
                <EmptyState message="No pending purchase orders" />
              ) : (
                <>
                  <BulkActionStrip
                    count={combinedPOList.length}
                    noun="purchase orders"
                    onApproveAll={() => { setPoList([]); contextPendingItems.forEach(p => approvePO(p.id)); }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <AnimatePresence>
                      {combinedPOList.map(item => (
                        <POCard
                          key={item.id}
                          item={item as typeof PO_DATA[0] & { notesAdmin?: string; urgency?: string; totalValue?: number }}
                          onAction={id => setPoList(prev => prev.filter(p => p.id !== id))}
                          onApprove={id => approvePO(id)}
                          onReject={id => rejectPO(id)}
                          onViewDoc={pos.some(p => p.id === item.id) ? (id) => setViewDocPOId(id) : undefined}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* — Warp Requests — */}
          {activeTab === "warp" && (
            <motion.div
              key="warp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {warpList.length === 0 ? (
                <EmptyState message="No pending warp requests" />
              ) : (
                <>
                  <BulkActionStrip
                    count={warpList.length}
                    noun="warp requests"
                    onApproveAll={() => setWarpList([])}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <AnimatePresence>
                      {warpList.map(item => (
                        <WarpCard
                          key={item.id}
                          item={item}
                          onAction={id => setWarpList(prev => prev.filter(w => w.id !== id))}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* — Rate Changes — */}
          {activeTab === "rate" && (
            <motion.div
              key="rate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {rateList.length === 0 ? (
                <EmptyState message="No pending rate change requests" />
              ) : (
                <>
                  <BulkActionStrip
                    count={rateList.length}
                    noun="rate change requests"
                    onApproveAll={() => setRateList([])}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <AnimatePresence>
                      {rateList.map(item => (
                        <RateCard
                          key={item.id}
                          item={item}
                          onAction={id => setRateList(prev => prev.filter(r => r.id !== id))}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All-empty state */}
        {allEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "#FFF", borderRadius: 16,
              border: "1px solid " + T.borderDef,
              boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
              padding: "48px 24px", marginTop: 24,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}
          >
            <Check size={64} color={T.green} strokeWidth={1.5} />
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: T.luxuryBrown }}>
              All caught up!
            </span>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>
              There are no pending approvals right now. All purchase orders, warp requests, and rate changes have been actioned.
            </span>
          </motion.div>
        )}
      </div>

      {/* ── 5. APPROVAL HISTORY ─────────────────────────────────────────────── */}
      <div style={{ padding: "48px 56px" }}>
        {/* Section title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 24, background: T.royalBurgundy, borderRadius: 2 }} />
            <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
              Approval History — All Past Decisions
            </span>
          </div>
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.antiqueGold,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Download size={13} />
            Download History →
          </button>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 20, marginLeft: 16 }}>
          A permanent record of all approvals and rejections made in this portal.
        </p>

        {/* Filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {HIST_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setHistFilter(f)}
              style={{
                background: histFilter === f ? T.royalBurgundy : "transparent",
                color: histFilter === f ? "#FFF" : T.taupe,
                border: "1px solid " + (histFilter === f ? T.royalBurgundy : T.borderDef),
                borderRadius: 999, padding: "6px 14px",
                fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
                transition: "all 0.16s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {HIST_PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setHistPeriod(p)}
              style={{
                background: histPeriod === p ? T.royalBurgundy : "transparent",
                color: histPeriod === p ? "#FFF" : T.taupe,
                border: "1px solid " + (histPeriod === p ? T.royalBurgundy : T.borderDef),
                borderRadius: 999, padding: "6px 14px",
                fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
                transition: "all 0.16s",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* History table */}
        <div style={{
          background: "#FFF", borderRadius: 16,
          border: "1px solid " + T.borderDef,
          boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
          overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 140px 130px 1fr 120px 90px",
            background: T.cream,
            borderBottom: "1px solid " + T.borderDef,
            padding: "10px 20px",
            gap: 8,
          }}>
            {["Date & Time", "Type", "Requested By", "Details", "Decision", "Notified"].map(h => (
              <span key={h} style={{
                fontFamily: F.mono, fontSize: 9, color: T.taupe,
                textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600,
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {HISTORY_ROWS.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 140px 130px 1fr 120px 90px",
                padding: "13px 20px",
                gap: 8,
                borderBottom: i < HISTORY_ROWS.length - 1 ? "1px solid " + T.borderDef : "none",
                background: i % 2 === 0 ? "#FFF" : T.warmIvory,
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{row.date}</span>
              <TypePill type={row.type} typeColor={row.typeColor} />
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{row.by}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{row.details}</span>
              <span style={{
                background: row.decision === "Approved" ? T.greenBg : T.crimsonBg,
                color: row.decision === "Approved" ? T.green : T.crimson,
                borderRadius: 6, padding: "3px 10px",
                fontFamily: F.ui, fontSize: 11, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                {row.decision === "Approved" ? <Check size={11} /> : <X size={11} />}
                {row.decision}
              </span>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={11} /> Sent
              </span>
            </div>
          ))}
        </div>

        {/* Permanent record note */}
        <div style={{ textAlign: "right", marginTop: 10, fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
          🔒 This history is permanent and cannot be edited or deleted.
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20, alignItems: "center" }}>
          {["Previous", "1", "2", "3", "Next"].map((p, i) => (
            <button
              key={i}
              style={{
                background: p === "1" ? T.royalBurgundy : "transparent",
                color: p === "1" ? "#FFF" : T.taupe,
                border: "1px solid " + (p === "1" ? T.royalBurgundy : T.borderDef),
                borderRadius: 8, padding: "6px 14px",
                fontFamily: F.ui, fontSize: 13, fontWeight: p === "1" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── 6. FOOTER ───────────────────────────────────────────────────────── */}
      <div style={{
        background: T.luxuryBrown,
        padding: "24px 56px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}>
        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 400, color: T.warmCream }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </span>
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
          Superadmin Portal · Approvals Management
        </span>
      </div>

      {/* PO Document Modal */}
      <PODocumentModal
        open={!!viewDocPOId}
        onClose={() => setViewDocPOId(null)}
        po={viewDocPO}
        isApproved={viewDocPO?.status === "approved" || viewDocPO?.status === "received"}
      />
    </div>
  );
}
