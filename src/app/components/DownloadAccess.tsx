import React from "react";

// ─── Download / export access ────────────────────────────────────────────────
// Pages here are shared between the Admin, Superadmin and Accountant portals.
// The accountant may read every figure but may not take reports out of the
// system, so their portal mounts this provider with `allowed={false}` and every
// download control checks it. Defaults to true so the other portals are
// unaffected.
const DownloadAccessContext = React.createContext<boolean>(true);

export function DownloadAccessProvider({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  return (
    <DownloadAccessContext.Provider value={allowed}>
      {children}
    </DownloadAccessContext.Provider>
  );
}

/** True when the current portal is allowed to download or export. */
export function useDownloadsAllowed(): boolean {
  return React.useContext(DownloadAccessContext);
}

/** Renders its children only where downloading is permitted. */
export function DownloadGate({ children }: { children: React.ReactNode }) {
  return useDownloadsAllowed() ? <>{children}</> : null;
}
