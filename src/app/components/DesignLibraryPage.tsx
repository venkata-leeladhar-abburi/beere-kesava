import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Hash, ImageSquare, Swatches, Stack, Graph, CheckCircle,
  Eye as PhEye, UploadSimple, Plus as PhPlus, FloppyDisk,
  MagnifyingGlass, WarningCircle, Package, X as PhX,
  PaperPlaneTilt, CalendarCheck, User, Buildings, FileText, SlidersHorizontal,
} from "@phosphor-icons/react";

import { useDesignLibrary, DesignEntry } from "./DesignLibraryContext";
import { useBatches } from "./BatchContext";

// ─── Design tokens (match app-wide palette) ──────────────────────────────────
const T = {
  silkCream:    "#F7F2EA",
  warmIvory:    "#FFFDF9",
  royalBurgundy:"#6E0F2D",
  deepWine:     "#4A061B",
  darkBurgundy: "#3D0E1A",
  antiqueGold:  "#C89B47",
  goldLight:    "#E7C983",
  luxuryBrown:  "#3B2314",
  warmCream:    "#F5E8D0",
  taupe:        "#8B7060",
  green:        "#1E6640",
  borderDef:    "rgba(110,15,45,0.10)",
  borderGold:   "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};

// ─── FadeUp helper ────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Weaver dropdown / text combobox ─────────────────────────────────────────
const KNOWN_WEAVERS = ["Ravi Kumar", "Padma Veni", "Suresh Murti", "Anand K.", "Meena R.", "Kamala B.", "Venkat Rao", "Lakshmi D."];

function WeaverCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const filtered = KNOWN_WEAVERS.filter(w => w.toLowerCase().includes(value.toLowerCase()));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={fieldStyle}
        placeholder="Weaver name (optional)"
        autoComplete="off"
      />
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 500, background: T.warmIvory, borderRadius: 10, boxShadow: "0 8px 28px rgba(44,6,27,0.14)", border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}
          >
            {filtered.map(w => (
              <button key={w} onMouseDown={() => { onChange(w); setOpen(false); }}
                style={{ width: "100%", display: "block", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >{w}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
  background: T.warmIvory, border: `1.5px solid ${T.borderDef}`,
  borderRadius: 10, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 700,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

// ─── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({ label, hint, icon: Icon, preview, onFile }: {
  label: string; hint: string; icon: React.ElementType;
  preview: string | null; onFile: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onFile(ev.target?.result as string);
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ height: 100, border: `2px dashed rgba(110,15,45,0.22)`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", background: T.warmIvory, overflow: "hidden", position: "relative" }}
      >
        {preview ? (
          <>
            <img src={preview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
            <div style={{ position: "relative", zIndex: 1, background: "rgba(61,14,26,0.65)", borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <UploadSimple size={13} color={T.goldLight} weight="duotone" />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.goldLight, fontWeight: 600 }}>Replace</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={T.taupe} weight="duotone" />
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{hint}</span>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold, fontWeight: 600 }}>Click to upload</span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED: DesignCodeCard — reusable modal, triggered from Batch Creation too
// ═══════════════════════════════════════════════════════════════════════════════
export function DesignCodeCard({ design, onClose }: { design: DesignEntry; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 520, maxWidth: "calc(100vw - 48px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        {/* Header — color slip photo or dark placeholder */}
        {design.colorSlipPhoto ? (
          <div style={{ height: 200, position: "relative", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
            <img src={design.colorSlipPhoto} alt={design.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(61,14,26,0.7) 0%, transparent 55%)" }} />
            <div style={{ position: "absolute", bottom: 16, left: 20, fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.goldLight, letterSpacing: "0.5px" }}>{design.code}</div>
            <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: 8, background: "rgba(61,14,26,0.55)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
              <PhX size={16} />
            </button>
          </div>
        ) : (
          <div style={{ background: T.darkBurgundy, padding: "24px 24px 20px", borderRadius: "20px 20px 0 0", position: "relative" }}>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 8 }}>Design Code</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 14, color: T.antiqueGold, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "4px 10px" }}>{design.code}</span>
              <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#fff" }}>{design.name || design.code}</span>
            </div>
            <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
              <PhX size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name + type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Design Code", val: design.code,     mono: true  },
              { label: "Saree Type",  val: design.typeName || "—",  mono: false },
              { label: "Type Code",   val: design.typeCode || "—",  mono: true  },
              { label: "Total Produced", val: design.total ? `${design.total.toLocaleString()} sarees` : "—", mono: false },
            ].map(r => (
              <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {design.desc && (
            <div style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Description</div>
              <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe, lineHeight: 1.6 }}>{design.desc}</div>
            </div>
          )}

          {/* Weaver name */}
          {design.weaverName && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(30,102,64,0.06)", border: "1px solid rgba(30,102,64,0.18)", borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.goldLight }}>
                  {design.weaverName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Assigned Weaver</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{design.weaverName}</div>
              </div>
            </div>
          )}

          {/* Notes for weaver */}
          {design.notesForWeaver && (
            <div style={{ background: "rgba(200,155,71,0.07)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Notes for Weaver</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5E1A", lineHeight: 1.6 }}>{design.notesForWeaver}</div>
            </div>
          )}

          {/* Graph + design graph */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Design graph */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: design.hasGraph ? "rgba(30,102,64,0.07)" : "rgba(200,155,71,0.09)", border: `1px solid ${design.hasGraph ? "rgba(30,102,64,0.20)" : "rgba(200,155,71,0.28)"}`, borderRadius: 10, padding: "11px 13px" }}>
              <Graph size={17} color={design.hasGraph ? T.green : "#8B6018"} weight="duotone" />
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Design Graph</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: design.hasGraph ? T.green : "#8B6018" }}>
                  {design.hasGraph ? "Uploaded ✓" : "Not uploaded"}
                </div>
              </div>
            </div>
            {/* Color slip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: design.hasColorSlip ? "rgba(30,102,64,0.07)" : "rgba(200,155,71,0.09)", border: `1px solid ${design.hasColorSlip ? "rgba(30,102,64,0.20)" : "rgba(200,155,71,0.28)"}`, borderRadius: 10, padding: "11px 13px" }}>
              <ImageSquare size={17} color={design.hasColorSlip ? T.green : "#8B6018"} weight="duotone" />
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Color Slip</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: design.hasColorSlip ? T.green : "#8B6018" }}>
                  {design.hasColorSlip ? "Uploaded ✓" : "Not uploaded"}
                </div>
              </div>
            </div>
          </div>

          {/* Design graph image if available */}
          {design.designGraph && (
            <div style={{ borderRadius: 12, overflow: "hidden", height: 140 }}>
              <img src={design.designGraph} alt="Design Graph" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <button onClick={onClose} style={{ height: 46, background: G.button, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Design card (grid item) ──────────────────────────────────────────────────
function DesignCard({ d, onView, onSlip, onDispatch }: { d: DesignEntry; onView: (d: DesignEntry) => void; onSlip: (d: DesignEntry) => void; onDispatch: (code: string) => void }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.07)", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Photo / placeholder */}
      {d.colorSlipPhoto ? (
        <div style={{ height: 148, overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <img src={d.colorSlipPhoto} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(61,14,26,0.45) 100%)" }} />
          <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6, background: "rgba(61,14,26,0.72)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "5px 10px" }}>
            <Hash size={13} color={T.goldLight} weight="bold" />
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.goldLight, letterSpacing: "0.4px" }}>{d.code}</span>
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: "rgba(255,253,249,0.18)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageSquare size={16} color="#FFFDF9" weight="duotone" />
          </div>
        </div>
      ) : (
        <div style={{ height: 148, background: `linear-gradient(135deg, ${T.warmCream} 0%, #F0E4CE 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0, position: "relative" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageSquare size={28} color={T.taupe} weight="duotone" />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>Color Slip Not Uploaded</span>
          <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6, background: "rgba(139,112,96,0.14)", borderRadius: 8, padding: "5px 10px" }}>
            <Hash size={13} color={T.taupe} weight="bold" />
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.taupe }}>{d.code}</span>
          </div>
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: "18px 18px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.25, marginBottom: 8 }}>{d.name || d.code}</div>

        {d.typeCode && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 8, padding: "5px 10px", marginBottom: 10, alignSelf: "flex-start" }}>
            <Swatches size={13} color={T.royalBurgundy} weight="duotone" />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{d.typeCode}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>· {d.typeName}</span>
          </div>
        )}

        {d.weaverName && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 5, padding: "2px 6px" }}>Weaver</span>
            {d.weaverName}
          </div>
        )}

        {d.desc && (
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, marginBottom: 12 }}>{d.desc}</div>
        )}

        <div style={{ height: 1, background: T.borderDef, marginBottom: 12, marginTop: "auto" }} />

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: d.batches > 0 ? "rgba(30,102,64,0.07)" : "rgba(139,112,96,0.07)", borderRadius: 10, padding: "10px 12px" }}>
            <Stack size={18} color={d.batches > 0 ? T.green : T.taupe} weight="duotone" />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: d.batches > 0 ? T.green : T.taupe, lineHeight: 1 }}>{d.batches}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>batch{d.batches !== 1 ? "es" : ""} active</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", borderRadius: 10, padding: "10px 12px" }}>
            <Package size={18} color={T.royalBurgundy} weight="duotone" />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{d.total.toLocaleString()}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>total produced</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: d.hasGraph ? "rgba(30,102,64,0.07)" : "rgba(200,155,71,0.09)", border: `1px solid ${d.hasGraph ? "rgba(30,102,64,0.20)" : "rgba(200,155,71,0.28)"}`, borderRadius: 9, padding: "9px 13px", marginBottom: 14 }}>
          <Graph size={17} color={d.hasGraph ? T.green : "#8B6018"} weight="duotone" />
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: d.hasGraph ? T.green : "#8B6018", flex: 1 }}>
            Design Graph: {d.hasGraph ? "Uploaded" : "Not uploaded yet"}
          </span>
          {d.hasGraph && <CheckCircle size={15} color={T.green} weight="bold" />}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 18px 18px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button onClick={() => onView(d)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <PhEye size={15} weight="duotone" /> View Design
          </motion.button>
          <motion.button onClick={() => onSlip(d)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <UploadSimple size={15} weight="duotone" />
            {d.hasColorSlip ? "Update Slip" : "Upload Slip"}
          </motion.button>
        </div>
        <motion.button onClick={() => onDispatch(d.code)} whileHover={{ scale: 1.02, backgroundColor: T.darkBurgundy }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <PaperPlaneTilt size={15} color="#FFFDF9" weight="fill" /> Dispatch Design
        </motion.button>
      </div>
    </div>
  );
}

// ─── Add / Edit form modal ────────────────────────────────────────────────────
const DESIGN_FILTERS = ["All Designs", "Currently in Production", "Completed Designs", "Has Design Graph", "No Graph Uploaded"];
const SAREE_TYPES = [
  { code: "HZ-003", name: "Heavy Zari" },
  { code: "SB-001", name: "Self Brocade" },
  { code: "PS-002", name: "Plain Silk" },
  { code: "BS-004", name: "Bridal Special" },
  { code: "LC-005", name: "Light Cotton" },
];

function emptyForm(): Partial<DesignEntry> {
  return { code: "", name: "", typeCode: "HZ-003", typeName: "Heavy Zari", desc: "", weaverName: "", notesForWeaver: "", colorSlipPhoto: null, designGraph: null };
}

function AddDesignModal({ onClose, onSave }: { onClose: () => void; onSave: (d: DesignEntry) => void }) {
  const [form, setForm] = useState<Partial<DesignEntry>>(emptyForm());
  const set = (k: keyof DesignEntry, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  function handleSave() {
    if (!form.code?.trim()) return;
    const type = SAREE_TYPES.find(t => t.code === form.typeCode);
    onSave({
      code: form.code!.trim(),
      name: form.name?.trim() || "",
      typeCode: form.typeCode || "",
      typeName: type?.name || form.typeName || "",
      desc: form.desc?.trim() || "",
      weaverName: form.weaverName?.trim() || "",
      notesForWeaver: form.notesForWeaver?.trim() || "",
      colorSlipPhoto: form.colorSlipPhoto ?? null,
      designGraph: form.designGraph ?? null,
      batches: 0,
      total: 0,
      hasColorSlip: !!form.colorSlipPhoto,
      hasGraph: !!form.designGraph,
    });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.22 }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 560, maxWidth: "calc(100vw - 48px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>Add New Design Code</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex" }}><PhX size={18} /></button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Code + Saree type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Design Code <span style={{ color: T.royalBurgundy }}>*</span></label>
              <input value={form.code ?? ""} onChange={e => set("code", e.target.value)} style={fieldStyle} placeholder="e.g. BKB-047" />
            </div>
            <div>
              <label style={labelStyle}>Saree Type</label>
              <select value={form.typeCode} onChange={e => { const t = SAREE_TYPES.find(x => x.code === e.target.value); set("typeCode", e.target.value); set("typeName", t?.name ?? ""); }} style={{ ...fieldStyle, cursor: "pointer" }}>
                {SAREE_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} · {t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Weaver name */}
          <div>
            <label style={labelStyle}>Weaver Name <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <WeaverCombobox value={form.weaverName ?? ""} onChange={v => set("weaverName", v)} />
          </div>

          {/* Notes for weaver */}
          <div>
            <label style={labelStyle}>Notes for Weaver <span style={{ fontWeight: 400, color: T.taupe }}>(optional)</span></label>
            <textarea value={form.notesForWeaver ?? ""} onChange={e => set("notesForWeaver", e.target.value)} rows={2} placeholder="Special instructions for the weaver…"
              style={{ width: "100%", padding: "12px 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>

          {/* Image uploads */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <UploadZone label="Color Slip Photo (optional)" hint="Clear photo of the color slip" icon={ImageSquare}
              preview={form.colorSlipPhoto ?? null} onFile={url => set("colorSlipPhoto", url)} />
            <UploadZone label="Design Graph (optional)" hint="Upload graph if available" icon={Graph}
              preview={form.designGraph ?? null} onFile={url => set("designGraph", url)} />
          </div>

          {/* Warning */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 10, padding: "11px 14px" }}>
            <WarningCircle size={16} color={T.antiqueGold} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "#8B6018", lineHeight: 1.5 }}>
              Only Design Code is required — all other fields can be filled in later. The new code will be saved to the master Design Library immediately.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button onClick={handleSave} disabled={!form.code?.trim()}
              whileHover={form.code?.trim() ? { scale: 1.02, backgroundColor: T.deepWine } : undefined} whileTap={form.code?.trim() ? { scale: 0.97 } : undefined}
              style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: form.code?.trim() ? T.royalBurgundy : T.taupe, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: form.code?.trim() ? "pointer" : "not-allowed", opacity: form.code?.trim() ? 1 : 0.55 }}>
              <FloppyDisk size={17} color="#FFFDF9" weight="bold" /> Save Design Code
            </motion.button>
            <motion.button onClick={onClose} whileHover={{ scale: 1.02 }}
              style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Upload/update slip modal ─────────────────────────────────────────────────
function SlipModal({ design, onClose, onSave }: { design: DesignEntry; onClose: () => void; onSave: (slip: string | null, graph: string | null) => void }) {
  const [slip, setSlip] = useState<string | null>(design.colorSlipPhoto);
  const [graph, setGraph] = useState<string | null>(design.designGraph);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.22 }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 480, maxWidth: "calc(100vw - 48px)", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginBottom: 2 }}>{design.code}</div>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{design.hasColorSlip ? "Update Color Slip" : "Upload Color Slip"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe }}><PhX size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <UploadZone label="Color Slip Photo" hint="Clear photo of the color slip" icon={ImageSquare} preview={slip} onFile={setSlip} />
          <UploadZone label="Design Graph (optional)" hint="Upload design graph image" icon={Graph} preview={graph} onFile={setGraph} />
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button onClick={() => onSave(slip, graph)} whileHover={{ scale: 1.02, backgroundColor: T.deepWine }} whileTap={{ scale: 0.97 }}
              style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              <FloppyDisk size={17} color="#FFFDF9" weight="bold" /> {design.hasColorSlip ? "Update Slip" : "Upload Slip"}
            </motion.button>
            <motion.button onClick={onClose} whileHover={{ scale: 1.02 }}
              style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const WEAVERS_LIST = [
  { id: "WV-002", name: "Padma Veni", initials: "PV", loom: 2 },
  { id: "WV-001", name: "Ravi Kumar", initials: "RK", loom: 3 },
  { id: "WV-007", name: "Suresh Murti", initials: "SM", loom: 1 },
];

interface DispatchRecord {
  id: string;
  designCode: string;
  designName: string;
  recipientType: "weaver" | "loom";
  recipientName: string;
  batches: string[];
  instructions: string;
  hasColorSlip: boolean;
  hasGraph: boolean;
  sentAt: string;
}

const INITIAL_DISPATCHES: DispatchRecord[] = [
  {
    id: "DISP-001",
    designCode: "BKB-045",
    designName: "Self Brocade",
    recipientType: "weaver",
    recipientName: "Padma Veni",
    batches: ["BATCH-086"],
    instructions: "Maintain light warp tension in the borders. Ensure Resham thread transition is smooth in pallu section.",
    hasColorSlip: true,
    hasGraph: true,
    sentAt: "15 Jul 2026, 09:30 AM",
  },
  {
    id: "DISP-002",
    designCode: "BKB-031",
    designName: "Heavy Zari",
    recipientType: "loom",
    recipientName: "Loom 3",
    batches: ["BATCH-OWN"],
    instructions: "Run at standard speed. Check for any zari threads snapping before finalizing the border weave.",
    hasColorSlip: true,
    hasGraph: false,
    sentAt: "14 Jul 2026, 04:15 PM",
  }
];

export function DesignLibraryPage() {
  const { designs, addDesign, updateDesign } = useDesignLibrary();
  const { batches } = useBatches();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All Designs");
  const [showAdd, setShowAdd] = useState(false);
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const [slipDesign, setSlipDesign] = useState<DesignEntry | null>(null);

  const [activeTab, setActiveTab] = useState<"library" | "dispatches">("library");
  
  // Dispatch form states
  const [dispDesignCode, setDispDesignCode] = useState(designs[0]?.code || "");
  const [dispRecipientType, setDispRecipientType] = useState<"weaver" | "loom">("weaver");
  const [dispWeaverId, setDispWeaverId] = useState(WEAVERS_LIST[0].id);
  const [dispLoomNum, setDispLoomNum] = useState<number>(1);
  const [dispInstructions, setDispInstructions] = useState("");
  const [dispBatches, setDispBatches] = useState<string[]>([]);
  const [dispAttachSlip, setDispAttachSlip] = useState(false);
  const [dispAttachGraph, setDispAttachGraph] = useState(false);
  
  // Custom file upload previews (mock states)
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [uploadedGraph, setUploadedGraph] = useState<string | null>(null);

  // Dispatch history state
  const [dispatchHistory, setDispatchHistory] = useState<DispatchRecord[]>(INITIAL_DISPATCHES);
  const [dispatchSavedMsg, setDispatchSavedMsg] = useState<string | null>(null);

  // Filters / Search for dispatches history log
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    if (designs.length > 0 && !dispDesignCode) {
      setDispDesignCode(designs[0].code);
    }
  }, [designs]);

  // Pre-fill form when clicking dispatch on card
  const handleDispatchClick = (code: string) => {
    const d = designs.find(x => x.code === code);
    setDispDesignCode(code);
    if (d) {
      setDispAttachSlip(d.hasColorSlip);
      setDispAttachGraph(d.hasGraph);
    }
    setActiveTab("dispatches");
  };

  const selectedWeaver = WEAVERS_LIST.find(w => w.id === dispWeaverId);

  // Filter batches based on weaver/loom rows
  const activeBatches = batches.filter(b => b.status === "active" || b.status === "draft");
  const filteredBatches = activeBatches.filter(b => {
    if (dispRecipientType === "weaver") {
      return b.rows.some(r => r.weaverId === dispWeaverId);
    } else {
      return b.rows.some(r => r.weaverLoom === dispLoomNum);
    }
  });

  const batchListToDisplay = filteredBatches.length > 0 ? filteredBatches : activeBatches;

  const toggleDispBatch = (id: string) => {
    setDispBatches(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSendDispatch = () => {
    const d = designs.find(x => x.code === dispDesignCode);
    const rName = dispRecipientType === "weaver" ? (selectedWeaver?.name || "Weaver") : `Loom ${dispLoomNum}`;
    
    const newRecord: DispatchRecord = {
      id: `DISP-${String(dispatchHistory.length + 1).padStart(3, "0")}`,
      designCode: dispDesignCode,
      designName: d?.name || "Unnamed Design",
      recipientType: dispRecipientType,
      recipientName: rName,
      batches: dispBatches,
      instructions: dispInstructions,
      hasColorSlip: dispAttachSlip,
      hasGraph: dispAttachGraph,
      sentAt: new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    };

    setDispatchHistory([newRecord, ...dispatchHistory]);
    setDispatchSavedMsg(`Design ${dispDesignCode} successfully dispatched to ${rName}!`);
    setTimeout(() => setDispatchSavedMsg(null), 4000);

    // Reset form fields
    setDispInstructions("");
    setDispBatches([]);
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
              Since 1999 · Design Library
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#fff", margin: "0 0 6px 0", lineHeight: 1.1 }}>
              Design Library
            </h1>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontStyle: "italic", color: T.antiqueGold, marginBottom: 14 }}>
              &amp; Color Slip Registry
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, margin: 0, lineHeight: 1.6 }}>
              All design codes, color slip photos, design graphs, and weaver instructions. A new design code added here is immediately available across the entire system.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", paddingTop: 8 }}>
            {[
              { label: `${designs.length} Design Codes` },
              { label: `${designs.filter(d => d.hasColorSlip).length} with Color Slips` },
              { label: "All Designs Active", dot: true },
            ].map(chip => (
              <div key={chip.label} style={{ backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                {chip.dot && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />}
                <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap" }}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ padding: "0 48px", marginTop: -40, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 16, display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr", boxShadow: "0 8px 32px rgba(44,6,27,0.28)", overflow: "hidden" }}>
          {[
            { label: "Total Design Codes", val: designs.length, sub: "In master library", gold: false },
            { label: "With Color Slips",   val: designs.filter(d => d.hasColorSlip).length, sub: "Photo uploaded", gold: false },
            { label: "With Design Graph",  val: designs.filter(d => d.hasGraph).length, sub: "Graph uploaded", gold: true },
            { label: "Active in Production", val: designs.filter(d => d.batches > 0).length, sub: "Currently in batches", gold: false },
          ].flatMap((s, i, arr) => {
            const cell = (
              <div key={s.label} style={{ padding: "28px 32px", background: s.gold ? "linear-gradient(135deg, rgba(200,155,71,0.18) 0%, rgba(200,155,71,0.08) 100%)" : undefined, borderTop: s.gold ? `3px solid ${T.antiqueGold}` : undefined }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", color: s.gold ? T.goldLight : "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: s.gold ? T.goldLight : "#fff", lineHeight: 1, marginBottom: 6 }}>{s.val}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: s.gold ? "rgba(231,201,131,0.65)" : "rgba(255,255,255,0.50)" }}>{s.sub}</div>
              </div>
            );
            return i < arr.length - 1 ? [cell, <div key={`sep${i}`} style={{ background: "rgba(255,255,255,0.08)" }} />] : [cell];
          })}
        </div>
      </div>

      {/* ── Tabs Selector ── */}
      <div style={{ padding: "32px 56px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, width: "fit-content", border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 8px rgba(74,6,27,0.04)" }}>
          <button onClick={() => setActiveTab("library")}
            style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: activeTab === "library" ? T.royalBurgundy : "transparent", color: activeTab === "library" ? "#fff" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
            Design Library Registry
          </button>
          <button onClick={() => setActiveTab("dispatches")}
            style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: activeTab === "dispatches" ? T.royalBurgundy : "transparent", color: activeTab === "dispatches" ? "#fff" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
            Weaver Dispatcher &amp; History ({dispatchHistory.length})
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: "32px 56px 48px" }}>
        {activeTab === "library" ? (
          <FadeUp>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(110,15,45,0.22)" }}>
                  <Swatches size={26} color="#FFFDF9" weight="duotone" />
                </div>
                <div>
                  <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, letterSpacing: "-0.2px", lineHeight: 1.2 }}>All Design Codes</h2>
                  <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2, letterSpacing: "0.4px" }}>MASTER DESIGN REGISTRY</div>
                </div>
              </div>
              <motion.button onClick={() => setShowAdd(true)}
                initial={{ backgroundColor: T.green }} animate={{ backgroundColor: T.green }}
                whileHover={{ scale: 1.02, backgroundColor: "#145230" }} whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "12px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px rgba(30,102,64,0.20)" }}>
                <PhPlus size={16} weight="bold" /> Add New Design Code
              </motion.button>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 22px 62px", lineHeight: 1.6 }}>
              All designs used for production. Each design has a unique code, an optional color slip photo and design graph, and optional weaver instructions.
            </p>

            {/* Search + filters */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 22, boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 280px" }}>
                  <MagnifyingGlass size={18} weight="bold" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by design code, name, or weaver…" style={{ ...fieldStyle, paddingLeft: 44 }} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DESIGN_FILTERS.map(f => (
                    <motion.button key={f} onClick={() => setFilter(f)} whileHover={{ scale: 1.02 }}
                      style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: filter === f ? T.royalBurgundy : "transparent", color: filter === f ? "#FFFDF9" : T.taupe, border: filter === f ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}>
                      {f}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24, alignItems: "stretch" }}>
              {visible.map((d, i) => (
                <FadeUp key={d.code} delay={i * 0.05} style={{ height: "100%" }}>
                  <DesignCard d={d} onView={setViewDesign} onSlip={setSlipDesign} onDispatch={handleDispatchClick} />
                </FadeUp>
              ))}
              {visible.length === 0 && (
                <div style={{ gridColumn: "1 / -1", background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "48px 24px", textAlign: "center" }}>
                  <Swatches size={40} color={T.taupe} weight="duotone" style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                  <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No designs match your filter or search.</div>
                </div>
              )}
            </div>
          </FadeUp>
        ) : (
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
                    {/* Design Selection */}
                    <div>
                      <label style={labelStyle}>Select Design Code <span style={{ color: T.royalBurgundy }}>*</span></label>
                      <select value={dispDesignCode} onChange={e => {
                        const d = designs.find(x => x.code === e.target.value);
                        setDispDesignCode(e.target.value);
                        if (d) {
                          setDispAttachSlip(d.hasColorSlip);
                          setDispAttachGraph(d.hasGraph);
                        }
                      }} style={{ ...fieldStyle, cursor: "pointer" }}>
                        {designs.map(d => <option key={d.code} value={d.code}>{d.code} · {d.name || "Unnamed Design"}</option>)}
                      </select>
                    </div>

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
                        <label style={labelStyle}>Assign Weaver</label>
                        <select value={dispWeaverId} onChange={e => setDispWeaverId(e.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                          {WEAVERS_LIST.map(w => <option key={w.id} value={w.id}>{w.name} ({w.initials} · Loom {w.loom})</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={labelStyle}>Assign Loom Number</label>
                        <select value={dispLoomNum} onChange={e => setDispLoomNum(parseInt(e.target.value, 10))} style={{ ...fieldStyle, cursor: "pointer" }}>
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Loom {n}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Dynamic Batch Checklist */}
                    <div>
                      <label style={labelStyle}>
                        Select Batches
                        <span style={{ fontWeight: 400, color: T.taupe, marginLeft: 4 }}>
                          ({filteredBatches.length > 0 ? "associated with selected recipient" : "fallback list of active batches"})
                        </span>
                      </label>
                      <div style={{ maxHeight: 130, overflowY: "auto", border: `1.5px solid ${T.borderDef}`, borderRadius: 10, padding: "8px 12px", background: T.warmIvory, display: "flex", flexDirection: "column", gap: 8 }}>
                        {batchListToDisplay.map(b => (
                          <label key={b.batchId} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer" }}>
                            <input type="checkbox" checked={dispBatches.includes(b.batchId)} onChange={() => toggleDispBatch(b.batchId)} style={{ cursor: "pointer" }} />
                            <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                            <span style={{ color: T.taupe }}>({b.totalCount} sarees · Due: {b.dueDate || "—"})</span>
                          </label>
                        ))}
                        {batchListToDisplay.length === 0 && (
                          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                            No active batches found in system.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instruction field */}
                    <div>
                      <label style={labelStyle}>Description / Dispatch Instructions <span style={{ color: T.royalBurgundy }}>*</span></label>
                      <textarea value={dispInstructions} onChange={e => setDispInstructions(e.target.value)} rows={3} placeholder="Provide precise guidelines for weaving style, tension, spacing, or borders…"
                        style={{ width: "100%", padding: "12px 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
                    </div>

                    {/* Attachments checklist */}
                    <div>
                      <label style={labelStyle}>Attachments</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer", background: T.warmCream, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px" }}>
                          <input type="checkbox" checked={dispAttachSlip} onChange={e => setDispAttachSlip(e.target.checked)} style={{ cursor: "pointer" }} />
                          <ImageSquare size={16} color={T.royalBurgundy} weight="bold" /> Color Slip
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer", background: T.warmCream, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px" }}>
                          <input type="checkbox" checked={dispAttachGraph} onChange={e => setDispAttachGraph(e.target.checked)} style={{ cursor: "pointer" }} />
                          <Graph size={16} color={T.royalBurgundy} weight="bold" /> Design Graph
                        </label>
                      </div>

                      {/* Attachment file upload zones if not present on selected design */}
                      {dispAttachSlip && !designs.find(d => d.code === dispDesignCode)?.hasColorSlip && (
                        <div style={{ marginBottom: 10 }}>
                          <UploadZone label="Upload Custom Color Slip" hint="No slip in design library, upload custom slip image" icon={ImageSquare} preview={uploadedSlip} onFile={setUploadedSlip} />
                        </div>
                      )}
                      {dispAttachGraph && !designs.find(d => d.code === dispDesignCode)?.hasGraph && (
                        <div>
                          <UploadZone label="Upload Custom Design Graph" hint="No graph in design library, upload custom graph image" icon={Graph} preview={uploadedGraph} onFile={setUploadedGraph} />
                        </div>
                      )}
                    </div>

                    {/* Submit button */}
                    <motion.button onClick={handleSendDispatch} disabled={!dispDesignCode || !dispInstructions.trim()}
                      whileHover={dispDesignCode && dispInstructions.trim() ? { scale: 1.02, backgroundColor: T.darkBurgundy } : undefined} whileTap={dispDesignCode && dispInstructions.trim() ? { scale: 0.97 } : undefined}
                      style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: dispDesignCode && dispInstructions.trim() ? T.royalBurgundy : T.taupe, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: dispDesignCode && dispInstructions.trim() ? "pointer" : "not-allowed", opacity: dispDesignCode && dispInstructions.trim() ? 1 : 0.55, marginTop: 8 }}>
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

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(100vh - 360px)", overflowY: "auto", paddingRight: 4 }}>
                    {dispatchHistory.filter(h => {
                      if (!historySearch) return true;
                      const q = historySearch.toLowerCase();
                      return h.designCode.toLowerCase().includes(q) || h.recipientName.toLowerCase().includes(q) || h.instructions.toLowerCase().includes(q) || h.designName.toLowerCase().includes(q);
                    }).map(h => (
                      <div key={h.id} style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, borderLeft: `5px solid ${h.recipientType === "weaver" ? T.royalBurgundy : T.antiqueGold}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.03)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "2px 7px" }}>{h.designCode}</span>
                              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{h.designName}</span>
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

                        {h.batches.length > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, fontWeight: 600 }}>Linked Batches:</span>
                            {h.batches.map(b => (
                              <span key={b} style={{ fontFamily: F.mono, fontSize: 10.5, color: T.luxuryBrown, background: T.warmCream, border: `1px solid ${T.borderDef}`, borderRadius: 5, padding: "2px 6px" }}>
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, fontStyle: "italic" }}>
                            No specific batch linked.
                          </div>
                        )}

                        <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid rgba(110,15,45,0.06)`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.5 }}>
                          <strong>Instructions:</strong> {h.instructions}
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {h.hasColorSlip && (
                            <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(30,102,64,0.08)", color: T.green, borderRadius: 6, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                              Color Slip Attached
                            </span>
                          )}
                          {h.hasGraph && (
                            <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(30,102,64,0.08)", color: T.green, borderRadius: 6, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                              Design Graph Attached
                            </span>
                          )}
                          {!h.hasColorSlip && !h.hasGraph && (
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
        )}
      </div>

      {/* Footer */}
      <div style={{ background: T.luxuryBrown, padding: "32px 56px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: T.warmCream, marginBottom: 6 }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
          Design Library &amp; Color Slip Registry
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
      </AnimatePresence>
    </div>
  );
}
