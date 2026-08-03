import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Hash, ImageSquare, Swatches, Stack, Graph, CheckCircle,
  Eye as PhEye, UploadSimple, Plus as PhPlus, FloppyDisk,
  MagnifyingGlass, WarningCircle, Package, X as PhX,
  PaperPlaneTilt, CalendarCheck, User, Buildings, FileText, SlidersHorizontal,
} from "@phosphor-icons/react";

import { useDesignLibrary, DesignEntry, DispatchRecord } from "../contexts/DesignLibraryContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";

import { T, F, G } from "./theme";
import {
  FadeUp, WeaverCombobox, UploadZone, fieldStyle, labelStyle,
  DesignCodeCard, DesignCard, AddDesignModal, SlipModal,
} from "./DesignLibraryComponents";

export { DesignCodeCard };


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const WEAVERS_LIST = [
  { id: "WV-002", name: "Padma Veni", initials: "PV", looms: 3 },
  { id: "WV-001", name: "Ravi Kumar", initials: "RK", looms: 5 },
  { id: "WV-007", name: "Suresh Murti", initials: "SM", looms: 2 },
];

export function DesignLibraryPage() {
  const { designs, addDesign, updateDesign, dispatches: dispatchHistory, addDispatch } = useDesignLibrary();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All Designs");
  const [showAdd, setShowAdd] = useState(false);
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const [slipDesign, setSlipDesign] = useState<DesignEntry | null>(null);

  const [dispRecipientType, setDispRecipientType] = useState<"weaver" | "loom">("weaver");
  const [dispWeaverId, setDispWeaverId] = useState(WEAVERS_LIST[0].id);
  const [dispLoomNum, setDispLoomNum] = useState<number>(1);
  const [dispInstructions, setDispInstructions] = useState("");
  
  // Custom file upload previews (mock states)
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [uploadedGraph, setUploadedGraph] = useState<string | null>(null);

  const [dispatchSavedMsg, setDispatchSavedMsg] = useState<string | null>(null);

  // Filters / Search for dispatches history log
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [zoomImage, setZoomImage] = useState<{ url: string; label: string } | null>(null);

  const selectedWeaver = WEAVERS_LIST.find(w => w.id === dispWeaverId);

  const handleSendDispatch = () => {
    const rName = dispRecipientType === "weaver" ? (selectedWeaver?.name || "Weaver") : `Loom ${dispLoomNum}`;
    const rId = dispRecipientType === "weaver" ? dispWeaverId : `Loom ${dispLoomNum}`;

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
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── Page header ── */}
      <div style={{ background: T.darkBurgundy, padding: "36px 56px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, bottom: -60, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.14)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 20, bottom: -20, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 14 }}>
              Since 1999 · Production
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#fff", margin: "0 0 6px 0", lineHeight: 1.1 }}>
              Weaver Dispatcher
            </h1>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, margin: 0, lineHeight: 1.6 }}>
              Dispatch design sheets, color slip photos, design graphs, and specific weaver instructions directly to active looms.
            </p>
          </div>
          <div style={{ display: "none" }} />
        </div>
      </div>



      {/* ── Main content ── */}
      <div style={{ padding: "32px 56px 48px" }}>
        <FadeUp>
          {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(110,15,45,0.22)" }}>
                <PaperPlaneTilt size={24} color="#FFFDF9" weight="bold" />
              </div>
              <div>
                <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, letterSpacing: "-0.2px", lineHeight: 1.2 }}>Weaver Dispatch Control</h2>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2, letterSpacing: "0.4px" }}>DISPATCH PRODUCTION DESIGN SLIPS</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 32, alignItems: "start" }}>
              {/* Form Side */}
              <div>
                <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
                  <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                    <SlidersHorizontal size={20} color={T.royalBurgundy} weight="bold" /> Dispatch Settings
                  </h3>
                  
                  {dispatchSavedMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: "rgba(30,102,64,0.08)", border: `1.5px solid ${T.green}`, borderRadius: 10, padding: "12px 16px", color: T.green, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>
                      ✓ {dispatchSavedMsg}
                    </motion.div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Recipient Type Toggle */}
                    <div>
                      <label style={labelStyle}>Recipient Type</label>
                      <div style={{ display: "flex", background: "rgba(110,15,45,0.05)", borderRadius: 12, padding: 4, border: `1px solid ${T.borderDef}`, width: "fit-content" }}>
                        <button type="button" onClick={() => setDispRecipientType("weaver")}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: dispRecipientType === "weaver" ? "#FFFFFF" : "transparent", color: dispRecipientType === "weaver" ? T.royalBurgundy : T.taupe, boxShadow: dispRecipientType === "weaver" ? "0 2px 8px rgba(110,15,45,0.08)" : "none", transition: "all 0.18s" }}>
                          <User size={14} weight="bold" /> Weaver
                        </button>
                        <button type="button" onClick={() => setDispRecipientType("loom")}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: dispRecipientType === "loom" ? "#FFFFFF" : "transparent", color: dispRecipientType === "loom" ? T.royalBurgundy : T.taupe, boxShadow: dispRecipientType === "loom" ? "0 2px 8px rgba(110,15,45,0.08)" : "none", transition: "all 0.18s" }}>
                          <Buildings size={14} weight="bold" /> Factory Loom
                        </button>
                      </div>
                    </div>

                    {/* Recipient Dropdown */}
                    {dispRecipientType === "weaver" ? (
                      <div>
                        <label style={labelStyle} htmlFor="assign-weaver">Assign Weaver</label>
                        <select id="assign-weaver" value={dispWeaverId} onChange={e => setDispWeaverId(e.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                          {WEAVERS_LIST.map(w => <option key={w.id} value={w.id}>{w.name} ({w.initials})</option>)}
                        </select>
                        {selectedWeaver && (
                          <div style={{ marginTop: 16 }}>
                            <label style={labelStyle} htmlFor="assign-loom">Assign Loom</label>
                            <select id="assign-loom" value={dispLoomNum} onChange={e => setDispLoomNum(parseInt(e.target.value, 10))} style={{ ...fieldStyle, cursor: "pointer" }}>
                              {Array.from({ length: selectedWeaver.looms || 1 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>Loom {i + 1}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label style={labelStyle} htmlFor="assign-loom-number">Assign Loom Number</label>
                        <select id="assign-loom-number" value={dispLoomNum} onChange={e => setDispLoomNum(parseInt(e.target.value, 10))} style={{ ...fieldStyle, cursor: "pointer" }}>
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Loom {n}</option>)}
                        </select>
                      </div>
                    )}



                    {/* Instruction field */}
                    <div>
                      <label style={labelStyle}>Description / Dispatch Instructions <span style={{ color: T.royalBurgundy }}>*</span></label>
                      <textarea value={dispInstructions} onChange={e => setDispInstructions(e.target.value)} rows={3} placeholder="Provide precise guidelines for weaving style, tension, spacing, or borders…"
                        style={{ width: "100%", padding: "12px 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
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
                    <motion.button onClick={handleSendDispatch} disabled={!dispInstructions.trim()}
                      whileHover={dispInstructions.trim() ? { scale: 1.02, backgroundColor: T.darkBurgundy } : undefined} whileTap={dispInstructions.trim() ? { scale: 0.97 } : undefined}
                      style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: dispInstructions.trim() ? T.royalBurgundy : T.taupe, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: dispInstructions.trim() ? "pointer" : "not-allowed", opacity: dispInstructions.trim() ? 1 : 0.55, marginTop: 8 }}>
                      <PaperPlaneTilt size={17} color="#fff" weight="fill" /> Dispatch Instructions
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* History Side */}
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Search bar */}
                  <div style={{ position: "relative" }}>
                    <MagnifyingGlass size={18} weight="bold" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
                    <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search sent history by design code, recipient, or text…" style={{ ...fieldStyle, paddingLeft: 44 }} />
                  </div>

                  <h3 style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={18} color={T.royalBurgundy} /> Sent History Log
                  </h3>

                  <DateFilterBar filter={historyDateFilter} onChange={setHistoryDateFilter} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(100vh - 360px)", overflowY: "auto", paddingRight: 4 }}>
                    {dispatchHistory.filter(h => {
                      if (!matchesDateFilter(h.sentAt, historyDateFilter)) return false;
                      if (!historySearch) return true;
                      const q = historySearch.toLowerCase();
                      return h.recipientName.toLowerCase().includes(q) || h.instructions.toLowerCase().includes(q);
                    }).map(h => (
                      <div key={h.id} style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, borderLeft: `5px solid ${h.recipientType === "weaver" ? T.royalBurgundy : T.antiqueGold}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.03)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Dispatch to {h.recipientName}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                              <CalendarCheck size={12} /> Sent on {h.sentAt}
                            </div>
                          </div>
                          <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: h.recipientType === "weaver" ? "rgba(110,15,45,0.09)" : "rgba(200,155,71,0.12)", color: h.recipientType === "weaver" ? T.royalBurgundy : "#8B6018", borderRadius: 6, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                            {h.recipientType === "weaver" ? <User size={11} weight="bold" /> : <Buildings size={11} weight="bold" />}
                            {h.recipientName}
                          </span>
                        </div>



                        <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid rgba(110,15,45,0.06)`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.5 }}>
                          <strong>Instructions:</strong> {h.instructions}
                        </div>

                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                          {h.colorSlipImage && (
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
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
                              <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                              <img
                                src={h.designGraphImage}
                                alt="Design graph"
                                onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — Dispatch to ${h.recipientName}` })}
                                style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}`, cursor: "pointer" }}
                              />
                            </div>
                          )}
                          {!h.colorSlipImage && !h.designGraphImage && (
                            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontStyle: "italic" }}>
                              No files attached
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {dispatchHistory.length === 0 && (
                      <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No dispatches recorded yet. Use the control center to send design specs.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
      </div>

      {/* Footer */}
      <div style={{ background: T.luxuryBrown, padding: "32px 56px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: T.warmCream, marginBottom: 6 }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
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
          <motion.div key="zoom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14 }}>
              <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{zoomImage.label}</span>
                <button onClick={() => setZoomImage(null)} style={{ background: T.royalBurgundy, border: "none", color: "#FFF", fontFamily: F.ui, fontWeight: 600, padding: "8px 18px", borderRadius: 8, cursor: "pointer" }}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
