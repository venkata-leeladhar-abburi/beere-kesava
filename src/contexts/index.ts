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
export { POProvider, usePO } from "../app/components/POContext";
export { BulkOrderProvider, useBulkOrders } from "../app/components/BulkOrderContext";
export { DesignLibraryProvider, useDesignLibrary } from "../app/components/DesignLibraryContext";
export { BatchProvider, useBatches } from "../app/components/BatchContext";
export { MaterialIssueProvider, useMaterialIssue } from "../app/components/MaterialIssueContext";
export { FirmsProvider, useFirms } from "../app/components/FirmsContext";
export { WeaverPaymentsProvider, useWeaverPayments } from "../app/components/WeaverPaymentsContext";
export { FinishingStaffProvider, useFinishingStaff } from "../app/components/FinishingStaffContext";
export { FinishingProvider, useFinishing } from "../app/components/FinishingContext";
