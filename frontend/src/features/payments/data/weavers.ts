import { WeaverRecord } from "../types";

// MOCK: WeaverMakingChargesSection.tsx no longer imports WEAVERS — it builds
// WeaverRecord rows live from GET /weavers + GET /payments/weavers instead.
// Kept here only as a reference for the WeaverRecord shape / any other
// still-mock consumer.
export const WEAVERS: WeaverRecord[] = [];
export const RATE_ROWS: unknown[] = [];
