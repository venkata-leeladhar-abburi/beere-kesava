// Re-export WeaverSareesSection from the sub-folder to preserve the public import
// surface for all other features (InventoryPage, ProductionPage, WeaversPage, etc.)
export { WeaverSareesSection } from "./WeaverSareesSection/index";
export type { WeaverSareeRow, ExternalPieceInfo } from "./WeaverSareesSection/types";
export { useExternalPurchaseRows } from "./WeaverSareesSection/useExternalPurchaseRows";
export { isSareePickable, pickBlockedReason, externalSerialOf } from "./WeaverSareesSection/utils";
export { usePrintSareeTags, type SareeTagData } from "./WeaverSareesSection/SareeTagPrint";
