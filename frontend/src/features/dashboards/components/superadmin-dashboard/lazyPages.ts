import { lazy } from "react";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
export const RatesPricingPage = lazy(() => import("../../../pricing/components/RatesPricingPage").then(m => ({ default: m.RatesPricingPage })));
export const DesignLibraryPage = lazy(() => import("../../../design-library/components/DesignLibraryPage").then(m => ({ default: m.DesignLibraryPage })));
export const BatchCreationPage = lazy(() => import("../../../production/components/BatchCreationPage").then(m => ({ default: m.BatchCreationPage })));
export const ApprovalsPage = lazy(() => import("../../../purchasing/components/ApprovalsPage").then(m => ({ default: m.ApprovalsPage })));
export const AuditLogPage = lazy(() => import("../../../audit/components/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
export const LabelSettingsPage = lazy(() => import("../../../settings/components/LabelSettingsPage").then(m => ({ default: m.LabelSettingsPage })));
export const ExternalPurchasesPage = lazy(() => import("../../../inventory/components/ExternalPurchasesPage").then(m => ({ default: m.ExternalPurchasesPage })));
export const AddUserPage = lazy(() => import("../../../users/components/AddUserPage").then(m => ({ default: m.AddUserPage })));
export const IssueMaterialPage = lazy(() => import("../../../materials/components/IssueMaterialPage").then(m => ({ default: m.IssueMaterialPage })));
export const ReturnMaterialPage = lazy(() => import("../../../materials/components/ReturnMaterialPage").then(m => ({ default: m.ReturnMaterialPage })));
export const MaterialsPage = lazy(() => import("../../../materials/components/MaterialsPage").then(m => ({ default: m.MaterialsPage })));
export const WeaversPage = lazy(() => import("../../../weavers/components/WeaversPage").then(m => ({ default: m.WeaversPage })));
export const ProductionPage = lazy(() => import("../../../production/components/ProductionPage").then(m => ({ default: m.ProductionPage })));
export const PaymentsPage = lazy(() => import("../../../payments/components/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
export const ReportsPage = lazy(() => import("../../../reports/components/ReportsPage").then(m => ({ default: m.ReportsPage })));
export const CustomersPage = lazy(() => import("../../../customers/components/CustomersPage").then(m => ({ default: m.CustomersPage })));
export const VendorsPage = lazy(() => import("../../../vendors/components/VendorsPage").then(m => ({ default: m.VendorsPage })));
export const SuppliersPage = lazy(() => import("../../../suppliers/components/SuppliersPage").then(m => ({ default: m.SuppliersPage })));
export const FactoryLoomPage = lazy(() => import("../../../production/components/FactoryLoomPage").then(m => ({ default: m.FactoryLoomPage })));
export const FirmsPage = lazy(() => import("../../../firms/components/FirmsPage").then(m => ({ default: m.FirmsPage })));
export const InventoryPage = lazy(() => import("../../../inventory/components/InventoryPage").then(m => ({ default: m.InventoryPage })));
export const QcHistoryPage = lazy(() => import("../../../qc/components/QcHistoryPage").then(m => ({ default: m.QcHistoryPage })));
export const NotificationsPage = lazy(() => import("../../../notifications/components/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
export const WorkerGRN = lazy(() => import("../../../portals/components/worker/WorkerGRN").then(m => ({ default: m.WorkerGRN })));
export const AllWeaversPage = lazy(() => import("../../../weavers/components/AllWeaversPage").then(m => ({ default: m.AllWeaversPage })));
export const AllStockPage = lazy(() => import("../../../inventory/components/AllStockPage").then(m => ({ default: m.AllStockPage })));
export const AllOrdersPage = lazy(() => import("../../../bulk-orders/components/AllOrdersPage").then(m => ({ default: m.AllOrdersPage })));
export const ProductionHistoryPage = lazy(() => import("../../../production/components/ProductionHistoryPage").then(m => ({ default: m.ProductionHistoryPage })));
export const FinishingTrackingPage = lazy(() => import("../../../finishing/components/FinishingTrackingPage").then(m => ({ default: m.FinishingTrackingPage })));
