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
export { DesignLibraryProvider, useDesignLibrary } from "../features/design-library/contexts/DesignLibraryContext";
export { BatchProvider, useBatches } from "../features/production/contexts/BatchContext";
export { MaterialIssueProvider, useMaterialIssue } from "../features/materials/contexts/MaterialIssueContext";
export { MaterialReturnProvider, useMaterialReturn } from "../features/materials/contexts/MaterialReturnContext";
export { FirmsProvider, useFirms } from "../features/firms/contexts/FirmsContext";
export { WeaverPaymentsProvider, useWeaverPayments } from "../features/weavers/contexts/WeaverPaymentsContext";
export { FinishingStaffProvider, useFinishingStaff } from "../features/finishing/contexts/FinishingStaffContext";
export { FinishingProvider, useFinishing } from "../features/finishing/contexts/FinishingContext";
export { SalesProvider, useSales } from "../features/customers/contexts/SalesContext";
export { CustomersProvider, useCustomers } from "../features/customers/contexts/CustomersContext";
export type { Customer } from "../features/customers/contexts/CustomersContext";
export { SupplierProvider, useSuppliers } from "../features/suppliers/contexts/SupplierContext";
export type { Supplier, Purchase, SareeTag, SupplierPayment, PurchaseRequest } from "../features/suppliers/contexts/SupplierContext";
export { QcProvider, useQc, computeQcPayment, QC_RESULT_LABEL } from "../features/qc/contexts/QcContext";
export type { QcRecord, QcResult } from "../features/qc/contexts/QcContext";
