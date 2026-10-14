/** shared/ui/domain barrel — design-system/06-DOMAIN.md Part I Step 2. */
export { EntityCode, type EntityCodeProps } from "./EntityCode";
export { GrnLineCode, type GrnLineCodeProps } from "./GrnLineCode";
// ScannableCode and Code128Bars are deliberately not re-exported: they carry
// the QR and barcode encoders (@zxing, bwip-js), and anything imported through
// this barrel lands in the bundle every page loads. Import them by path,
// from print screens only.
export { Money, type MoneyProps } from "./Money";
export { Quantity, type QuantityProps } from "./Quantity";
export { Percent, type PercentProps } from "./Percent";
export { StatusPill, type DomainStatusPillProps } from "./StatusPill";
export {
  DataAccessProvider,
  DataGate,
  useDataAccess,
  type DataAccessScope,
  type DataAccessScopes,
} from "./DataAccess";
export { avatarColorFor, AVATAR_COLORS } from "./avatarColor";

export {
  DomainCard,
  type DomainCardProps,
  type DomainCardDensity,
  type DomainCardStat,
} from "./DomainCard";
export { WeaverCard, type WeaverCardProps } from "./WeaverCard";
export { CustomerCard, type CustomerCardProps } from "./CustomerCard";
export { SupplierCard, type SupplierCardProps } from "./SupplierCard";
export { VendorCard, type VendorCardProps } from "./VendorCard";
export { SareeCard, type SareeCardProps } from "./SareeCard";
export { BatchCard, type BatchCardProps } from "./BatchCard";
export { LoomCard, type LoomCardProps } from "./LoomCard";
