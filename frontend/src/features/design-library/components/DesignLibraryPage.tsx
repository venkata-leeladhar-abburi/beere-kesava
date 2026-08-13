import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Hash, Image as ImageSquare, Palette as Swatches, Layers as Stack, Workflow as Graph, CheckCircle2 as CheckCircle,
  Eye as PhEye, Upload as UploadSimple, Plus as PhPlus, Save as FloppyDisk,
  Search as MagnifyingGlass, AlertCircle as WarningCircle, Package, X as PhX,
  Send as PaperPlaneTilt, CalendarCheck, User, Building2 as Buildings, FileText, SlidersHorizontal,
} from "lucide-react";

import { useDesignLibrary, DesignEntry, DispatchRecord } from "../contexts/DesignLibraryContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { weaversApi } from "../../../shared/api/weavers";

import { T, F, G } from "./theme";
import {
  FadeUp, SectionCard, WeaverCombobox, UploadZone, fieldStyle, labelStyle,
  DesignCodeCard, DesignCard, AddDesignModal, SlipModal,
} from "./DesignLibraryComponents";
import { Button, SearchInput, Textarea, Select, SelectItem } from "../../../shared/ui/primitives";

export { DesignCodeCard };

export function DesignLibraryPage() {
  const { designs, addDesign, updateDesign, dispatches: dispatchHistory, addDispatch } = useDesignLibrary();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All Designs");
  const [showAdd, setShowAdd] = useState(false);
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const [slipDesign, setSlipDesign] = useState<DesignEntry | null>(null);

  const { data: weaversRes } = useQuery({
    queryKey: ["weavers-list"],
    queryFn: () => weaversApi.list(100),
  });

  const weaversList = (weaversRes?.items ?? []).map(w => ({
    id: w.id,
    name: w.name,
    initials: w.initials,
    looms: w.looms || 1,
  }));

  const [dispRecipientType, setDispRecipientType] = useState<"weaver" | "loom">("weaver");
  const [dispWeaverId, setDispWeaverId] = useState("");
  const [dispLoomNum, setDispLoomNum] = useState<number>(1);
  const [dispInstructions, setDispInstructions] = useState("");

  const activeWeaverId = dispWeaverId || (weaversList[0]?.id ?? "");

  // Custom file upload previews (mock states)
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [uploadedGraph, setUploadedGraph] = useState<string | null>(null);

  const [dispatchSavedMsg, setDispatchSavedMsg] = useState<string | null>(null);

  // Filters / Search for dispatches history log
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [zoomImage, setZoomImage] = useState<{ url: string; label: string } | null>(null);

  // Escape closes the image zoom overlay — Part C.3's focus contract applies
  // to every scrim-backed overlay, not just the named Modal/Drawer/Popover.
  useEffect(() => {
    if (!zoomImage) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomImage(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoomImage]);

  const selectedWeaver = weaversList.find(w => w.id === activeWeaverId);

  const handleSendDispatch = () => {
    const rName = dispRecipientType === "weaver" ? (selectedWeaver?.name || "Weaver") : `Loom ${dispLoomNum}`;
    const rId = dispRecipientType === "weaver" ? activeWeaverId : `Loom ${dispLoomNum}`;

    addDispatch({
      recipientType: dispRecipientType,
      recipientId: rId,
      recipientName: rName,
      batches: [],
      instructions: dispInstructions,
      colorSlipImage: uploadedSlip,
      designGraphImage: uploadedGraph,
    });
    setDispatchSavedMsg(`Instructions successfully dispatched to ${rName}!`);
    setTimeout(() => setDispatchSavedMsg(null), 4000);

    // Reset form fields
    setDispInstructions("");
    setUploadedSlip(null);
    setUploadedGraph(null);
  };

  const visible = designs.filter(d => {
    if (filter === "Currently in Production" && d.batches === 0) return false;
    if (filter === "Completed Designs"       && d.batches  > 0) return false;
    if (filter === "Has Design Graph"        && !d.hasGraph)    return false;
    if (filter === "No Graph Uploaded"       && d.hasGraph)     return false;
    if (search) {
      const q = search.toLowerCase();
      return d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.weaverName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>

      {/* ── Page header ── */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 100%", maxWidth: "100%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 14 }}>
            Since 1999 · Production
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: "0 0 6px 0", lineHeight: 1.1 }}>
              Weaver Dispatcher
            </h1>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 18, color: "rgba(255,253,249,0.70)", maxWidth: 600, margin: 0, lineHeight: 1.6 }}>
            Dispatch design sheets, color slip photos, design graphs, and specific weaver instructions directly to active looms.
          </p>
        </div>
      </header>



      {/* ── Main content ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <FadeUp>
        <SectionCard icon={PaperPlaneTilt} title="Weaver Dispatch Control" subtitle="Dispatch production design slips to weavers or factory looms.">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr]" style={{ gap: 32, alignItems: "start" }}>
              {/* Form Side */}
              <div>
                <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
                  <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                    <SlidersHorizontal size={20} color={T.royalBurgundy} /> Dispatch Settings
                  </h3>
                  
                  {dispatchSavedMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: "rgba(30,102,64,0.08)", border: `1.5px solid ${T.green}`, borderRadius: 10, padding: "12px 16px", color: T.green, fontFamily: F.ui, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                      ✓ {dispatchSavedMsg}
                    </motion.div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Recipient Type Toggle */}
                    <div>
                      <label style={labelStyle}>Recipient Type</label>
                      <div style={{ display: "flex", background: "rgba(110,15,45,0.05)", borderRadius: 12, padding: 4, border: `1px solid ${T.borderDef}`, width: "fit-content" }}>
                        <Button type="button" onClick={() => setDispRecipientType("weaver")}
                          variant={dispRecipientType === "weaver" ? "secondary" : "ghost"} size="sm" iconLeft={User}>
                          Weaver
                        </Button>
                        <Button type="button" onClick={() => setDispRecipientType("loom")}
                          variant={dispRecipientType === "loom" ? "secondary" : "ghost"} size="sm" iconLeft={Buildings}>
                          Factory Loom
                        </Button>
                      </div>
                    </div>

                    {/* Recipient Dropdown */}
                    {dispRecipientType === "weaver" ? (
                      <div>
                        <label style={labelStyle} htmlFor="assign-weaver">Assign Weaver</label>
                        <Select value={activeWeaverId} onValueChange={setDispWeaverId}>
                          {weaversList.map(w => <SelectItem key={w.id} value={w.id}>{w.name} ({w.initials})</SelectItem>)}
                        </Select>
                        {selectedWeaver && (
                          <div style={{ marginTop: 16 }}>
                            <label style={labelStyle} htmlFor="assign-loom">Assign Loom</label>
                            <Select value={String(dispLoomNum)} onValueChange={v => setDispLoomNum(parseInt(v, 10))}>
                              {Array.from({ length: selectedWeaver.looms || 1 }).map((_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>Loom {i + 1}</SelectItem>
                              ))}
                            </Select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label style={labelStyle} htmlFor="assign-loom-number">Assign Loom Number</label>
                        <Select value={String(dispLoomNum)} onValueChange={v => setDispLoomNum(parseInt(v, 10))}>
                          {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>Loom {n}</SelectItem>)}
                        </Select>
                      </div>
                    )}



                    {/* Instruction field */}
                    <div>
                      <label style={labelStyle}>Description / Dispatch Instructions <span style={{ color: T.royalBurgundy }}>*</span></label>
                      <Textarea value={dispInstructions} onChange={e => setDispInstructions(e.target.value)} rows={3} placeholder="Provide precise guidelines for weaving style, tension, spacing, or borders…" />
                    </div>

                    {/* Attachments section (Images) */}
                    <div>
                      <label style={labelStyle}>Attachments (Optional)</label>
                      <div style={{ marginBottom: 10 }}>
                        <UploadZone label="Upload Color Slip" hint="Upload custom slip image" icon={ImageSquare} preview={uploadedSlip} onFile={setUploadedSlip} />
                      </div>
                      <div>
                        <UploadZone label="Upload Design Graph" hint="Upload custom graph image" icon={Graph} preview={uploadedGraph} onFile={setUploadedGraph} />
                      </div>
                    </div>

                    {/* Submit button */}
                    <Button onClick={handleSendDispatch} disabled={!dispInstructions.trim()} variant="primary" size="lg" fullWidth className="mt-2" iconLeft={PaperPlaneTilt}>
                      Dispatch Instructions
                    </Button>
                  </div>
                </div>
              </div>

              {/* History Side */}
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Search bar */}
                  <div style={{ position: "relative" }}>
                    <SearchInput value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search sent history by design code, recipient, or text…" />
                  </div>

                  <h3 style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={18} color={T.royalBurgundy} /> Sent History Log
                  </h3>

                  <DateFilterBar filter={historyDateFilter} onChange={setHistoryDateFilter} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(100dvh - 360px)", overflowY: "auto", paddingRight: 4 }}>
                    {(() => {
                      const filtered = dispatchHistory.filter(h => {
                        if (!matchesDateFilter(h.sentAt, historyDateFilter)) return false;
                        if (!historySearch) return true;
                        const q = historySearch.toLowerCase();
                        return h.recipientName.toLowerCase().includes(q) || h.instructions.toLowerCase().includes(q);
                      });

                      if (filtered.length === 0) {
                        return (
                          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "48px 24px", textAlign: "center" }}>
                            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No dispatches recorded yet. Use the control center to send design specs.</div>
                          </div>
                        );
                      }

                      return filtered.map(h => (
                        <div key={h.id} style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, borderLeft: `5px solid ${h.recipientType === "weaver" ? T.royalBurgundy : T.antiqueGold}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.03)", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Dispatch to {h.recipientName}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                                <CalendarCheck size={12} /> Sent on {h.sentAt}
                              </div>
                            </div>
                            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: h.recipientType === "weaver" ? "rgba(110,15,45,0.09)" : "rgba(200,155,71,0.12)", color: h.recipientType === "weaver" ? T.royalBurgundy : "#8B6018", borderRadius: 6, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                              {h.recipientType === "weaver" ? <User size={11} /> : <Buildings size={11} />}
                              {h.recipientName}
                            </span>
                          </div>

                          <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid rgba(110,15,45,0.06)`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5 }}>
                            <strong>Instructions:</strong> {h.instructions}
                          </div>

                          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                            {h.colorSlipImage && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                                <img
                                  src={h.colorSlipImage}
                                  alt="Color slip"
                                  onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — Dispatch to ${h.recipientName}` })}
                                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}`, cursor: "pointer" }}
                                />
                              </div>
                            )}
                            {h.designGraphImage && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                                <img
                                  src={h.designGraphImage}
                                  alt="Design graph"
                                  onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — Dispatch to ${h.recipientName}` })}
                                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}`, cursor: "pointer" }}
                                />
                              </div>
                            )}
                            {!h.colorSlipImage && !h.designGraphImage && (
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>
                                No files attached
                              </span>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
        </SectionCard>
          </FadeUp>
      </div>

      {/* Footer */}
      <div className="px-4 md:px-7 xl:px-14" style={{ background: T.luxuryBrown, paddingTop: 32, paddingBottom: 32, textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: T.warmCream, marginBottom: 6 }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Weaver Dispatcher
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <AddDesignModal key="add" onClose={() => setShowAdd(false)} onSave={d => { addDesign(d); setShowAdd(false); }} />
        )}
        {viewDesign && (
          <DesignCodeCard key="view" design={viewDesign} onClose={() => setViewDesign(null)} />
        )}
        {slipDesign && (
          <SlipModal key="slip" design={slipDesign} onClose={() => setSlipDesign(null)}
            onSave={(slip, graph) => {
              updateDesign(slipDesign.code, { colorSlipPhoto: slip, designGraph: graph, hasColorSlip: !!slip, hasGraph: !!graph });
              setSlipDesign(null);
            }}
          />
        )}
        {zoomImage && (
          <motion.div key="zoom" role="dialog" aria-modal="true" aria-label={zoomImage.label}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", background: "var(--surface-scrim)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14 }}>
              <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{zoomImage.label}</span>
                <Button onClick={() => setZoomImage(null)} variant="primary" size="sm">Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
