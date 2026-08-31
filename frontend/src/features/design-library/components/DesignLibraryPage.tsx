import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Image as ImageSquare, Workflow as Graph,
  Send as PaperPlaneTilt, CalendarCheck, User, Building2 as Buildings, FileText, SlidersHorizontal,
} from "lucide-react";

import { useDesignLibrary, DesignEntry } from "../contexts/DesignLibraryContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../shared/ui/filter/MobileFilterBar";
import { weaversApi } from "../../../shared/api/weavers";

import { T, F } from "./theme";
import {
  FadeUp, SectionCard, UploadZone, labelStyle,
  DesignCodeCard, AddDesignModal, SlipModal,
} from "./DesignLibraryComponents";
import { Button, SearchInput, Textarea, Select, SelectItem } from "../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../shared/ui/state";

export { DesignCodeCard };

export function DesignLibraryPage() {
  const { addDesign, updateDesign, dispatches: dispatchHistory, addDispatch, isLoading, isError, error, refetch } = useDesignLibrary();
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

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>

      {/* ── Page header ── */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
            Since 1999 · Production
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: "0 0 6px 0", lineHeight: 1.1 }}>
              Weaver Dispatcher
            </h1>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", margin: 0, lineHeight: 1.6 }}>
            Dispatch design sheets, color slip photos, design graphs, and specific weaver instructions directly to active looms.
          </p>
        </div>
      </header>



      {/* ── Main content ── */}
      <div id="design-control" className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <FadeUp>
        <SectionCard icon={PaperPlaneTilt} title="Weaver Dispatch Control" subtitle="Dispatch production design slips to weavers or factory looms.">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr]" style={{ gap: 32, alignItems: "start" }}>
              {/* Form Side */}
              <div>
                <div className="p-4 sm:p-7 bg-white rounded-2xl border border-[rgba(110,15,45,0.18)] shadow-[0_1px_2px_rgba(74,6,27,0.03),0_6px_18px_rgba(74,6,27,0.05)]">
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
                      <div style={labelStyle}>Recipient Type</div>
                      <div className="grid grid-cols-2 w-full bg-[rgba(110,15,45,0.05)] rounded-xl p-1 border border-[rgba(110,15,45,0.12)]">
                        <Button type="button" onClick={() => setDispRecipientType("weaver")}
                          variant={dispRecipientType === "weaver" ? "secondary" : "ghost"} size="sm" iconLeft={User} className="w-full justify-center">
                          Weaver
                        </Button>
                        <Button type="button" onClick={() => setDispRecipientType("loom")}
                          variant={dispRecipientType === "loom" ? "secondary" : "ghost"} size="sm" iconLeft={Buildings} className="w-full justify-center">
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
                                // `i + 1` here is the actual 1-based loom number (the domain
                                // identifier), not a positional index — looms are numbered
                                // sequentially with no other stable field to key off.
                                <SelectItem key={`loom-${i + 1}`} value={String(i + 1)}>Loom {i + 1}</SelectItem>
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
                      <label style={labelStyle} htmlFor="dispatch-instructions">Description / Dispatch Instructions <span style={{ color: T.royalBurgundy }}>*</span></label>
                      <Textarea id="dispatch-instructions" value={dispInstructions} onChange={e => setDispInstructions(e.target.value)} rows={3} placeholder="Provide precise guidelines for weaving style, tension, spacing, or borders…" />
                    </div>

                    {/* Attachments section (Images) */}
                    <div>
                      <div style={labelStyle}>Attachments (Optional)</div>
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
                  <h3 style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={18} color={T.royalBurgundy} /> Sent History Log
                  </h3>

                  {/* Mobile Flipkart-style Filter Bar */}
                  <div className="md:hidden">
                    <MobileFilterBar
                      search={historySearch}
                      onSearchChange={setHistorySearch}
                      searchPlaceholder="Search recipient or instructions..."
                      filterGroups={[
                        {
                          id: "time",
                          label: "Time Period",
                          value: historyDateFilter.mode,
                          defaultValue: "all",
                          options: [
                            { value: "all", label: "All Time" },
                            { value: "day", label: "Specific Date" },
                            { value: "range", label: "Date Range" },
                            { value: "month", label: "Monthly" },
                            { value: "year", label: "Yearly" },
                          ],
                          onChange: (m: string) => {
                            const mode = m as DateFilterState["mode"];
                            if (mode === "day") setHistoryDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                            else if (mode === "month") setHistoryDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                            else if (mode === "year") setHistoryDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                            else setHistoryDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
                          },
                        },
                      ]}
                      onResetAll={() => {
                        setHistorySearch("");
                        setHistoryDateFilter(DEFAULT_DATE_FILTER);
                      }}
                    />
                  </div>

                  {/* Desktop Search & Date Filter Bar */}
                  <div className="hidden md:flex flex-col gap-3">
                    <SearchInput aria-label="Search sent history by design code, recipient, or text" value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search sent history by design code, recipient, or text…" />
                    <DateFilterBar filter={historyDateFilter} onChange={setHistoryDateFilter} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(100dvh - 360px)", overflowY: "auto", paddingRight: 4 }}>
                    {(() => {
                      const filtered = dispatchHistory.filter(h => {
                        if (!matchesDateFilter(h.sentAt, historyDateFilter)) return false;
                        if (!historySearch) return true;
                        const q = historySearch.toLowerCase();
                        return h.recipientName.toLowerCase().includes(q) || h.instructions.toLowerCase().includes(q);
                      });

                      if (isLoading) {
                        return <LoadingState variant="skeleton" rows={4} />;
                      }

                      if (isError) {
                        return <ErrorState error={error} onRetry={refetch} />;
                      }

                      if (filtered.length === 0) {
                        return dispatchHistory.length === 0 ? (
                          <EmptyState title="No dispatches recorded yet" description="Use the control center above to send design specs to weavers or looms." />
                        ) : (
                          <FilteredEmptyState onClearFilters={() => { setHistorySearch(""); setHistoryDateFilter(DEFAULT_DATE_FILTER); }} />
                        );
                      }

                      return filtered.map(h => {
                        const isWeaver = h.recipientType === "weaver";
                        return (
                          <div
                            key={h.id}
                            style={{
                              background: "#FFFFFF",
                              borderRadius: 16,
                              border: `1px solid rgba(110,15,45,0.18)`,
                              borderLeft: `4px solid ${isWeaver ? T.royalBurgundy : T.antiqueGold}`,
                              padding: "18px 20px",
                              boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                              transition: "all 0.2s ease",
                            }}
                          >
                            {/* Card Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>
                                    Dispatch to {h.recipientName}
                                  </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                                  <CalendarCheck size={13} color={T.royalBurgundy} />
                                  <span>Sent on {h.sentAt}</span>
                                </div>
                              </div>

                              <span style={{
                                fontFamily: F.ui,
                                fontSize: 12,
                                fontWeight: 700,
                                background: isWeaver ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.12)",
                                color: isWeaver ? T.royalBurgundy : "#8B6018",
                                border: `1px solid ${isWeaver ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.25)"}`,
                                borderRadius: 20,
                                padding: "4px 11px",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}>
                                {isWeaver ? <User size={12} /> : <Buildings size={12} />}
                                <span>{h.recipientName}</span>
                              </span>
                            </div>

                            {/* Instructions Box */}
                            <div style={{
                              background: "rgba(110,15,45,0.03)",
                              border: `1px solid rgba(110,15,45,0.08)`,
                              borderRadius: 12,
                              padding: "12px 16px",
                              wordBreak: "break-word",
                            }}>
                              <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                                INSTRUCTIONS:
                              </span>
                              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.55 }}>
                                {h.instructions}
                              </div>
                            </div>

                            {/* Attachments */}
                            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" as const, marginTop: 2 }}>
                              {h.colorSlipImage && (
                                <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                  <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                                  <button
                                    type="button"
                                    onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — Dispatch to ${h.recipientName}` })}
                                    style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", lineHeight: 0 }}
                                    aria-label={`Zoom color slip — dispatch to ${h.recipientName}`}
                                  >
                                    <img
                                      src={h.colorSlipImage}
                                      alt="Color slip"
                                      style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: `1.5px solid rgba(110,15,45,0.18)`, boxShadow: "0 2px 8px rgba(74,6,27,0.06)" }}
                                    />
                                  </button>
                                </div>
                              )}
                              {h.designGraphImage && (
                                <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                  <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                                  <button
                                    type="button"
                                    onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — Dispatch to ${h.recipientName}` })}
                                    style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", lineHeight: 0 }}
                                    aria-label={`Zoom design graph — dispatch to ${h.recipientName}`}
                                  >
                                    <img
                                      src={h.designGraphImage}
                                      alt="Design graph"
                                      style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: `1.5px solid rgba(110,15,45,0.18)`, boxShadow: "0 2px 8px rgba(74,6,27,0.06)" }}
                                    />
                                  </button>
                                </div>
                              )}
                              {!h.colorSlipImage && !h.designGraphImage && (
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", background: "rgba(110,15,45,0.02)", padding: "4px 10px", borderRadius: 8, border: "1px dashed rgba(110,15,45,0.10)" }}>
                                  No files attached
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
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
