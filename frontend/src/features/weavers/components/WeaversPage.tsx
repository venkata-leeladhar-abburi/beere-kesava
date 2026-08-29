import { useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useBatches } from "@/features/production";

import { T, F } from "./theme";
import { WEAVERS } from "./data";
import { ActionDialog } from "./common/primitives";
import { PageHeader, StatsStrip, WeaverStatTile } from "./sections/PageHeaderAndStats";
import { weaversApi } from "../../../shared/api/weavers";
import { warpRequestsApi } from "../../../shared/api/warpRequests";
import { paymentsApi } from "../../../shared/api/payments";
import { resolveAssetUrl } from "../../../shared/api/uploads";
import { rupees, formatMoney } from "@/lib/domain/money";
import { WarpRequestsSection } from "./sections/WarpRequestsSection";
import { AllWeaversControls } from "./sections/WeaverDirectoryControls";
import { WeaverDirectory } from "./sections/WeaverTableAndDirectory";
import { WeaverDrawer } from "./sections/WeaverDrawer";
import { WeaverAnalytics } from "./sections/WeaverAnalytics";
import { LeaderboardAndQC } from "./sections/LeaderboardAndQC";
import { MaterialsFooter } from "@/features/materials";
import { NewWeaverModal } from "./modals/NewWeaverModal";
import { ImportWeaversModal } from "./modals/ImportWeaversModal";

/**
 * Composition root for the Weavers feature. Originally a single
 * 2,644-line file — split into theme/types/data + common primitives +
 * modals/ + sections/ (including a weaverDrawer/ and leaderboard/
 * sub-split for the two largest sections), all under this same
 * directory. See git history for the pre-split version if you need to
 * trace exactly what moved where.
 *
 * MOCK-BACKED (known gap): the directory/analytics/leaderboard/warp-request
 * sections rendered below (PageHeader, StatsStrip, WarpRequestsSection,
 * WeaverDirectory, WeaverAnalytics, LeaderboardAndQC) all still read the
 * static WEAVERS/TABLE_ROWS/etc. arrays from ./data.ts, not the real
 * /weavers API — see the comment at the top of data.ts. Real identity/roster
 * wiring has been done in AllWeaversPage.tsx (GET /weavers) and
 * NewWeaverModal.tsx (POST /weavers) instead; a weaver registered there will
 * NOT yet appear in this page's directory until data.ts's mock roster is
 * replaced, which requires the WV-XXX-id migration and production-stats
 * wiring called out as out of scope for this pass.
 */
export function WeaversPage({ onNavigate }: { onNavigate?: (tab: string, ctx?: unknown) => void } = {}) {
  const location = useLocation();
  const navState = location.state as { weaverId?: string; mode?: "view" | "edit" } | null;

  // When navigating here from AllWeaversPage with a weaverId, fetch the real
  // weaver object from the backend instead of looking it up in WEAVERS[] (which
  // is an empty mock array — the lookup always returned null, silently breaking
  // the drawer).
  const { data: navWeaver } = useQuery({
    queryKey: ["weaver-nav", navState?.weaverId],
    queryFn: () => weaversApi.findOne(navState!.weaverId!),
    enabled: !!navState?.weaverId,
  });

  // Map the backend BackendWeaver shape to the shape WeaverDrawer expects
  // (same shape produced by useRealWeavers). When the query is loading,
  // navWeaverObj is undefined and initialSelected stays null.
  const navWeaverObj = navWeaver
    ? {
        id: navWeaver.id,
        code: navWeaver.code,
        name: navWeaver.name,
        initials: navWeaver.initials || `${navWeaver.firstName.charAt(0)}${navWeaver.lastName.charAt(0)}`,
        bg: "#6E0F2D",
        village: navWeaver.village || "—",
        cluster: navWeaver.cluster || "—",
        mobile: navWeaver.phone || "—",
        looms: navWeaver.looms,
        // Local weavers `Status` ("active"|"qc"|"idle" — ../types.ts), not
        // lib/domain/status.ts's taxonomy: mixes person/production/condition
        // concepts in one union and `types.ts` is shared outside this pass's
        // scope. Documented exception, not a raw-literal bug.
        status: "idle" as const,
        batch: "",
        design: "—",
        photo: resolveAssetUrl(navWeaver.photoUrl),
        thisMonth: 0,
        passRate: 0,
        totalEver: 0,
        totalPaid: "—",
        lastActive: "—",
      }
    : null;

  const [view, setView] = useState("card");
  const [filter, setFilter] = useState("All Weavers");
  const [search, setSearch] = useState("");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(null);
  // Command palette "New Weaver" action deep-links here with ?new=1 to open
  // the registration form straight away.
  const [newWeaverExpanded, setNewWeaverExpanded] = useState(() => new URLSearchParams(location.search).get("new") === "1");
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">(navState?.mode === "edit" ? "edit" : "view");
  const [batchDialog, setBatchDialog] = useState<typeof WEAVERS[0] | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { batches } = useBatches();

  // Use the live-fetched weaver when navigating from AllWeavers, otherwise the
  // manually selected one from the directory.
  const activeWeaver = navWeaverObj ?? selectedWeaver;

  // Real aggregate numbers for the hero stats strip. GET /weavers/leaderboard
  // only returns the top 10, so the roster + per-weaver GET /weavers/:id/stats
  // calls are used to compute true totals/averages across everyone.
  const { data: weaversRes, refetch: refetchWeavers } = useQuery({
    queryKey: ["weavers-page-roster"],
    queryFn: () => weaversApi.list(),
  });
  const roster = weaversRes?.items ?? [];
  const { data: statsList } = useQuery({
    queryKey: ["weavers-page-stats", roster.map(w => w.id)],
    queryFn: () => Promise.all(roster.map(w => weaversApi.getStats(w.id))),
    enabled: roster.length > 0,
  });
  const allStats = statsList ?? [];
  const totalActiveWeavers = roster.filter(w => w.status === "ACTIVE").length;
  const totalSareesWoven = allStats.reduce((s, st) => s + st.totalSareesWoven, 0);
  const avgPassRate = allStats.length ? Math.round(allStats.reduce((s, st) => s + st.qcPassRate, 0) / allStats.length) : 0;

  const { data: pendingWarpRequestsRes } = useQuery({
    queryKey: ["warp-requests-pending", "weavers-page-stats"],
    queryFn: () => warpRequestsApi.list("PENDING"),
  });
  const warpRequestsPending = pendingWarpRequestsRes?.items.length ?? 0;

  const { data: paymentSummary } = useQuery({
    queryKey: ["payments-summary", "weavers-page-stats"],
    queryFn: () => paymentsApi.getSummary(),
  });
  const totalPaidToWeavers = paymentSummary?.weaverTotal ?? 0;

  const realStats: WeaverStatTile[] = [
    { label: "TOTAL ACTIVE WEAVERS", value: `${totalActiveWeavers}`, sub: "All currently working with the firm", gold: false, crimson: false },
    { label: "TOTAL SAREES WOVEN", value: `${totalSareesWoven}`, sub: "All-time, across all weavers", gold: false, crimson: false },
    { label: "QUALITY CHECK PASS RATE", value: `${avgPassRate}%`, sub: "Average across all weavers", gold: true, crimson: false },
    { label: "WARP REQUESTS PENDING", value: `${warpRequestsPending}`, sub: "Awaiting admin approval", gold: false, crimson: warpRequestsPending > 0 },
    { label: "TOTAL PAID TO WEAVERS", value: formatMoney(rupees(totalPaidToWeavers)), sub: "All-time payments recorded", gold: false, crimson: false },
  ];

  if (activeWeaver) {
    return (
      <WeaverDrawer weaver={activeWeaver} initialMode={drawerMode} onClose={() => setSelectedWeaver(null)} onNavigate={onNavigate} />
    );
  }

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PageHeader />
      <StatsStrip stats={realStats} />
      <WarpRequestsSection />
      <div id="weav-all-weavers">
        <AllWeaversControls view={view} setView={setView} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onAddWeaver={() => setNewWeaverExpanded(true)} onViewAll={() => onNavigate?.("AllWeavers")} onImport={() => setImportOpen(true)}>
          <WeaverDirectory view={view} onSelect={(w) => { setDrawerMode("view"); setSelectedWeaver(w); }} onEdit={(w) => { setDrawerMode("edit"); setSelectedWeaver(w); }} onBatches={setBatchDialog} />
        </AllWeaversControls>
      </div>
      <div id="weav-performance"><WeaverAnalytics /></div>
      <div id="weav-activities"><LeaderboardAndQC onActivities={() => onNavigate?.("Notifications")} onNavigate={onNavigate} /></div>
      <NewWeaverModal expanded={newWeaverExpanded} setExpanded={setNewWeaverExpanded} />
      <ImportWeaversModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { void refetchWeavers(); }}
      />
      <div style={{ marginTop: "auto" }}>
        <MaterialsFooter />
      </div>

      <AnimatePresence>
        {batchDialog && (() => {
          // Backend never transitions a batch's own status to "completed"
          // (only draft→active exists), so gating on b.status alone always
          // returned zero rows here. A batch counts as done once every row
          // has passed QC — same fallback DraftsTab.tsx already uses.
          const weaverCompletedBatches = batches.filter(b =>
            (b.status === "completed" || (b.totalCount > 0 && b.rows.every(r => r.qcPassed === true))) &&
            b.rows.some(r => r.weaverId === batchDialog.id)
          );

          const getBatchNum = (id: string) => {
            const match = id.match(/BATCH-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const sorted = [...weaverCompletedBatches].sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));

          return (
            <ActionDialog open={!!batchDialog} title={`${batchDialog.name} Completed Batches`} onClose={() => setBatchDialog(null)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 350, overflowY: "auto" }}>
                {sorted.length > 0 ? (
                  sorted.map(b => {
                    const totalSarees = b.rows.filter(r => r.weaverId === batchDialog.id).length;
                    const distinctDesigns = Array.from(new Set(b.rows.filter(r => r.weaverId === batchDialog.id && r.designCode).map(r => r.designCode).filter(Boolean))).join(", ") || "—";
                    return (
                      <div key={b.batchId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, border: `1px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui }}>
                        <span>
                          <b>{b.batchId}</b> · Design: {distinctDesigns}
                        </span>
                        <span style={{ color: T.taupe }}>
                          {totalSarees} sarees · Due: {b.dueDate || "—"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 14, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontStyle: "italic" }}>
                    No completed batches found.
                  </div>
                )}
              </div>
            </ActionDialog>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
