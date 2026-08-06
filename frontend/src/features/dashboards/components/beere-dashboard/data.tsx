import React from 'react';
import { T, F } from './theme';
import { IcoWarehouse, IcoYarnInventory, IcoResourceMgmt, IcoQualityCheck, IcoInvoice, IcoHandshake } from './ui';
import { imgWarp as imgWarp, imgResham as imgResham, imgJari as imgJari } from "../../../../shared/constants/imageData";

// NOTE: the METRICS, WEAVERS, and WEAVER_RATES exports that used to live here
// (hardcoded "9 active weavers"/"248 sarees"/fake per-weaver rate lookup)
// have been removed as dead mock data — MetricsBar now reads
// useDashboardMetrics() and WeaverSection reads useDashboardWeavers()
// (both backend-wired, see ../hooks/). Nothing in this dashboard imported
// those three exports anymore; they were leftover scaffolding.

export const MATS = [
  {
    name: "Warp", desc: "Base Thread used for weaving · Cotton and Silk types",
    stock: "142 kg in stock", note: "You can make approximately 284 sarees with this",
    pct: 72, barColor: T.royalBurgundy, stockColor: T.antiqueGold,
    badge: "✓ Stock is Healthy", green: true, img: imgWarp,
    extra: null as React.ReactNode,
  },
  {
    name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",
    stock: "180 kg in stock", note: "6 different colours currently available",
    pct: 85, barColor: T.antiqueGold, stockColor: T.antiqueGold,
    badge: "✓ Stock is Healthy", green: true, img: imgResham,
    extra: (
      <div style={{ display: "flex", gap: 6, margin: "10px 0 6px" }}>
        {["#B22222","#C89B47","#1E5C8A","#2D6B3A","#8B008B","#E8DCCB"].map((c, i) => (
          <div key={i} style={{ width: 17, height: 17, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.10)" }} />
        ))}
      </div>
    ) as React.ReactNode,
  },
  {
    name: "Jari", desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types",
    stock: "36 Buns (144 Reels)", note: "Polyester and Silk Fast · 5 Grades · 6 Colors",
    pct: 30, barColor: T.crimson, stockColor: T.crimson,
    badge: "⚠ Some Types Are Low — Check Alerts", green: false, img: imgJari,
    extra: (
      <div style={{ display: "flex", gap: 6, margin: "10px 0 6px" }}>
        {["Polyester","Silk Fast"].map(p => (
          <span key={p} style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" as const, background: "rgba(139,112,96,0.10)", border: "1px solid rgba(139,112,96,0.18)", borderRadius: 6, padding: "4px 10px" }}>{p}</span>
        ))}
      </div>
    ) as React.ReactNode,
  },
];

type ActItem = { icon: React.ReactNode; bg: string; text: string; time: string; glow: string };
export const ACT: ActItem[] = [
  { icon: <IcoWarehouse     sz={18} col={T.warmCream} />, bg: "#C0392B",       glow: "rgba(192,57,43,0.6)", text: "Shop Staff reported low stock — only 12 sarees remaining in shop. Review and arrange restocking.", time: "Just now" },
  { icon: <IcoResourceMgmt  sz={18} col={T.warmCream} />, bg: "#1E6640",       glow: "rgba(30,102,64,0.6)",  text: "Ravi Kumar completed 3 sarees — Batch 089",  time: "2h ago"         },
  { icon: <IcoYarnInventory sz={18} col={T.warmCream} />, bg: T.royalBurgundy, glow: "rgba(110,15,45,0.6)", text: "Jari stock below minimum threshold",          time: "4h ago"         },
  { icon: <IcoWarehouse     sz={18} col={T.warmCream} />, bg: "#1A5E4A",       glow: "rgba(26,94,74,0.6)",  text: "Worker issued 4kg warp to Padma Veni",        time: "Today, 9:30 AM" },
  { icon: <IcoQualityCheck  sz={18} col={T.warmCream} />, bg: "#1E6640",       glow: "rgba(30,102,64,0.6)", text: "12 sarees cleared QC — Batch 086",            time: "Yesterday"      },
  { icon: <IcoHandshake     sz={18} col={T.warmCream} />, bg: T.antiqueGold,   glow: "rgba(200,155,71,0.6)", text: "Customer Lakshmi Silks confirmed order",     time: "Yesterday"      },
  { icon: <IcoInvoice       sz={18} col={T.warmCream} />, bg: T.royalBurgundy, glow: "rgba(110,15,45,0.6)", text: "2 invoices overdue — ₹2.4L pending",          time: "2 days ago"     },
];
