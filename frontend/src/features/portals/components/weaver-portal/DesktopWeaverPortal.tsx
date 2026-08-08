import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useBatches } from "../../../production/contexts/BatchContext";
import { DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Layers, ClipboardCheck, Package, CreditCard } from "lucide-react";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import { F, MyBatchEntry, Tab5 } from "./theme";
import { useCurrentWeaver } from "./useCurrentWeaver";

import { NotificationsPage } from "./NotificationsPage";
import { TopNav } from "./desktop/TopNav";
import { BatchesSection } from "./desktop/BatchesSection";
import { ConfirmSection } from "./desktop/ConfirmSection";
import { WarpSection } from "./desktop/WarpSection";
import { PaymentsSection } from "./desktop/PaymentsSection";

// ─── DESKTOP SHELL ─────────────────────────────────────────────────────────

export function DesktopWeaverPortal({ onBack, bp = "desktop", active, setActive, onProfile }: { onBack?: () => void; bp?: "tablet" | "desktop"; active: Tab5; setActive: (t: Tab5) => void; onProfile?: () => void }) {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  const isTablet = bp === "tablet";
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // Batches sub-page navigation
  const [batchesSubPage, setBatchesSubPage] = useState<"main" | "history" | "completed">("main");

  const { batches } = useBatches();
  const { getRecordsForWeaver, getMaterialSummaryForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const { weaver, weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const weaverMaterialRecords = weaverId ? getRecordsForWeaver(weaverId) : [];
  const pendingMaterialRecord = weaverMaterialRecords.find(r => r.status === "pending-signature") ?? null;
  const matSummary = getMaterialSummaryForWeaver(weaverId ?? "");
  const matByBatch = weaverId ? getMaterialSummaryByBatch(weaverId) : [];

  const isMyRow = (r: { weaverId?: string | null }) => {
    if (!r.weaverId) return false;
    if (weaverId && r.weaverId.toLowerCase() === weaverId.toLowerCase()) return true;
    if (!weaver) return false;
    const wId = weaver.id.toLowerCase();
    const wCode = weaver.code.toLowerCase();
    const rId = r.weaverId.toLowerCase();
    return rId === wId || rId === wCode;
  };

  // A batch is visible to its assigned weaver even in draft status
  // so they can see upcoming work, and so the "Draft" quick filter works.
  const myWeaverBatches: MyBatchEntry[] = batches
    .map(b => ({ ...b, myRows: b.rows.filter(isMyRow) }))
    .filter(b => b.myRows.length > 0);

  const isBatchDone = (b: MyBatchEntry) => {
    if (b.status === "completed") return true;
    if (b.myRows.length === 0) return false;
    return b.myRows.every(r => r.qcPassed === true);
  };

  // Completed: batch status is completed OR every saree assigned to this weaver has passed QC
  const completedBatches: MyBatchEntry[] = myWeaverBatches.filter(isBatchDone);
  // Active: anything not yet completed
  const myActiveBatches: MyBatchEntry[] = myWeaverBatches.filter(b => !isBatchDone(b));

  const myDefectiveSarees = useMemo(() => {
    return batches.flatMap(b =>
      b.rows
        .filter(r => r.weaverId === weaverId && r.qcPassed === false)
        .map(r => ({
          sareeId: r.sareeId,
          batchId: b.batchId,
          designCode: r.designCode,
          sareeTypeCode: r.sareeTypeCode,
          sareeTypeName: r.sareeTypeName,
          date: "10 Jun 2026",
          defect: "Thread Break",
          deduction: 450,
        }))
    );
  }, [batches, weaverId]);

  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);

  // Confirm page state
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<typeof pendingMaterialRecord>(null);
  const [requestSent, setRequestSent] = useState(false);

  // Warp request state
  const [warpBatch, setWarpBatch] = useState<"086" | "089">("086");
  const [materials, setMaterials] = useState({ warp: false, resham: false, jari: false });
  const [amounts, setAmounts] = useState({ warp: "", resham: "", jari: "" });
  const [reason, setReason] = useState("");
  const [warpSubmitted, setWarpSubmitted] = useState(false);

  const NAV: { id: Tab5; label: string; icon: React.ReactNode }[] = [
    { id: "batches",   label: "My Batches",   icon: <Layers size={16} /> },
    { id: "confirm",   label: "Confirm",       icon: <ClipboardCheck size={16} /> },
    { id: "warp",      label: "Warp Request",  icon: <Package size={16} /> },
    { id: "payments",  label: "Payments",      icon: <CreditCard size={16} /> },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F4F0", fontFamily: F.u }}>
      <TopNav
        isTablet={isTablet} NAV={NAV} active={active} showNotifs={showNotifs}
        setActive={setActive} setShowNotifs={setShowNotifs}
        search={search} setSearch={setSearch}
        showProfile={showProfile} setShowProfile={setShowProfile}
        onProfile={onProfile} onBack={onBack}
        selectRole={selectRole} navigate={navigate}
      />

      {/* ── Page Content ── */}
      {!showNotifs && weaverLoading && (
        <div style={{ margin: "40px 24px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: "#8A7F76" }}>Loading your weaver profile…</div>
      )}
      {!showNotifs && !weaverLoading && (weaverError || !weaverId) && (
        <div style={{ margin: "40px 24px", background: "#FFF", borderRadius: 14, padding: "28px 20px", textAlign: "center" as const, border: "1px solid rgba(110,15,45,0.12)" }}>
          <div style={{ fontFamily: F.u, fontSize: 14, color: "#3B2314", fontWeight: 600 }}>Couldn't find your weaver profile</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "#8A7F76", marginTop: 4 }}>Your login isn't linked to a weaver record yet. Contact your supervisor.</div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {(showNotifs || (!weaverLoading && !weaverError && weaverId)) && (
        <motion.div key={showNotifs ? "notifs" : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

          {/* ════════ NOTIFICATIONS ════════ */}
          {showNotifs && (<NotificationsPage />)}

          {/* ════════ MY BATCHES ════════ */}
          {!showNotifs && active === "batches" && (
            <BatchesSection
              bp={bp} isTablet={isTablet}
              batchesSubPage={batchesSubPage} setBatchesSubPage={setBatchesSubPage}
              myDefectiveSarees={myDefectiveSarees}
              myActiveBatches={myActiveBatches} completedBatches={completedBatches}
              setActive={setActive}
            />
          )}

          {/* ════════ CONFIRM ════════ */}
          {!showNotifs && active === "confirm" && (
            <ConfirmSection
              bp={bp} isTablet={isTablet}
              pendingMaterialRecord={pendingMaterialRecord} confirmed={confirmed} confirmedRecord={confirmedRecord}
              matByBatch={matByBatch} matSummary={matSummary} weaverMaterialRecords={weaverMaterialRecords}
              setActive={setActive} setConfirmed={setConfirmed} setConfirmedRecord={setConfirmedRecord}
              setSigMethod={setSigMethod} setHasSig={setHasSig} setRequestSent={setRequestSent}
            />
          )}

          {/* ════════ WARP REQUEST ════════ */}
          {!showNotifs && active === "warp" && (
            <WarpSection bp={bp} isTablet={isTablet} />
          )}

          {/* ════════ PAYMENTS ════════ */}
          {!showNotifs && active === "payments" && (
            <PaymentsSection bp={bp} isTablet={isTablet} />
          )}

        </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewDesign && <DesignCodeCard design={viewDesign} onClose={() => setViewDesign(null)} />}
      </AnimatePresence>

    </div>
  );
}
