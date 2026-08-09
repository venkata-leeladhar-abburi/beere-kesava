import React from "react";
import { useAuth } from "../../contexts/AuthContext";

// ─── Download / export access ────────────────────────────────────────────────
// Pages here are shared between the Admin, Superadmin and Accountant portals.
// The accountant may read every figure but may not take reports out of the
// system, so their portal mounts this provider with `allowed={false}` and every
// download control checks it. Defaults to true so the other portals are
// unaffected.
//
// Separately, the logged-in user's real `accessLevel` field
// (`DOWNLOAD_RESTRICTED`, see backend/prisma/schema.prisma) is combined in —
// any staff account flagged that way loses download access regardless of
// which portal mounts this provider or what `allowed` it was passed. Note
// this is a frontend display-only restriction: it hides/disables the download
// controls in the UI, but the underlying API endpoints are not gated, so it
// is not a real security boundary.
const DownloadAccessContext = React.createContext<boolean>(true);

export function DownloadAccessProvider({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  return (
    <DownloadAccessContext.Provider value={allowed}>
      {children}
    </DownloadAccessContext.Provider>
  );
}

/**
 * True when the current portal is allowed to download or export.
 * Combines the per-portal provider flag (e.g. the Accountant portal, which
 * mounts `allowed={false}` regardless of accessLevel) with the logged-in
 * user's real `accessLevel`, so a `DOWNLOAD_RESTRICTED` account loses
 * download access everywhere, even in portals that never mount the provider.
 */
export function useDownloadsAllowed(): boolean {
  const portalAllowed = React.useContext(DownloadAccessContext);
  const { user } = useAuth();
  const restrictedByAccessLevel = user?.accessLevel === "DOWNLOAD_RESTRICTED";
  return portalAllowed && !restrictedByAccessLevel;
}

/** Renders its children only where downloading is permitted. */
export function DownloadGate({ children }: { children: React.ReactNode }) {
  return useDownloadsAllowed() ? <>{children}</> : null;
}

/**
 * design-system/07-DOCUMENTS.md Part L.3 — the export-permission gate for
 * document actions. Distinct from `DownloadGate` in name only: printing
 * itself is universal (see useDocument's `print`), so `PrintGate` exists to
 * wrap a *document's whole action toolbar* for a caller that wants to hide
 * Download/Email together when the user has no export rights at all, using
 * the same underlying check `useDocument().download()` already enforces.
 */
export function PrintGate({ children }: { children: React.ReactNode }) {
  return useDownloadsAllowed() ? <>{children}</> : null;
}
