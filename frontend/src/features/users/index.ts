// Public surface of this feature.
// External consumers (other features, app/) should import from here,
// not reach into internal paths directly. Enforced by
// eslint import/no-restricted-paths (see eslint.config.js) — currently a
// warning while existing cross-feature imports are migrated over.

export * from "./components/AddUserPage";
// Admin/superadmin oversight views: everyone in a staff portal, and what
// each of them has done there.
export { StaffDirectoryPage, AccountantDirectoryPage, WORKER_SCOPE, SHOP_SCOPE, ACCOUNTANT_SCOPE } from "./components/staff-directory";
