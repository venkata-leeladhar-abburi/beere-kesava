import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useBatches } from "@/features/production";
import { useFinishing } from "@/features/finishing";
import { useDesignLibrary } from "@/features/design-library";
import { useQc } from "@/features/qc";
import { DesignCodeCard } from "@/features/design-library";
import { SareeTypeCard } from "@/features/pricing";
import { useRatesPricing } from "@/features/pricing";
import { AnimatePresence } from "motion/react";
import {
  ChevronLeft, CheckCircle2, Search, AlertTriangle, ClipboardCheck, User, Package,
} from "lucide-react";
import {
  T, F, SareeItem, InspectionResult, DefectiveLogItem, PassedLogItem, splitDesignField,
} from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { WorkerQCInspectionScreen } from "./WorkerQCInspectionScreen";
import { WorkerQCSareeCard } from "./WorkerQCSareeCard";
import { WorkerQCDefectiveSection } from "./WorkerQCDefectiveSection";
import { WorkerQCSemiDefectiveSection } from "./WorkerQCSemiDefectiveSection";
import { WorkerQCCompletedTodaySection } from "./WorkerQCCompletedTodaySection";
import { WorkerQCHistorySection } from "./WorkerQCHistorySection";
import { WorkerQCQueueHeader } from "./WorkerQCQueueHeader";
import { WorkerQCWeaverGrid, WorkerQCBatchGrid } from "./WorkerQCGridCards";
import { IconButton, Input } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { rupees, formatMoney } from "@/lib/domain/money";
import { type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

export function WorkerQC({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { batches, isLoading: batchesLoading, isError: batchesError, error: batchesErrorObj, refetch: refetchBatches } = useBatches();
  const { addReadySaree, dispatches } = useFinishing();
  const { recordQc, qcRecords, isLoading: qcLoading, isError: qcError, error: qcErrorObj, refetch: refetchQc } = useQc();

  const isLoading = batchesLoading || qcLoading;
  const isError = batchesError || qcError;
  const loadError = batchesErrorObj ?? qcErrorObj ?? null;
  const refetchAll = () => { refetchBatches(); refetchQc(); };
  // A saree already on a dispatch record has left the premises — it has no
  // business sitting in the inspection queue even if its receipt/QC fields
  // say otherwise (mis-sequenced dispatch, or a late-entered QC result).
  const dispatchedSareeIds = useMemo(
    () => new Set(dispatches.flatMap(d => d.sareeIds)),
    [dispatches],
  );
  const { getDesign } = useDesignLibrary();
  const { getSareeTypeByName, getSareeTypeByCode } = useRatesPricing();
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  const contextRows = useMemo<SareeItem[]>(() => {
    return batches
      .filter(b => b.status === "active")
      .flatMap(b =>
        b.rows
          // qcPassed stays null/undefined until a QC record exists for the
          // row — once set (pass or fail), it must drop out of the queue.
          // receivedAt gates entry: a saree only enters QC once Worker Staff
          // has actually received it from the weaver/loom. A row belongs to
          // either an outsourced weaver or one of the factory's own looms —
          // either identity is enough to admit it into the queue, not just
          // weaverName (which is null for factory-loom rows and previously
          // hid them from Quality Check entirely).
          .filter(r => r.sareeId && (r.weaverName || r.factoryLoomNumber) && r.receivedAt && r.qcPassed == null && !dispatchedSareeIds.has(r.sareeId))
          .map(r => ({
            id: r.sareeId!,
            batch: b.batchId,
            source: r.weaverName ? "outsourced" as const : "own" as const,
            weaver: r.weaverName ?? r.factoryLoomNumber ?? "Factory Loom",
            // factoryLoomId is a raw database id, not a human-readable code —
            // factoryLoomNumber (e.g. "Loom F-02") already serves as this
            // row's identity above, so leave the code badge blank rather than
            // surface a UUID for factory-loom rows.
            wcode: r.weaverId ?? "",
            weaverCode: r.weaverCode ?? undefined,
            design: [r.designCode, r.sareeTypeName].filter(Boolean).join(" · "),
            weight: 0,
            std: 850,
            submitted: "Pending weighing",
            bulkOrderLabel: r.bulkOrderLabel ?? undefined,
            bulkOrderRef: r.bulkOrderRef ?? undefined,
            sareeTypeCode: r.sareeTypeCode ?? undefined,
            loomNumber: r.weaverLoom ?? null,
          }))
      );
  }, [batches, dispatchedSareeIds]);

  const ALL_QUEUE = contextRows;

  const [inspecting, setInspecting] = useState<SareeItem | null>(null);
  const [result, setResult] = useState<InspectionResult>(null);
  const [defectTypes, setDefectTypes] = useState<string[]>([]);
  // The actual captured image (data URL for now — swap for the uploaded
  // cloud URL once storage is wired up server-side; the QC payload/API
  // already just takes a string, so nothing else here needs to change).
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [deductionAmount, setDeductionAmount] = useState<number | "">("");
  const [defectSubmitted, setDefectSubmitted] = useState(false);
  const [inspected, setInspected] = useState<Set<string>>(new Set());
  const [errorToast, setErrorToast] = useState("");
  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(""), 4000);
  };
  const [resultToast, setResultToast] = useState<{ msg: string; kind: "passed" | "semi" | "defective" } | null>(null);
  const showResultToast = (msg: string, kind: "passed" | "semi" | "defective") => {
    setResultToast({ msg, kind });
    setTimeout(() => setResultToast(null), 4000);
  };
  // Derived straight from real QC records — recordQc's refetch keeps this
  // current, so there's no local mutation to make when a defect is logged.
  const qcLog = useMemo<DefectiveLogItem[]>(() => qcRecords
    .filter(r => r.result === "defective" || r.result === "semi")
    .map(r => ({
      recordId: r.id,
      id: r.sareeId,
      weaver: r.weaverName ?? r.factoryLoomNumber ?? "—",
      defects: r.defects,
      date: new Date(r.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      deduction: formatMoney(rupees(r.deduction)),
      isoDate: r.qcDate,
      result: r.result as "defective" | "semi",
      sareeType: r.sareeTypeName ?? "",
      batchId: r.batchId,
      makingCharge: formatMoney(rupees(r.makingCharge)),
      payable: formatMoney(rupees(r.payable)),
      notes: r.notes,
      photoUrl: r.photoUrl,
      inspectedBy: r.inspectedBy,
      receivedDate: new Date(r.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    })),
  [qcRecords]);

  const defLog = useMemo(() => qcLog.filter(d => d.result === "defective"), [qcLog]);
  const semiLog = useMemo(() => qcLog.filter(d => d.result === "semi"), [qcLog]);

  const passedLog = useMemo<PassedLogItem[]>(() => qcRecords
    .filter(r => r.result === "passed")
    .map(r => ({
      recordId: r.id,
      id: r.sareeId,
      weaver: r.weaverName ?? r.factoryLoomNumber ?? "—",
      sareeType: r.sareeTypeName ?? "",
      date: new Date(r.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      payable: formatMoney(rupees(r.payable)),
      isoDate: r.qcDate,
      inspectedBy: r.inspectedBy,
    }))
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate)),
  [qcRecords]);

  const completedTodayLog = useMemo(() => {
    const todayStr = new Date().toDateString();
    return passedLog.filter(p => new Date(p.isoDate).toDateString() === todayStr);
  }, [passedLog]);

  const [qcDateFilter, setQcDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [defDateFilter, setDefDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [semiDateFilter, setSemiDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const [qcTab, setQcTab] = useState<"weavers" | "batches">("weavers");
  const [selectedWeaverQC, setSelectedWeaverQC] = useState<string | null>(null);
  const [selectedBatchQC, setSelectedBatchQC] = useState<string | null>(null);
  const [weaverSearch, setWeaverSearch] = useState("");
  const [qcPage, setQcPage] = useState(1);

  const pending = ALL_QUEUE.filter(s => !inspected.has(s.id) && matchesDateFilter(s.isoDate, qcDateFilter));

  const passedThisMonthCount = useMemo(() => {
    const now = new Date();
    return qcRecords.filter(r => {
      const d = new Date(r.qcDate);
      return r.result === "passed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [qcRecords]);

  const rejectedCount = useMemo(() => {
    return qcRecords.filter(r => r.result === "defective").length;
  }, [qcRecords]);

  const weaverGroups = Object.values(
    pending.reduce((acc, s) => {
      if (!acc[s.weaver]) acc[s.weaver] = { name: s.weaver, code: s.weaverCode ?? "", source: s.source, sarees: [] as SareeItem[] };
      acc[s.weaver].sarees.push(s);
      return acc;
    }, {} as Record<string, { name: string; code: string; source: string; sarees: SareeItem[] }>)
  );

  const batchGroups = Object.values(
    pending.reduce((acc, s) => {
      if (!acc[s.batch]) acc[s.batch] = { id: s.batch, sarees: [] as SareeItem[] };
      acc[s.batch].sarees.push(s);
      return acc;
    }, {} as Record<string, { id: string; sarees: SareeItem[] }>)
  );

  const filteredWeavers = weaverSearch
    ? weaverGroups.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase()) || w.code.toLowerCase().includes(weaverSearch.toLowerCase()))
    : weaverGroups;

  const reset = () => {
    setResult(null);
    setDefectTypes([]);
    setPhotoUrl(null);
    setNotes("");
    setDeductionAmount("");
    setDefectSubmitted(false);
  };

  const typeCodeOf = (s: SareeItem) =>
    s.sareeTypeCode ?? getSareeTypeByName(splitDesignField(s.design).typeName)?.code ?? "";

  const makingChargeOf = (s: SareeItem | null) => {
    if (!s) return 0;
    const rate = getSareeTypeByCode(typeCodeOf(s));
    return rate ? Number(rate.charge) || 0 : 0;
  };

  const saveQc = (s: SareeItem, result: "passed" | "semi" | "defective", semiDeduction = 0) => {
    const { typeName } = splitDesignField(s.design);
    return recordQc({
      sareeId: s.id,
      weaverId: s.wcode || null,
      weaverName: s.weaver,
      batchId: s.batch,
      loomNumber: s.loomNumber ?? null,
      sareeTypeCode: typeCodeOf(s),
      sareeTypeName: typeName || null,
      bulkOrderLabel: s.bulkOrderLabel ?? null,
      result,
      defects: result === "passed" ? [] : defectTypes,
      semiDeduction,
      notes: result === "passed" ? undefined : notes || undefined,
      photoUrl: result === "passed" ? undefined : photoUrl ?? undefined,
      inspectedBy: "Worker Staff",
    });
  };

  const markPassedDirect = (s: SareeItem) => {
    saveQc(s, "passed").then(() => {
      setInspected(p => new Set(p).add(s.id));

      const { code: designCode, typeName } = splitDesignField(s.design);
      const sareeTypeCode = s.sareeTypeCode ?? getSareeTypeByName(typeName)?.code ?? "";
      const qcPassDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      addReadySaree({
        id: s.id,
        weaverId: s.wcode || undefined,
        weaverName: s.weaver,
        designCode,
        sareeTypeCode,
        sareeType: typeName,
        weight: s.weight ? `${s.weight}g` : undefined,
        qcPassDate,
        bulkOrderRef: s.bulkOrderRef,
        status: "qc-passed-pending-finishing",
      });
      showResultToast(`${s.id} marked Passed`, "passed");
    }).catch((err) => {
      showError(`Failed to save QC result for ${s.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    });
  };

  const startDefect = (s: SareeItem) => {
    reset();
    setInspecting(s);
    setResult("defective");
  };

  const closeInspect = () => { setInspecting(null); reset(); };

  const confirmDefective = () => {
    if (!inspecting) return;
    const s = inspecting;
    saveQc(s, "defective").then(() => {
      setInspected(p => new Set(p).add(s.id));
      setDefectSubmitted(true);
      showResultToast(`${s.id} marked Defective`, "defective");
    }).catch((err) => {
      showError(`Failed to save QC result for ${s.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    });
  };

  const startSemiApproved = (s: SareeItem) => {
    reset();
    setInspecting(s);
    setResult("semi_approved");
  };

  // Semi-approved is NOT a pass: the saree goes back to the weaver for rework
  // rather than on to finishing, so it must not be added to the ready queue
  // (the backend also refuses to assign it, and rejects a second QC entry
  // until Worker Staff has received the saree back). It reappears in the
  // receive queue flagged as a rework, and returns here after that.
  const confirmSemiApproved = () => {
    if (!inspecting) return;
    const s = inspecting;
    saveQc(s, "semi", Number(deductionAmount) || 0).then(() => {
      setInspected(p => new Set(p).add(s.id));
      setDefectSubmitted(true);
      showResultToast(`${s.id} marked Semi Approved`, "semi");
    }).catch((err) => {
      showError(`Failed to save QC result for ${s.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    });
  };

  const toasts = createPortal(
    <>
      {errorToast && (
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: T.crim, color: "#FFF", borderRadius: 999, padding: "11px 22px", fontFamily: F.u, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 28px rgba(192,57,43,0.32)", display: "flex", alignItems: "center", gap: 8, maxWidth: "90vw" }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} /> <span>{errorToast}</span>
        </div>
      )}

      {resultToast && (() => {
        const kindStyle = {
          passed: { bg: T.green, icon: CheckCircle2 },
          semi: { bg: "#C4923A", icon: AlertTriangle },
          defective: { bg: T.crim, icon: AlertTriangle },
        }[resultToast.kind];
        const Icon = kindStyle.icon;
        return (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: kindStyle.bg, color: "#FFF", borderRadius: 10, padding: "12px 18px", fontFamily: F.u, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 28px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", gap: 8, maxWidth: "90vw" }}>
            <Icon size={16} style={{ flexShrink: 0 }} /> <span>{resultToast.msg}</span>
          </div>
        );
      })()}
    </>,
    document.body
  );

  if (inspecting) {
    return (
      <>
        <WorkerQCInspectionScreen
          inspecting={inspecting}
          result={result}
          isDesktop={isDesktop}
          defectSubmitted={defectSubmitted}
          defectTypes={defectTypes}
          setDefectTypes={setDefectTypes}
          photoUrl={photoUrl}
          setPhotoUrl={setPhotoUrl}
          notes={notes}
          setNotes={setNotes}
          deductionAmount={deductionAmount}
          setDeductionAmount={setDeductionAmount}
          makingChargeOf={makingChargeOf}
          closeInspect={closeInspect}
          confirmSemiApproved={confirmSemiApproved}
          confirmDefective={confirmDefective}
        />
        {toasts}
      </>
    );
  }

  const pad = isDesktop ? "0 0" : "0 16px";
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const ITEMS_PER_PAGE = isDesktop ? 20 : isTablet ? 10 : 5;

  const renderCard = (s: SareeItem) => (
    <WorkerQCSareeCard
      key={s.id}
      saree={s}
      isDesktop={isDesktop}
      onMarkPassed={markPassedDirect}
      onStartSemiApproved={startSemiApproved}
      onStartDefect={startDefect}
      onOpenDesignCode={setOpenDesignCode}
      onOpenSareeTypeCode={setOpenSareeTypeCode}
    />
  );

  if (selectedWeaverQC !== null) {
    const wg = weaverGroups.find(w => w.name === selectedWeaverQC);
    const wSarees = wg?.sarees ?? [];
    const totalPages = Math.ceil(wSarees.length / ITEMS_PER_PAGE);
    const pageSarees = wSarees.slice((qcPage - 1) * ITEMS_PER_PAGE, qcPage * ITEMS_PER_PAGE);

    return (
      <div className={`${isDesktop ? "" : "px-4"} mt-8 sm:mt-10`} style={{ paddingBottom: 28 }}>
        <SectionCard
          backButton={
            <IconButton
              icon={ChevronLeft}
              label="Back to weavers"
              variant="ghost"
              onClick={() => {
                setSelectedWeaverQC(null);
                setQcPage(1);
              }}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-white/12 text-white hover:bg-white/20"
            />
          }
          icon={User}
          title={selectedWeaverQC}
          subtitle={`${wSarees.length} saree${wSarees.length !== 1 ? "s" : ""} pending QC`}
          actions={
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 14px", borderRadius: 999 }}>
              {wSarees.length} pending
            </span>
          }
        >
          {isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : isError ? (
            <ErrorState error={loadError} onRetry={refetchAll} />
          ) : wSarees.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: T.brown }}>All done for this weaver!</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 14 : 10, padding: pad }}>
                {pageSarees.map(renderCard)}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#EAE5E1]">
                  <div style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">
                    Showing <span className="font-semibold text-[#1D1814]">{(qcPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(qcPage * ITEMS_PER_PAGE, wSarees.length)}</span> of <span className="font-semibold text-[#1D1814]">{wSarees.length}</span> sarees
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={qcPage <= 1}
                      onClick={() => setQcPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQcPage(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
                          qcPage === p
                            ? "bg-[#6E0F2D] text-white"
                            : "border border-[#EAE5E1] bg-white text-[#4F4A45] hover:bg-[#FAF8F6]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={qcPage >= totalPages}
                      onClick={() => setQcPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>
    );
  }

  if (selectedBatchQC !== null) {
    const bg = batchGroups.find(b => b.id === selectedBatchQC);
    const bSarees = bg?.sarees ?? [];
    const totalPages = Math.ceil(bSarees.length / ITEMS_PER_PAGE);
    const pageSarees = bSarees.slice((qcPage - 1) * ITEMS_PER_PAGE, qcPage * ITEMS_PER_PAGE);

    return (
      <div className={`${isDesktop ? "" : "px-4"} mt-8 sm:mt-10`} style={{ paddingBottom: 28 }}>
        <SectionCard
          backButton={
            <IconButton
              icon={ChevronLeft}
              label="Back to batches"
              variant="ghost"
              onClick={() => {
                setSelectedBatchQC(null);
                setQcPage(1);
              }}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-white/12 text-white hover:bg-white/20"
            />
          }
          icon={Package}
          title={`Batch: ${selectedBatchQC}`}
          subtitle={`${bSarees.length} saree${bSarees.length !== 1 ? "s" : ""} waiting inspection`}
          actions={
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 14px", borderRadius: 999 }}>
              {bSarees.length} pending
            </span>
          }
        >
          {bSarees.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: T.brown }}>All done for this batch!</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 14 : 10, padding: pad }}>
                {pageSarees.map(renderCard)}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#EAE5E1]">
                  <div style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">
                    Showing <span className="font-semibold text-[#1D1814]">{(qcPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(qcPage * ITEMS_PER_PAGE, bSarees.length)}</span> of <span className="font-semibold text-[#1D1814]">{bSarees.length}</span> sarees
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={qcPage <= 1}
                      onClick={() => setQcPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQcPage(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
                          qcPage === p
                            ? "bg-[#6E0F2D] text-white"
                            : "border border-[#EAE5E1] bg-white text-[#4F4A45] hover:bg-[#FAF8F6]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={qcPage >= totalPages}
                      onClick={() => setQcPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 28 }}>
      <WorkerQCQueueHeader
        pendingLength={pending.length}
        passedThisMonthCount={passedThisMonthCount}
        rejectedCount={rejectedCount}
        qcTab={qcTab}
        setQcTab={setQcTab}
        setWeaverSearch={setWeaverSearch}
        qcDateFilter={qcDateFilter}
        setQcDateFilter={setQcDateFilter}
        isDesktop={isDesktop}
      />

      <div className={`${isDesktop ? "" : "px-4"} mt-8 sm:mt-10`}>
        <SectionCard
          icon={ClipboardCheck}
          title="Pending Quality Check"
          subtitle={qcTab === "weavers" ? "Grouped by weaver or factory loom — pick one to start inspecting." : "Grouped by batch — pick a batch to start inspecting."}
          actions={
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
              {pending.length} pending
            </span>
          }
        >
          {isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : isError ? (
            <ErrorState error={loadError} onRetry={refetchAll} />
          ) : pending.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.brown }}>All sarees inspected!</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: T.muted, marginTop: 4 }}>Nothing is waiting in the QC queue right now.</div>
            </div>
          ) : qcTab === "weavers" ? (
            <>
              <div style={{ paddingBottom: 16 }}>
                <Input
                  value={weaverSearch} onChange={e => { setWeaverSearch(e.target.value); setQcPage(1); }}
                  placeholder="Search weavers or looms..."
                  iconLeft={Search}
                  className="w-full"
                />
              </div>
              <WorkerQCWeaverGrid
                filteredWeavers={filteredWeavers.slice((qcPage - 1) * ITEMS_PER_PAGE, qcPage * ITEMS_PER_PAGE)}
                setSelectedWeaverQC={setSelectedWeaverQC}
                isDesktop={isDesktop}
                isTablet={isTablet}
                pad="0"
              />

              {Math.ceil(filteredWeavers.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#EAE5E1]">
                  <div style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">
                    Showing <span className="font-semibold text-[#1D1814]">{(qcPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(qcPage * ITEMS_PER_PAGE, filteredWeavers.length)}</span> of <span className="font-semibold text-[#1D1814]">{filteredWeavers.length}</span> weavers
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={qcPage <= 1}
                      onClick={() => setQcPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: Math.ceil(filteredWeavers.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQcPage(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
                          qcPage === p
                            ? "bg-[#6E0F2D] text-white"
                            : "border border-[#EAE5E1] bg-white text-[#4F4A45] hover:bg-[#FAF8F6]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={qcPage >= Math.ceil(filteredWeavers.length / ITEMS_PER_PAGE)}
                      onClick={() => setQcPage(p => Math.min(Math.ceil(filteredWeavers.length / ITEMS_PER_PAGE), p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <WorkerQCBatchGrid
                batchGroups={batchGroups.slice((qcPage - 1) * ITEMS_PER_PAGE, qcPage * ITEMS_PER_PAGE)}
                setSelectedBatchQC={setSelectedBatchQC}
                isDesktop={isDesktop}
                isTablet={isTablet}
                pad="0"
              />

              {Math.ceil(batchGroups.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#EAE5E1]">
                  <div style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">
                    Showing <span className="font-semibold text-[#1D1814]">{(qcPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(qcPage * ITEMS_PER_PAGE, batchGroups.length)}</span> of <span className="font-semibold text-[#1D1814]">{batchGroups.length}</span> batches
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={qcPage <= 1}
                      onClick={() => setQcPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: Math.ceil(batchGroups.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQcPage(p)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
                          qcPage === p
                            ? "bg-[#6E0F2D] text-white"
                            : "border border-[#EAE5E1] bg-white text-[#4F4A45] hover:bg-[#FAF8F6]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={qcPage >= Math.ceil(batchGroups.length / ITEMS_PER_PAGE)}
                      onClick={() => setQcPage(p => Math.min(Math.ceil(batchGroups.length / ITEMS_PER_PAGE), p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>

      <WorkerQCCompletedTodaySection
        items={completedTodayLog}
        isDesktop={isDesktop}
        isTablet={isTablet}
      />

      <WorkerQCSemiDefectiveSection
        semiLog={semiLog}
        semiFilter={semiDateFilter}
        setSemiFilter={setSemiDateFilter}
        isDesktop={isDesktop}
        isTablet={isTablet}
      />

      <WorkerQCDefectiveSection
        defLog={defLog}
        defFilter={defDateFilter}
        setDefFilter={setDefDateFilter}
        isDesktop={isDesktop}
        isTablet={isTablet}
      />

      <WorkerQCHistorySection
        items={passedLog}
        historyFilter={historyDateFilter}
        setHistoryFilter={setHistoryDateFilter}
        isDesktop={isDesktop}
        isTablet={isTablet}
      />

      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>

      {toasts}
    </div>
  );
}
