import React from 'react';
import { T, F } from './theme';
import { IcoResourceMgmt, IcoFabricRoll, IcoInvoice, IcoQualityCheck, IcoTruck, IcoWarehouse, IcoYarnInventory, IcoHandshake } from './ui';
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../../shared/constants/weaverImages";
import { imgWarp as imgWarp, imgResham as imgResham, imgJari as imgJari } from "../../../../shared/constants/imageData";

export const METRICS = [
  { ico: <IcoResourceMgmt sz={22} col={T.warmCream} />, label: "Active Weavers",   val: "9",     sub: "↑ 12% vs last month", hi: false },
  { ico: <IcoFabricRoll   sz={22} col={T.warmCream} />, label: "Sarees Produced",  val: "248",   sub: "↑ 14% vs last month", hi: false },
  { ico: <IcoInvoice      sz={22} col={T.warmCream} />, label: "Pending Payments", val: "₹2.4L", sub: "2 overdue",           hi: true  },
  { ico: <IcoQualityCheck sz={22} col={T.warmCream} />, label: "Ready for Sale",   val: "84",    sub: "Sarees",              hi: false },
  { ico: <IcoTruck        sz={22} col={T.warmCream} />, label: "Dispatched",       val: "32",    sub: "Sarees this week",    hi: false },
];

export const WEAVERS: any[] = [];

export const WEAVER_RATES: Record<string, { code: string; type: string; rate: string }> = {
  "b5f9178c-b1b9-4871-a7c3-0d68a462d57a": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "8937070a-ea63-43f3-9cb4-dcbcfd362ff7": { code: "HZ-003", type: "Heavy Zari", rate: "₹680/saree" },
  "11278a51-a26d-4eaa-adbf-bedbfa7fdf46": { code: "SB-001", type: "Self Brocade", rate: "₹450/saree" },
  "71413724-378d-4336-93dd-1db33cba3510": { code: "PS-002", type: "Plain Silk", rate: "₹280/saree" },
};

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
