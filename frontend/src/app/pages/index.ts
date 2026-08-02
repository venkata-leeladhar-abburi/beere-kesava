// Page wrappers — thin routing adapters for existing page components.
// Each file is a proper route component. Internals can be split later.
// Path: src/app/pages/index.ts  →  ../components/ = src/app/components/

// Admin pages
export { MaterialsPage }          from "../../features/materials/components/MaterialsPage";
export { WeaversPage }            from "../../features/weavers/components/WeaversPage";
export { ProductionPage }         from "../../features/production/components/ProductionPage";
export { PaymentsPage }           from "../../features/payments/components/PaymentsPage";
export { ReportsPage }            from "../../features/reports/components/ReportsPage";
export { OutstandingPage }        from "../components/OutstandingPage";
export { CustomersPage }          from "../../features/customers/components/CustomersPage";
export { InventoryPage }          from "../../features/inventory/components/InventoryPage";
export { NotificationsPage }      from "../components/NotificationsPage";
export { FirmsPage }              from "../components/FirmsPage";
export { ExternalPurchasesPage }  from "../../features/inventory/components/ExternalPurchasesPage";
export { DesignLibraryPage }      from "../components/DesignLibraryPage";
export { BatchCreationPage }      from "../components/BatchCreationPage";
export { IssueMaterialPage }      from "../../features/materials/components/IssueMaterialPage";
export { AllWeaversPage }         from "../components/AllWeaversPage";
export { AllStockPage }           from "../../features/inventory/components/AllStockPage";
export { AllOrdersPage }          from "../../features/bulk-orders/components/AllOrdersPage";
export { QcHistoryPage }          from "../components/QcHistoryPage";
export { ProductionHistoryPage }  from "../../features/production/components/ProductionHistoryPage";
export { AddUserPage }            from "../components/AddUserPage";
export { RatesPricingPage }       from "../components/RatesPricingPage";
export { ApprovalsPage }          from "../../features/purchasing/components/ApprovalsPage";
export { AuditLogPage }           from "../components/AuditLogPage";
export { LabelSettingsPage }      from "../components/LabelSettingsPage";

// Worker pages
export { WorkerGRN as WorkerGRNPage }             from "../components/worker/WorkerGRN";
export { WorkerQC as WorkerQCPage }               from "../components/worker/WorkerQC";
export { WorkerWeavers as WorkerWeaversPage }      from "../components/worker/WorkerWeavers";
export { WorkerFinishing as WorkerFinishingPage }  from "../components/worker/WorkerFinishing";
