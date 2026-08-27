// Public surface of this feature.
// External consumers (other features, app/) should import from here,
// not reach into internal paths directly. Enforced by
// eslint import/no-restricted-paths (see eslint.config.js) — currently a
// warning while existing cross-feature imports are migrated over.
//
// Explicit named exports here (not `export *`): AccountantDashboard,
// BeereDashboard, and SuperadminDashboard each independently declare their
// own private `UserProfileModal` component — same name, different
// implementations, neither meant to be public. `export *` would collide.
export { AccountantDashboard } from "./components/AccountantDashboard";
export { BeereDashboard } from "./components/BeereDashboard";
export { SuperadminDashboard } from "./components/SuperadminDashboard";
export * from "./components/beere-dashboard/theme";
export * from "./components/beere-dashboard/ui";
export { NAV_GROUPS } from "./components/superadmin-dashboard/data";
