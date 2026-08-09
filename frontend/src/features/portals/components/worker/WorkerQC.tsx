import React, { useState, useMemo } from "react";
import { useBatches } from "../../../production/contexts/BatchContext";
import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { useDesignLibrary } from "../../../design-library/contexts/DesignLibraryContext";
import { useQc } from "../../../qc/contexts/QcContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { SareeTypeCard } from "../../../pricing/components/RatesPricingPage";
import { useRatesPricing } from "../../../pricing/contexts/RatesContext";
import { AnimatePresence } from "motion/react";
import {
  ChevronLeft, CheckCircle2, Search, ChevronRight, Package, AlertTriangle,
} from "lucide-react";
import {
  T, F, baseCard, SareeItem, InspectionResult, DefectiveLogItem, initials, splitDesignField,
} from "./WorkerQCTypes";
import { WorkerQCInspectionScreen } from "./WorkerQCInspectionScreen";
import { WorkerQCSareeCard } from "./WorkerQCSareeCard";
import { WorkerQCDefectiveSection } from "./WorkerQCDefectiveSection";
import { WorkerQCQueueHeader } from "./WorkerQCQueueHeader";
import { WorkerQCWeaverGrid, WorkerQCBatchGrid } from "./WorkerQCGridCards";
import { IconButton, Input } from "../../../../shared/ui/primitives";

export function WorkerQC({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { batches } = useBatches();
  const { addReadySaree } = useFinishing();
  const { recordQc, qcRecords } = useQc();
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
          // has actually received it from the weaver/loom.
          .filter(r => r.sareeId && r.weaverName && r.receivedAt && r.qcPassed == null)
          .map(r => ({
            id: r.sareeId!,
            batch: b.batchId,
            source: "outsourced" as const,
            weaver: r.weaverName!,
            wcode: r.weaverId ?? "",
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
  }, [batches]);

  const ALL_QUEUE = contextRows;

  const [inspecting, setInspecting] = useState<SareeItem | null>(null);
  const [result, setResult] = useState<InspectionResult>(null);
  const [defectTypes, setDefectTypes] = useState<string[]>([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [notes, setNotes] = useState("");
  const [deductionAmount, setDeductionAmount] = useState<number | "">("");
  const [defectSubmitted, setDefectSubmitted] = useState(false);
  const [inspected, setInspected] = useState<Set<string>>(new Set());
  const [errorToast, setErrorToast] = useState("");
  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(""), 4000);
  };
  // Derived straight from real QC records — recordQc's refetch keeps this
  // current, so there's no local mutation to make when a defect is logged.
  const defLog = useMemo<DefectiveLogItem[]>(() => qcRecords
    .filter(r => r.result === "defective" || r.result === "semi")
    .map(r => ({
      id: r.sareeId,
      weaver: r.weaverName ?? "—",
      defects: r.defects,
      date: new Date(r.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      deduction: `₹${r.deduction}`,
    })),
  [qcRecords]);
  const [defFilter, setDefFilter] = useState("Today");

  const [qcTab, setQcTab] = useState<"weavers" | "batches">("weavers");
  const [selectedWeaverQC, setSelectedWeaverQC] = useState<string | null>(null);
  const [selectedBatchQC, setSelectedBatchQC] = useState<string | null>(null);
  const [weaverSearch, setWeaverSearch] = useState("");

  const pending = ALL_QUEUE.filter(s => !inspected.has(s.id));

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
      if (!acc[s.weaver]) acc[s.weaver] = { name: s.weaver, code: s.wcode, source: s.source, sarees: [] as SareeItem[] };
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
    setHasPhoto(false);
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
    }).catch((err) => {
      showError(`Failed to save QC result for ${s.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    });
  };

  const startSemiApproved = (s: SareeItem) => {
    reset();
    setInspecting(s);
    setResult("semi_approved");
  };

  const confirmSemiApproved = () => {
    if (!inspecting) return;
    const s = inspecting;
    saveQc(s, "semi", Number(deductionAmount) || 0).then(() => {
      setInspected(p => new Set(p).add(s.id));
      setDefectSubmitted(true);

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
    }).catch((err) => {
      showError(`Failed to save QC result for ${s.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    });
  };

  if (inspecting) {
    return (
      <WorkerQCInspectionScreen
        inspecting={inspecting}
        result={result}
        isDesktop={isDesktop}
        defectSubmitted={defectSubmitted}
        defectTypes={defectTypes}
        setDefectTypes={setDefectTypes}
        hasPhoto={hasPhoto}
        setHasPhoto={setHasPhoto}
        notes={notes}
        setNotes={setNotes}
        deductionAmount={deductionAmount}
        setDeductionAmount={setDeductionAmount}
        makingChargeOf={makingChargeOf}
        closeInspect={closeInspect}
        confirmSemiApproved={confirmSemiApproved}
        confirmDefective={confirmDefective}
      />
    );
  }

  const pad = isDesktop ? "0 0" : "0 16px";
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr 1fr";

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
    return (
      <div style={{ paddingBottom: 28 }}>
        <div style={{ background: T.gradHero, padding: isDesktop ? "10px 4px" : "10px 16px", marginBottom: 12, borderRadius: isDesktop ? 10 : 0, display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton icon={ChevronLeft} label="Back" variant="ghost" onClick={() => setSelectedWeaverQC(null)} className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/12 text-white" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 15 : 13, fontWeight: 700, color: "#FFF" }}>{selectedWeaverQC}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: "rgba(255,255,255,0.65)" }}>{wSarees.length} saree{wSarees.length !== 1 ? "s" : ""} pending QC</div>
          </div>
          {wg?.code && <span style={{ fontFamily: F.m, fontSize: 12, color: T.goldL, background: "rgba(200,155,71,0.20)", padding: "3px 9px", borderRadius: 999 }}>{wg.code}</span>}
        </div>

        {wSarees.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
            <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: T.brown }}>All done for this weaver!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 14 : 10, padding: pad }}>
            {wSarees.map(renderCard)}
          </div>
        )}
      </div>
    );
  }

  if (selectedBatchQC !== null) {
    const bg = batchGroups.find(b => b.id === selectedBatchQC);
    const bSarees = bg?.sarees ?? [];
    const bWeaverGroups = Object.values(
      bSarees.reduce((acc, s) => {
        if (!acc[s.weaver]) acc[s.weaver] = { name: s.weaver, sarees: [] as SareeItem[] };
        acc[s.weaver].sarees.push(s);
        return acc;
      }, {} as Record<string, { name: string; sarees: SareeItem[] }>)
    );
    return (
      <div style={{ paddingBottom: 28 }}>
        <div style={{ background: T.gradHero, padding: isDesktop ? "10px 4px" : "10px 16px", marginBottom: 16, borderRadius: isDesktop ? 10 : 0, display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton icon={ChevronLeft} label="Back" variant="ghost" onClick={() => setSelectedBatchQC(null)} className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/12 text-white" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.m, fontSize: isDesktop ? 15 : 13, fontWeight: 700, color: T.goldL }}>{selectedBatchQC}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: "rgba(255,255,255,0.65)" }}>{bSarees.length} saree{bSarees.length !== 1 ? "s" : ""} · {bWeaverGroups.length} weaver{bWeaverGroups.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {bWeaverGroups.map(wg => (
          <div key={wg.name} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isDesktop ? "0 0 8px" : "0 16px 8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials(wg.name)}</span>
              </div>
              <span style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 600, color: T.brown }}>{wg.name}</span>
              <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted, background: T.bgGold, border: `1px solid rgba(200,155,71,0.25)`, padding: "2px 8px", borderRadius: 999 }}>{wg.sarees.length} sarees</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 14 : 10, padding: pad }}>
              {wg.sarees.map(renderCard)}
            </div>
          </div>
        ))}
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
        isDesktop={isDesktop}
      />

      {pending.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: T.brown }}>All sarees inspected!</div>
        </div>
      ) : qcTab === "weavers" ? (
        <>
          <div style={{ padding: isDesktop ? "0 0 12px" : "0 16px 12px" }}>
            <Input
              value={weaverSearch} onChange={e => setWeaverSearch(e.target.value)}
              placeholder="Search weavers..."
              iconLeft={Search}
              className="w-full"
            />
          </div>
          <WorkerQCWeaverGrid
            filteredWeavers={filteredWeavers}
            setSelectedWeaverQC={setSelectedWeaverQC}
            isDesktop={isDesktop}
            isTablet={isTablet}
            pad={pad}
          />
        </>
      ) : (
        <WorkerQCBatchGrid
          batchGroups={batchGroups}
          setSelectedBatchQC={setSelectedBatchQC}
          isDesktop={isDesktop}
          isTablet={isTablet}
          pad={pad}
        />
      )}

      <WorkerQCDefectiveSection
        defLog={defLog}
        defFilter={defFilter}
        setDefFilter={setDefFilter}
        isDesktop={isDesktop}
        isTablet={isTablet}
      />

      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>

      {errorToast && (
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: T.crim, color: "#FFF", borderRadius: 999, padding: "11px 22px", fontFamily: F.u, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 28px rgba(192,57,43,0.32)", display: "flex", alignItems: "center", gap: 8, maxWidth: "90vw" }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} /> <span>{errorToast}</span>
        </div>
      )}
    </div>
  );
}
