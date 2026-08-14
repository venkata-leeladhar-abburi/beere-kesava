// Public surface of this feature.
// External consumers (other features, app/) should import from here,
// not reach into internal paths directly. Enforced by
// eslint import/no-restricted-paths (see eslint.config.js) — currently a
// warning while existing cross-feature imports are migrated over.
//
// Explicit named exports here (not `export *`): ShopStaffPortal.tsx and
// WeaverPortal.tsx each independently declare their own private
// `UserProfileModal` component — same name, different implementations,
// neither meant to be public. `export *` would collide.
export { ShopStaffPortal } from "./components/ShopStaffPortal";
export { WeaverPortal } from "./components/WeaverPortal";
export { WorkerPortal } from "./components/WorkerPortal";
export { WorkerFinishing } from "./components/worker/WorkerFinishing";
export { WorkerGRN, INITIAL_HISTORY } from "./components/worker/WorkerGRN";
export { WorkerQC } from "./components/worker/WorkerQC";
export { WorkerWeavers } from "./components/worker/WorkerWeavers";
export * from "./components/worker/weavers/MaterialSplitPanel";
export * from "./components/worker/ReceiptHistoryTable";
