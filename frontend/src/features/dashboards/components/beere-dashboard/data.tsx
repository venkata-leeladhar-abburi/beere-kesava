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
// and description are fixed facts, not mock figures. Both the desktop
// RawMaterial widget and MobileRawMaterial overwrite `stock` with real
// numbers from rawMaterialsApi.
export const MATS = [
  {
    name: "Warp", desc: "Base Thread used for weaving · Cotton and Silk types",
    stock: "— kg in stock", stockColor: T.antiqueGold, img: imgWarp,
    extra: null as React.ReactNode,
  },
  {
    name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",
    stock: "— kg in stock", stockColor: T.antiqueGold, img: imgResham,
    extra: null as React.ReactNode,
  },
  {
    name: "Jari", desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types",
    stock: "— Buns in stock", stockColor: T.crimson, img: imgJari,
    extra: null as React.ReactNode,
  },
];

type ActItem = { id?: string; icon: React.ReactNode; bg: string; text: string; time: string; glow: string };
export const ACT: ActItem[] = [];
