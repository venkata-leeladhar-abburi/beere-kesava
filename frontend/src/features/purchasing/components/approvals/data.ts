import { imgPadmaVeni, imgRaviKumar, imgSureshMurti } from "../../../../shared/constants/weaverImages";
import { T_burgundy, T_gold, T_brown } from "./tokens";

// ─── Data ─────────────────────────────────────────────────────────────────────
// NOTE: PO_DATA (mock purchase orders) was removed — the "Purchase Orders" tab
// now renders exclusively from the real backend via PurchaseOrdersContext
// (GET /purchase-orders, filtered to PENDING). See ApprovalsPage.tsx.

// GAP: there is no backend module for weaver-raised "warp material requests"
// (no warp-requests controller/service/prisma model exists in backend/src).
// This stays mock data until that module is built — do not invent real numbers.
export const WARP_DATA: any[] = [];
export const RATE_DATA: any[] = [];
export const HISTORY_ROWS: any[] = [];
