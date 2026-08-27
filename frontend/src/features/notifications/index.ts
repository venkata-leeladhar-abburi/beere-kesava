// Public surface of this feature.
// External consumers (other features, app/) should import from here,
// not reach into internal paths directly. Enforced by
// eslint import/no-restricted-paths (see eslint.config.js) — currently a
// warning while existing cross-feature imports are migrated over.

export * from "./components/NotificationsPage";
// Display helpers shared with the per-portal notification bells, so a bell
// and the full page never describe the same backend row differently.
export {
  notificationTitle,
  notificationBody,
  formatRelativeTime,
  toUnifiedNotif,
} from "./components/notifFormat";
export { useNotificationBell } from "./useNotificationBell";
