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

export const MATS: any[] = [];

type ActItem = { icon: React.ReactNode; bg: string; text: string; time: string; glow: string };
export const ACT: ActItem[] = [];
