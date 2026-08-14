import React from 'react';
import { T } from './theme';
import { imgWarp as imgWarp, imgResham as imgResham, imgJari as imgJari } from "../../../../shared/constants/imageData";

// NOTE: the METRICS, WEAVERS, and WEAVER_RATES exports that used to live here
// (hardcoded "9 active weavers"/"248 sarees"/fake per-weaver rate lookup)
// have been removed as dead mock data — MetricsBar now reads
// useDashboardMetrics() and WeaverSection reads useDashboardWeavers()
// (both backend-wired, see ../hooks/). Nothing in this dashboard imported
// those three exports anymore; they were leftover scaffolding.

// Base descriptive metadata for the three raw material types — name, image,
// and description are fixed facts, not mock figures. The desktop RawMaterial
// widget overwrites `stock` with real numbers from rawMaterialsApi; the
// mobile widget has no backend wiring yet for pct/note/badge/green (tracked
// as a documented gap), so those stay as placeholders there only.
export const MATS = [
  {
    name: "Warp", desc: "Base Thread used for weaving · Cotton and Silk types",
    stock: "— kg in stock", note: "Stock breakdown not yet available on mobile",
    pct: 0, barColor: T.royalBurgundy, stockColor: T.antiqueGold,
    badge: "Stock levels shown on desktop", green: true, img: imgWarp,
    extra: null as React.ReactNode,
  },
  {
    name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",
    stock: "— kg in stock", note: "Stock breakdown not yet available on mobile",
    pct: 0, barColor: T.antiqueGold, stockColor: T.antiqueGold,
    badge: "Stock levels shown on desktop", green: true, img: imgResham,
    extra: null as React.ReactNode,
  },
  {
    name: "Jari", desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types",
    stock: "— Buns in stock", note: "Stock breakdown not yet available on mobile",
    pct: 0, barColor: T.crimson, stockColor: T.crimson,
    badge: "Stock levels shown on desktop", green: true, img: imgJari,
    extra: null as React.ReactNode,
  },
];

type ActItem = { icon: React.ReactNode; bg: string; text: string; time: string; glow: string };
export const ACT: ActItem[] = [];
