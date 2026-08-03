import React, { useState, useMemo } from "react";
import { useBatches } from "../../../production/contexts/BatchContext";
import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { useDesignLibrary } from "../../../design-library/contexts/DesignLibraryContext";
import { useQc, makingChargeFor } from "../../../qc/contexts/QcContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByName, getSareeTypeByCode } from "../../../pricing/components/RatesPricingPage";
import { AnimatePresence } from "motion/react";
import {
  ChevronLeft, CheckCircle2, Search, ChevronRight, Package,
} from "lucide-react";
import {
  T, F, baseCard, SareeItem, InspectionResult, QUEUE, DEFECTIVE_LOG, initials, splitDesignField,
} from "./WorkerQCTypes";
import { WorkerQCInspectionScreen } from "./WorkerQCInspectionScreen";
import { WorkerQCSareeCard } from "./WorkerQCSareeCard";
import { WorkerQCDefectiveSection } from "./WorkerQCDefectiveSection";
import { WorkerQCQueueHeader } from "./WorkerQCQueueHeader";
import { WorkerQCWeaverGrid, WorkerQCBatchGrid } from "./WorkerQCGridCards";

export function WorkerQC({ isDesktop, isTablet }: { isDesktop?: boolean; isTablet?: boolean }) {
  const { batches } = useBatches();
  const { addReadySaree } = useFinishing();
  const { recordQc } = useQc();
  const { getDesign } = useDesignLibrary();
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  const contextRows = useMemo<SareeItem[]>(() => {
    return batches
      .filter(b => b.status === "active")
      .flatMap(b =>
        b.rows
          .filter(r => r.sareeId && r.weaverName)
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

  const ALL_QUEUE = useMemo<SareeItem[]>(() => {
    const staticIds = new Set(QUEUE.map(q => q.id));
    return [...QUEUE, ...contextRows.filter(r => !staticIds.has(r.id))];
  }, [contextRows]);

  const [inspecting, setInspecting] = useState<SareeItem | null>(null);
  const [result, setResult] = useState<InspectionResult>(null);
  const [defectTypes, setDefectTypes] = useState<string[]>([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [notes, setNotes] = useState("");
  const [deductionAmount, setDeductionAmount] = useState<number | "">("");
  const [defectSubmitted, setDefectSubmitted] = useState(false);
  const [inspected, setInspected] = useState<Set<string>>(new Set());
  const [defLog, setDefLog] = useState(DEFECTIVE_LOG);
  const [defFilter, setDefFilter] = useState("Today");

  const [qcTab, setQcTab] = useState<"weavers" | "batches">("weavers");
  const [selectedWeaverQC, setSelectedWeaverQC] = useState<string | null>(null);
  const [selectedBatchQC, setSelectedBatchQC] = useState<string | null>(null);
  const [weaverSearch, setWeaverSearch] = useState("");

  const pending = ALL_QUEUE.filter(s => !inspected.has(s.id));

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

  const makingChargeOf = (s: SareeItem | null) => (s ? makingChargeFor(typeCodeOf(s)) : 0);

  const saveQc = (s: SareeItem, result: "passed" | "semi" | "defective", semiDeduction = 0) => {
    const { typeName } = splitDesignField(s.design);
    recordQc({
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
    setInspected(p => new Set(p).add(s.id));
    saveQc(s, "passed");

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
  };

  const startDefect = (s: SareeItem) => {
    reset();
    setInspecting(s);
    setResult("defective");
  };

  const closeInspect = () => { setInspecting(null); reset(); };

  const confirmDefective = () => {
    if (!inspecting) return;
    saveQc(inspecting, "defective");
    setDefLog(p => [{ id: inspecting.id, weaver: inspecting.weaver, defects: defectTypes, date: "13 Jun", deduction: `₹${makingChargeOf(inspecting)}` }, ...p]);
    setInspected(p => new Set(p).add(inspecting.id));
    setDefectSubmitted(true);
  };

  const startSemiApproved = (s: SareeItem) => {
    reset();
    setInspecting(s);
    setResult("semi_approved");
  };

  const confirmSemiApproved = () => {
    if (!inspecting) return;
    saveQc(inspecting, "semi", Number(deductionAmount) || 0);
    setDefLog(p => [{ id: inspecting.id, weaver: inspecting.weaver, defects: defectTypes, date: "13 Jun", deduction: `₹${deductionAmount || 0}` }, ...p]);
    setInspected(p => new Set(p).add(inspecting.id));
    setDefectSubmitted(true);

    const { code: designCode, typeName } = splitDesignField(inspecting.design);
    const sareeTypeCode = inspecting.sareeTypeCode ?? getSareeTypeByName(typeName)?.code ?? "";
    const qcPassDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    addReadySaree({
      id: inspecting.id,
      weaverId: inspecting.wcode || undefined,
      weaverName: inspecting.weaver,
      designCode,
      sareeTypeCode,
      sareeType: typeName,
      weight: inspecting.weight ? `${inspecting.weight}g` : undefined,
      qcPassDate,
      bulkOrderRef: inspecting.bulkOrderRef,
      status: "qc-passed-pending-finishing",
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
          <button onClick={() => setSelectedWeaverQC(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={16} color="#FFF" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 15 : 13, fontWeight: 700, color: "#FFF" }}>{selectedWeaverQC}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: "rgba(255,255,255,0.65)" }}>{wSarees.length} saree{wSarees.length !== 1 ? "s" : ""} pending QC</div>
          </div>
          {wg?.code && <span style={{ fontFamily: F.m, fontSize: 11, color: T.goldL, background: "rgba(200,155,71,0.20)", padding: "3px 9px", borderRadius: 999 }}>{wg.code}</span>}
        </div>

        {wSarees.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.brown }}>All done for this weaver!</div>
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
          <button onClick={() => setSelectedBatchQC(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={16} color="#FFF" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.m, fontSize: isDesktop ? 15 : 13, fontWeight: 700, color: T.goldL }}>{selectedBatchQC}</div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: "rgba(255,255,255,0.65)" }}>{bSarees.length} saree{bSarees.length !== 1 ? "s" : ""} · {bWeaverGroups.length} weaver{bWeaverGroups.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {bWeaverGroups.map(wg => (
          <div key={wg.name} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isDesktop ? "0 0 8px" : "0 16px 8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 10, color: "#FFF" }}>{initials(wg.name)}</span>
              </div>
              <span style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 600, color: T.brown }}>{wg.name}</span>
              <span style={{ fontFamily: F.u, fontSize: 10, color: T.muted, background: T.bgGold, border: `1px solid rgba(200,155,71,0.25)`, padding: "2px 8px", borderRadius: 999 }}>{wg.sarees.length} sarees</span>
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
        qcTab={qcTab}
        setQcTab={setQcTab}
        setWeaverSearch={setWeaverSearch}
        isDesktop={isDesktop}
      />

      {pending.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <CheckCircle2 size={36} color={T.green} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.brown }}>All sarees inspected!</div>
        </div>
      ) : qcTab === "weavers" ? (
        <>
          <div style={{ padding: isDesktop ? "0 0 12px" : "0 16px 12px", position: "relative" }}>
            <Search size={14} color={T.muted} style={{ position: "absolute", left: isDesktop ? 12 : 28, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={weaverSearch} onChange={e => setWeaverSearch(e.target.value)}
              placeholder="Search weavers..."
              style={{ width: "100%", height: 42, background: T.inp, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: "0 14px 0 36px", fontFamily: F.u, fontSize: 13, color: T.brown, outline: "none", boxSizing: "border-box" as const }}
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
    </div>
  );
}
