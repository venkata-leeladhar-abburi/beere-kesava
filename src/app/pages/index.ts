// Page wrappers — thin routing adapters for existing page components.
// Each file is a proper route component. Internals can be split later.
// Path: src/app/pages/index.ts  →  ../components/ = src/app/components/

// Admin pages
export { MaterialsPage }          from "../components/MaterialsPage";
export { WeaversPage }            from "../components/WeaversPage";
export { ProductionPage }         from "../components/ProductionPage";
export { PaymentsPage }           from "../components/PaymentsPage";
export { ReportsPage }            from "../components/ReportsPage";
export { CustomersPage }          from "../components/CustomersPage";
export { InventoryPage }          from "../components/InventoryPage";
export { NotificationsPage }      from "../components/NotificationsPage";
export { FirmsPage }              from "../components/FirmsPage";
export { ExternalPurchasesPage }  from "../components/ExternalPurchasesPage";
export { DesignLibraryPage }      from "../components/DesignLibraryPage";
export { BatchCreationPage }      from "../components/BatchCreationPage";
export { IssueMaterialPage }      from "../components/IssueMaterialPage";
export { AllWeaversPage }         from "../components/AllWeaversPage";
export { AllStockPage }           from "../components/AllStockPage";
export { AllOrdersPage }          from "../components/AllOrdersPage";
export { QcHistoryPage }          from "../components/QcHistoryPage";
export { ProductionHistoryPage }  from "../components/ProductionHistoryPage";
export { AddUserPage }            from "../components/AddUserPage";
export { RatesPricingPage }       from "../components/RatesPricingPage";
export { ApprovalsPage }          from "../components/ApprovalsPage";
export { AuditLogPage }           from "../components/AuditLogPage";
export { LabelSettingsPage }      from "../components/LabelSettingsPage";

// Worker pages
export { WorkerGRN as WorkerGRNPage }             from "../components/worker/WorkerGRN";
export { WorkerQC as WorkerQCPage }               from "../components/worker/WorkerQC";
export { WorkerWeavers as WorkerWeaversPage }      from "../components/worker/WorkerWeavers";
export { WorkerFinishing as WorkerFinishingPage }  from "../components/worker/WorkerFinishing";
