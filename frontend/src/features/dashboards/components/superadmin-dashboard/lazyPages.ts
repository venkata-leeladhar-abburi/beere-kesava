import { lazy } from "react";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const RatesPricingPage = lazy(() => import("../../../pricing/components/RatesPricingPage").then(m => ({ default: m.RatesPricingPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const DesignLibraryPage = lazy(() => import("../../../design-library/components/DesignLibraryPage").then(m => ({ default: m.DesignLibraryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const BatchCreationPage = lazy(() => import("../../../production/components/BatchCreationPage").then(m => ({ default: m.BatchCreationPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const ApprovalsPage = lazy(() => import("../../../purchasing/components/ApprovalsPage").then(m => ({ default: m.ApprovalsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const AuditLogPage = lazy(() => import("../../../audit/components/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const LabelSettingsPage = lazy(() => import("../../../settings/components/LabelSettingsPage").then(m => ({ default: m.LabelSettingsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const ExternalPurchasesPage = lazy(() => import("../../../inventory/components/ExternalPurchasesPage").then(m => ({ default: m.ExternalPurchasesPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const SupplierReturnsPage = lazy(() => import("../../../inventory/components/SupplierReturnsPage").then(m => ({ default: m.SupplierReturnsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const AddUserPage = lazy(() => import("../../../users/components/AddUserPage").then(m => ({ default: m.AddUserPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const StaffDirectoryPage = lazy(() => import("../../../users/components/staff-directory/StaffDirectoryPage").then(m => ({ default: m.StaffDirectoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const IssueMaterialPage = lazy(() => import("../../../materials/components/IssueMaterialPage").then(m => ({ default: m.IssueMaterialPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const ReturnMaterialPage = lazy(() => import("../../../materials/components/ReturnMaterialPage").then(m => ({ default: m.ReturnMaterialPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const MaterialsPage = lazy(() => import("../../../materials/components/MaterialsPage").then(m => ({ default: m.MaterialsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const WeaversPage = lazy(() => import("../../../weavers/components/WeaversPage").then(m => ({ default: m.WeaversPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const ProductionPage = lazy(() => import("../../../production/components/ProductionPage").then(m => ({ default: m.ProductionPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const PaymentsPage = lazy(() => import("../../../payments/components/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const ReportsPage = lazy(() => import("../../../reports/components/ReportsPage").then(m => ({ default: m.ReportsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const CustomersPage = lazy(() => import("../../../customers/components/CustomersPage").then(m => ({ default: m.CustomersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const VendorsPage = lazy(() => import("../../../vendors/components/VendorsPage").then(m => ({ default: m.VendorsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const SuppliersPage = lazy(() => import("../../../suppliers/components/SuppliersPage").then(m => ({ default: m.SuppliersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const FactoryLoomPage = lazy(() => import("../../../production/components/FactoryLoomPage").then(m => ({ default: m.FactoryLoomPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const FirmsPage = lazy(() => import("../../../firms/components/FirmsPage").then(m => ({ default: m.FirmsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const InventoryPage = lazy(() => import("../../../inventory/components/InventoryPage").then(m => ({ default: m.InventoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const QcHistoryPage = lazy(() => import("../../../qc/components/QcHistoryPage").then(m => ({ default: m.QcHistoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const NotificationsPage = lazy(() => import("../../../notifications/components/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const WorkerGRN = lazy(() => import("../../../portals/components/worker/WorkerGRN").then(m => ({ default: m.WorkerGRN })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const AllWeaversPage = lazy(() => import("../../../weavers/components/AllWeaversPage").then(m => ({ default: m.AllWeaversPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const AllStockPage = lazy(() => import("../../../inventory/components/AllStockPage").then(m => ({ default: m.AllStockPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const AllOrdersPage = lazy(() => import("../../../bulk-orders/components/AllOrdersPage").then(m => ({ default: m.AllOrdersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const ProductionHistoryPage = lazy(() => import("../../../production/components/ProductionHistoryPage").then(m => ({ default: m.ProductionHistoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
export const FinishingTrackingPage = lazy(() => import("../../../finishing/components/FinishingTrackingPage").then(m => ({ default: m.FinishingTrackingPage })));
