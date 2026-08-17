// Public surface of this feature.
// External consumers (other features, app/) should import from here,
// not reach into internal paths directly. Enforced by
// eslint import/no-restricted-paths (see eslint.config.js) — currently a
// warning while existing cross-feature imports are migrated over.

export * from "./components/AllPurchasesPage";
export * from "./components/AllStockPage";
export * from "./components/ExternalPurchasesPage";
export * from "./components/InventoryPage";
export * from "./components/SupplierReturnsPage";
