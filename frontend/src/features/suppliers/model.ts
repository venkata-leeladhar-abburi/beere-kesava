// The suppliers feature's pure types and helpers, without its screens.
//
// index.ts re-exports SuppliersPage, which reaches most of the app. App-wide
// data providers (contexts/index.ts) import supplier helpers too, so going
// through index.ts put nearly every screen, plus the chart and barcode
// libraries, in the bundle every page loads before login. Import from here
// when only the model is needed.
export * from "./contexts/supplier-types";
