import { lazyWithRetry as lazy } from "@/app/lazyWithRetry";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
export const RatesPricingPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../pricing/components/RatesPricingPage").then((m) => ({
    default: m.RatesPricingPage,
  }))
);
export const DesignLibraryPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../design-library/components/DesignLibraryPage").then((m) => ({
    default: m.DesignLibraryPage,
  }))
);
export const BatchCreationPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../production/components/BatchCreationPage").then((m) => ({
    default: m.BatchCreationPage,
  }))
);
export const ApprovalsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../purchasing/components/ApprovalsPage").then((m) => ({ default: m.ApprovalsPage }))
);
export const AuditLogPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../audit/components/AuditLogPage").then((m) => ({ default: m.AuditLogPage }))
);
export const LabelSettingsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../settings/components/LabelSettingsPage").then((m) => ({
    default: m.LabelSettingsPage,
  }))
);
export const GeofenceSettingsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../settings/components/GeofenceSettingsPage").then((m) => ({
    default: m.GeofenceSettingsPage,
  }))
);
export const ExternalPurchasesPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../inventory/components/ExternalPurchasesPage").then((m) => ({
    default: m.ExternalPurchasesPage,
  }))
);
export const SupplierReturnsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../inventory/components/SupplierReturnsPage").then((m) => ({
    default: m.SupplierReturnsPage,
  }))
);
export const AddUserPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../users/components/AddUserPage").then((m) => ({ default: m.AddUserPage }))
);
export const StaffDirectoryPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../users/components/staff-directory/StaffDirectoryPage").then((m) => ({
    default: m.StaffDirectoryPage,
  }))
);
export const AccountantDirectoryPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../users/components/staff-directory/accountant/AccountantDirectoryPage").then(
    (m) => ({ default: m.AccountantDirectoryPage })
  )
);
export const IssueMaterialPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../materials/components/IssueMaterialPage").then((m) => ({
    default: m.IssueMaterialPage,
  }))
);
export const ReturnMaterialPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../materials/components/ReturnMaterialPage").then((m) => ({
    default: m.ReturnMaterialPage,
  }))
);
export const MaterialsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../materials/components/MaterialsPage").then((m) => ({ default: m.MaterialsPage }))
);
export const WeaversPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../weavers/components/WeaversPage").then((m) => ({ default: m.WeaversPage }))
);
export const ProductionPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../production/components/ProductionPage").then((m) => ({
    default: m.ProductionPage,
  }))
);
export const PaymentsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../payments/components/PaymentsPage").then((m) => ({ default: m.PaymentsPage }))
);
export const ReportsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../reports/components/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
export const CustomersPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../customers/components/CustomersPage").then((m) => ({ default: m.CustomersPage }))
);
export const VendorsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../vendors/components/VendorsPage").then((m) => ({ default: m.VendorsPage }))
);
export const SuppliersPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../suppliers/components/SuppliersPage").then((m) => ({ default: m.SuppliersPage }))
);
export const FactoryLoomPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../production/components/FactoryLoomPage").then((m) => ({
    default: m.FactoryLoomPage,
  }))
);
export const FirmsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../firms/components/FirmsPage").then((m) => ({ default: m.FirmsPage }))
);
export const InventoryPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../inventory/components/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
export const QcHistoryPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../qc/components/QcHistoryPage").then((m) => ({ default: m.QcHistoryPage }))
);
export const NotificationsPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../notifications/components/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  }))
);
export const WorkerGRN = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../portals/components/worker/WorkerGRN").then((m) => ({ default: m.WorkerGRN }))
);
export const AllWeaversPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../weavers/components/AllWeaversPage").then((m) => ({ default: m.AllWeaversPage }))
);
export const AllStockPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../inventory/components/AllStockPage").then((m) => ({ default: m.AllStockPage }))
);
export const AllOrdersPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../bulk-orders/components/AllOrdersPage").then((m) => ({
    default: m.AllOrdersPage,
  }))
);
export const ProductionHistoryPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../production/components/ProductionHistoryPage").then((m) => ({
    default: m.ProductionHistoryPage,
  }))
);
export const FinishingTrackingPage = lazy(() =>
  // eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
  import("../../../finishing/components/FinishingTrackingPage").then((m) => ({
    default: m.FinishingTrackingPage,
  }))
);
