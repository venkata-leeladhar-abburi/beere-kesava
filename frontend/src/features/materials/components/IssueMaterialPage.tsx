import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, X, CheckCircle2, Send, Scissors } from "lucide-react";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { useMaterialIssue, MaterialIssueRecord } from "../contexts/MaterialIssueContext";
import { FactoryLoom } from "@/features/production";
import { useBatches } from "@/features/production";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { weaversApi } from "../../../shared/api/weavers";
import { factoryLoomsApi } from "../../../shared/api/factory-looms";
import { rawMaterialsApi } from "../../../shared/api/rawMaterials";
import { warpRequestsApi } from "../../../shared/api/warpRequests";

import { F, GrnBatch, MaterialRowState, T, WeaverLite, emptyRow } from "./issueMaterial/theme";
import { SectionPill, SectionCard } from "./issueMaterial/primitives";
import { RecipientSelector } from "./issueMaterial/RecipientSelector";
import { MaterialRowEditor } from "./issueMaterial/MaterialRowEditor";
import { SignatureBlock } from "./issueMaterial/SignatureBlock";
import { SignatureCanvasHandle } from "./issueMaterial/SignatureCanvas";
import { RecordDetailsModal } from "./issueMaterial/RecordDetailsModal";
import { IssuanceHistorySection } from "./issueMaterial/IssuanceHistorySection";
import { summarizeMaterials } from "./issueMaterial/materialFormatters";
import { EntityCode } from "@/shared/ui/domain";

// Deterministic avatar colors for weavers fetched from the backend (no bg field there).
const WEAVER_AVATAR_COLORS = ["#5A3E6B", "#9B6B8A", "#2D6B6B", "#4A6B4A", "#2D7D6B", "#4A5E7A", "#7A2040"];
function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return WEAVER_AVATAR_COLORS[hash % WEAVER_AVATAR_COLORS.length]!;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function IssueMaterialPage() {
  const { issueRecords, addIssueRecord } = useMaterialIssue();
  const { batches } = useBatches();
  const [grnBatches, setGrnBatches] = useState<GrnBatch[]>([]);

  // Real weaver/factory-loom directories — replaces the old static
  // WEAVERS/FACTORY_LOOMS_LIST mocks so issued-to ids are always real
  // backend records (required for material-issue creation to validate
  // server-side), mirroring the same swap done in BatchCreationPage.tsx.
  const [weavers, setWeavers] = useState<WeaverLite[]>([]);
  const [looms, setLooms] = useState<FactoryLoom[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [weaversRes, loomsRes, grnsRes] = await Promise.all([
        weaversApi.list(), 
        factoryLoomsApi.list(),
        rawMaterialsApi.listGrns()
      ]);
      if (cancelled) return;
      setWeavers(weaversRes.items.map(w => ({
        id: w.id, name: w.name, village: w.village ?? "", initials: w.initials,
        bg: avatarColorFor(w.id), status: w.status === "ACTIVE" ? "active" : "idle",
        looms: w.looms, phone: w.phone,
      })));
      setLooms(loomsRes.items.map(l => ({
        id: l.id, loomNumber: l.loomNumber, location: l.location ?? "",
        operatorName: l.operatorName ?? "", operatorPhone: l.operatorPhone ?? "",
        status: l.status === "ACTIVE" ? "active" : l.status === "MAINTENANCE" ? "maintenance" : "idle",
        installedYear: l.installedYear ? String(l.installedYear) : "", notes: l.notes ?? "",
      })));

      const batches: GrnBatch[] = [];
      grnsRes.items.forEach(grn => {
        grn.items.forEach(item => {
          batches.push({
            grnBatchId: grn.id,
            vendor: grn.supplierName,
            dateReceived: new Date(grn.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            materialType: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
            // Real remaining stock (received minus rejected minus already
            // issued), computed server-side — not the as-received quantity.
            availableQty: item.availableQuantity,
            unit: item.unit || "kg",
            poNumber: grn.purchaseOrders[0]?.poNumber ?? null,
            // Every other material line on this same receipt — so picking a
            // batch shows the full delivery it came from, not just this one
            // material (this is what actually made a multi-material
            // purchase traceable, instead of only the currently-filtered
            // material type).
            siblingItems: grn.items
              .filter(other => other.id !== item.id)
              .map(other => ({
                materialType: other.materialType === "WARP" ? "Warp" : other.materialType === "RESHAM" ? "Resham" : "Jari",
                name: other.name,
                quantity: other.availableQuantity,
                unit: other.unit || "kg",
              })),
          });
        });
      });
      setGrnBatches(batches);
    })();
    return () => { cancelled = true; };
  }, []);

  // Step 1 — recipient type toggle
  const [recipientType, setRecipientType] = useState<"weaver" | "factoryLoom">("weaver");

  // Step 1 — weaver
  const [weaverSearch, setWeaverSearch] = useState("");
  const [showWeaverList, setShowWeaverList] = useState(false);
  const [selectedWeaverId, setSelectedWeaverId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Step 1 — factory loom
  const [selectedLoomId, setSelectedLoomId] = useState<string | null>(null);

  // Step 2 — materials
  const [rows, setRows] = useState<MaterialRowState[]>([emptyRow()]);

  // Step 4 — notes
  const [notes, setNotes] = useState("");

  // Step 4 — signature
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);

  // Success state
  const [successRecord, setSuccessRecord] = useState<MaterialIssueRecord | null>(null);

  // History section state
  const [histSearch, setHistSearch] = useState("");
  const [histWeaverFilter, setHistWeaverFilter] = useState("All Weavers");
  const [histDateFilter, setHistDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [histPage, setHistPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<MaterialIssueRecord | null>(null);
  const ROWS_PER_PAGE = 15;

  const [selectedLoom, setSelectedLoom] = useState<number | "">("");
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Approved warp requests waiting for someone to actually issue the
  // material — superadmin approval only flips the request's status;
  // fulfilling it happens here.
  const { data: approvedWarpRequestsRes } = useQuery({
    queryKey: ["warp-requests", "APPROVED"],
    queryFn: () => warpRequestsApi.list("APPROVED"),
  });
  const approvedWarpRequests = approvedWarpRequestsRes?.items ?? [];
  const [warpRequestId, setWarpRequestId] = useState<string | null>(null);

  function issueForWarpRequest(reqId: string, weaverId: string, loomNumber?: string | null) {
    setWarpRequestId(reqId);
    setRecipientType("weaver");
    setSelectedWeaverId(weaverId);
    setSelectedLoom(loomNumber ? parseInt(loomNumber, 10) || "" : "");
    window.scrollTo({ top: document.getElementById("issue-material-form")?.offsetTop ?? 0, behavior: "smooth" });
  }

  const selectedWeaver = weavers.find(w => w.id === selectedWeaverId) || null;
  const selectedFactoryLoom = looms.find(l => l.id === selectedLoomId) || null;

  const weaverBatches = selectedWeaver
    ? batches.filter(b => b.status !== "completed" && b.rows.some(r => r.weaverId === selectedWeaver.id))
    : [];
  const loomBatches = selectedFactoryLoom
    ? batches.filter(b => b.status !== "completed" && b.rows.some(r => r.factoryLoomId === selectedFactoryLoom.id))
    : [];

  // "remote" only needs the request to have been sent — the weaver signs it
  // for real later, on their own dashboard's Confirm Materials page; this
  // admin session has no way to know synchronously when that happens.
  const isSigned = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteSent);

  // eslint-disable-next-line no-restricted-syntax -- material quantity (kg/g/reels/buns), not currency
  const validRows = rows.filter(r => r.materialType && r.quantity && parseFloat(r.quantity) > 0 && r.grnBatchId);
  const recipientReady = recipientType === "weaver"
    ? (!!selectedWeaver && selectedLoom !== "" && !!selectedBatchId)
    : (!!selectedFactoryLoom && !!selectedBatchId);
  const canConfirm = recipientReady && validRows.length > 0 && isSigned;

  function updateRow(uid: string, updated: MaterialRowState) {
    setRows(prev => prev.map(r => r.uid === uid ? updated : r));
  }
  function removeRow(uid: string) {
    setRows(prev => prev.filter(r => r.uid !== uid));
  }
  function addRow() {
    setRows(prev => [...prev, emptyRow()]);
  }

  function resetForm() {
    setWeaverSearch(""); setSelectedWeaverId(null); setShowWeaverList(false);
    setSelectedLoomId(null);
    setSelectedLoom("");
    setSelectedBatchId(null);
    setRows([emptyRow()]); setNotes("");
    setSigMethod("none"); setSigned(false); setRemoteSent(false);
    setWarpRequestId(null);
  }

  async function handleConfirm() {
    if (!canConfirm || submitting) return;
    if (recipientType === "weaver" && !selectedWeaver) return;
    if (recipientType === "factoryLoom" && !selectedFactoryLoom) return;

    const materials = validRows.map(r => {
      const base: MaterialIssueRecord["materials"][number] = {
        materialType: r.materialType,
        // eslint-disable-next-line no-restricted-syntax -- material quantity (kg/g/reels/buns), not currency
        quantity: parseFloat(r.quantity),
        unit: r.materialType === "Jari" ? r.jariUnit : (r.warpReshamUnit || "kg"),
        grnBatchId: r.grnBatchId,
      };
      if (r.materialType === "Warp") { base.warpSubtype = r.warpSubtype; if (r.description) base.description = r.description; }
      if (r.materialType === "Resham") { if (r.description) base.description = r.description; if (r.jariColor) base.jariColor = r.jariColor; }
      if (r.materialType === "Jari") { base.jariType = r.jariType; base.jariGrade = r.jariGrade; base.jariColor = r.jariColor; }
      return base;
    });

    setSubmitting(true);
    try {
      const signatureBlob = sigMethod === "here" ? await canvasRef.current?.toBlob() ?? null : null;

      const record = await addIssueRecord({
        ...(recipientType === "weaver"
          ? { weaverId: selectedWeaver!.id, weaverName: selectedWeaver!.name, loomNumber: selectedLoom || undefined }
          : { factoryLoomId: selectedFactoryLoom!.id, factoryLoomNumber: selectedFactoryLoom!.loomNumber }),
        batchId: selectedBatchId || undefined,
        warpRequestId: warpRequestId || undefined,
        materials,
        signatureMethod: sigMethod === "remote" ? "remote" : "here",
        signatureBlob,
        notes: notes || undefined,
      });

      // Reduce GRN batch remaining quantities
      setGrnBatches(prev => prev.map(g => {
        const used = materials.filter(m => m.grnBatchId === g.grnBatchId).reduce((s, m) => s + m.quantity, 0);
        return used > 0 ? { ...g, availableQty: Math.max(0, g.availableQty - used) } : g;
      }));

      setSuccessRecord(record);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  // History filtering
  const weaverNames = ["All Weavers", ...Array.from(new Set(issueRecords.map(r => r.weaverName ?? r.factoryLoomNumber).filter((n): n is string => !!n)))];
  const filteredHistory = issueRecords.filter(r => {
    const recipientName = r.weaverName ?? r.factoryLoomNumber ?? "";
    const matchSearch = !histSearch ||
      recipientName.toLowerCase().includes(histSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(histSearch.toLowerCase()) ||
      r.materials.some(m => m.grnBatchId.toLowerCase().includes(histSearch.toLowerCase()));
    const matchWeaver = histWeaverFilter === "All Weavers" || recipientName === histWeaverFilter;
    const matchDate = matchesDateFilter(r.issuedAt, histDateFilter);
    return matchSearch && matchWeaver && matchDate;
  });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ROWS_PER_PAGE));
  const pagedHistory = filteredHistory.slice((histPage - 1) * ROWS_PER_PAGE, histPage * ROWS_PER_PAGE);

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100dvh" }}>
      {/* Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
            Since 1999 · Material Issuance
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Issue Raw Materials to Weaver</h1>
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
            Record material handover, link GRN batch, and collect weaver's digital signature
          </p>
        </div>
      </header>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40, paddingBottom: 80, width: "100%" }}>

        {/* Success banner */}
        <AnimatePresence>
          {successRecord && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 28 }}>
              <div style={{ background: "rgba(30,102,64,0.10)", border: `1.5px solid ${T.green}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(30,102,64,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={26} color={T.green} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.green, marginBottom: 4 }}>Materials Issued Successfully</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                    <EntityCode type="goodsReceipt" value={successRecord.id} size="sm" /> · Given to {successRecord.weaverName} {successRecord.loomNumber ? `(Loom ${successRecord.loomNumber})` : ""} · {summarizeMaterials(successRecord.materials)}
                  </div>
                </div>
                <IconButton icon={X} label="Dismiss" onClick={() => setSuccessRecord(null)} variant="ghost" className="text-[var(--text-success)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ APPROVED WARP REQUESTS — READY TO ISSUE ═══ */}
        {approvedWarpRequests.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <SectionCard icon={Scissors} title="Approved Warp Requests" subtitle="A weaver raised these and superadmin approved them — issue the material to close them out.">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {approvedWarpRequests.map(r => (
                  <div key={r.id} className="flex items-start gap-3 bg-[var(--bk-silk-cream,#FFFDF9)] border border-[rgba(110,15,45,0.12)] rounded-xl p-3 sm:p-3.5 w-full">
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <Scissors size={20} color={T.royalBurgundy} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                        <div>
                          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>
                            {r.weaver.name} {r.loomNumber ? <span style={{ color: T.royalBurgundy }}>· Loom {r.loomNumber}</span> : ""}
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>
                            {r.warpType} · {r.lengthMeters}m{r.color ? ` · ${r.color}` : ""}
                          </div>
                        </div>
                        <Button onClick={() => issueForWarpRequest(r.id, r.weaverId, r.loomNumber)} variant="primary" size="sm" iconLeft={Send} className="shrink-0 whitespace-nowrap px-3 text-[12px]">
                          Issue Material
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ═══ SECTION A — ISSUE MATERIAL FORM ═══ */}
        <div id="issue-material-form" style={{ marginBottom: 48 }}>
        <SectionCard icon={Send} title="Issue Material" subtitle="Give raw materials to a weaver or factory loom and record who signed for it.">
          {warpRequestId && (
            <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.antiqueGold}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                Issuing against approved warp request <strong>{warpRequestId}</strong> — it'll be marked fulfilled once you confirm.
              </span>
              <Button onClick={() => setWarpRequestId(null)} variant="ghost" size="sm">Clear</Button>
            </div>
          )}

          {/* STEP 1 — Select Recipient */}
          <SectionPill label="Step 1 · Select Recipient" />
          <RecipientSelector
            recipientType={recipientType} setRecipientType={setRecipientType}
            weaverSearch={weaverSearch} setWeaverSearch={setWeaverSearch}
            showWeaverList={showWeaverList} setShowWeaverList={setShowWeaverList}
            selectedWeaver={selectedWeaver} setSelectedWeaverId={setSelectedWeaverId}
            selectedLoom={selectedLoom} setSelectedLoom={setSelectedLoom}
            selectedFactoryLoom={selectedFactoryLoom} setSelectedLoomId={setSelectedLoomId}
            selectedBatchId={selectedBatchId} setSelectedBatchId={setSelectedBatchId}
            weaverBatches={weaverBatches} loomBatches={loomBatches}
            weavers={weavers} looms={looms}
          />

          {/* STEP 2 — Materials */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 2 · Add Materials Being Given" />
            {rows.map(row => (
              <MaterialRowEditor key={row.uid} row={row} grnBatches={grnBatches} onChange={r => updateRow(row.uid, r)} onRemove={() => removeRow(row.uid)} showRemove={rows.length > 1} />
            ))}
            <Button onClick={addRow} variant="secondary" fullWidth iconLeft={Plus} className="border-dashed">
              Add Another Material
            </Button>
          </div>

          {/* STEP 3 — Notes */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 3 · Notes (Optional)" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special instructions, batch references, or remarks" aria-label="Notes"
              style={{ width: "100%", borderRadius: 12, border: `1.5px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </div>

          {/* STEP 4 — Signature */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 4 · Collect Weaver Signature" />
            <SignatureBlock
              weaverName={selectedWeaver?.name ?? "the weaver"} weaverPhone={selectedWeaver?.phone ?? "—"}
              sigMethod={sigMethod} setSigMethod={setSigMethod}
              signed={signed} setSigned={setSigned}
              remoteSent={remoteSent} setRemoteSent={setRemoteSent}
              canvasRef={canvasRef}
            />
          </div>

          {/* Confirm */}
          <Button onClick={() => void handleConfirm()} disabled={!canConfirm || submitting} variant="primary" size="lg" fullWidth iconLeft={Check} className="mt-8">
            {submitting ? "Issuing…" : "Confirm Issuance"}
          </Button>
        </SectionCard>
        </div>

        {/* ═══ SECTION B — ISSUANCE HISTORY ═══ */}
        <IssuanceHistorySection
          weaverNames={weaverNames}
          histSearch={histSearch} setHistSearch={v => { setHistSearch(v); setHistPage(1); }}
          histWeaverFilter={histWeaverFilter} setHistWeaverFilter={v => { setHistWeaverFilter(v); setHistPage(1); }}
          histDateFilter={histDateFilter} setHistDateFilter={f => { setHistDateFilter(f); setHistPage(1); }}
          pagedHistory={pagedHistory} histPage={histPage} setHistPage={setHistPage} totalPages={totalPages}
          setViewRecord={setViewRecord}
        />
      </div>

      <AnimatePresence>
        {viewRecord && <RecordDetailsModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      </AnimatePresence>
    </div>
  );
}
