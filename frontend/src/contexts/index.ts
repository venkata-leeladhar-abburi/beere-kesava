/**
 * Contexts barrel — re-exports all existing context providers.
 * Existing context files stay in app/components/ (backward compatible).
 * New contexts live directly in src/contexts/.
 */

// NEW — Auth with localStorage persistence
export { AuthProvider, useAuth } from "./AuthContext";
export type { Role } from "./AuthContext";

// Existing contexts (forward-compatible re-exports from their current locations)
// These will gradually move to this folder in follow-up refactors.
export { POProvider, usePO } from "../features/purchasing/contexts/POContext";
export { BulkOrderProvider, useBulkOrders } from "../features/bulk-orders/contexts/BulkOrderContext";
export { DesignLibraryProvider, useDesignLibrary } from "../app/components/DesignLibraryContext";
export { BatchProvider, useBatches } from "../features/production/contexts/BatchContext";
export { MaterialIssueProvider, useMaterialIssue } from "../features/materials/contexts/MaterialIssueContext";
export { FirmsProvider, useFirms } from "../app/components/FirmsContext";
export { WeaverPaymentsProvider, useWeaverPayments } from "../app/components/WeaverPaymentsContext";
export { FinishingStaffProvider, useFinishingStaff } from "../app/components/FinishingStaffContext";
export { FinishingProvider, useFinishing } from "../app/components/FinishingContext";
export { SalesProvider, useSales } from "../features/customers/contexts/SalesContext";
export { SupplierProvider, useSuppliers } from "../features/suppliers/contexts/SupplierContext";
export type { Supplier, Purchase, SareeTag, SupplierPayment, PurchaseRequest } from "../features/suppliers/contexts/SupplierContext";
export { QcProvider, useQc, computeQcPayment, makingChargeFor, QC_RESULT_LABEL } from "../app/components/QcContext";
export type { QcRecord, QcResult } from "../app/components/QcContext";
