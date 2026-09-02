import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Hash, Image as ImageSquare, Palette as Swatches, Workflow as Graph, CheckCircle2 as CheckCircle,
  Eye as PhEye, Upload as UploadSimple,
  Package, X as PhX, Send as PaperPlaneTilt,
  type LucideIcon,
} from "lucide-react";
import { DesignEntry } from "../contexts/DesignLibraryContext";
import { T, F } from "./theme";
import { Button, IconButton, Input } from "../../../shared/ui/primitives";
import { IMAGE_ACCEPT_ATTR, IMAGE_REJECTION_MESSAGE, isAcceptedImageFile } from "../../../shared/lib/imageTypes";
import { Modal } from "../../../shared/ui/overlay";
import { EntityCode } from "@/shared/ui/domain";
import { uploadsApi, resolveAssetUrl } from "../../../shared/api/uploads";
import { ApiError } from "../../../shared/api/client";

export { AddDesignModal, SlipModal, EditDispatchModal } from "./DesignModals";

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, Payments, Weavers, Customers, Vendors, Suppliers,
// Users, Inventory, Pricing, and Notifications pages.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto flex-nowrap min-w-0 pt-0.5">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4">
        {children}
      </div>
    </div>
  );
}

export function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
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

const KNOWN_WEAVERS = ["Ravi Kumar", "Padma Veni", "Suresh Murti", "Anand K.", "Meena R.", "Kamala B.", "Venkat Rao", "Lakshmi D."];

export function WeaverCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
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
              <Button key={w} type="button" variant="ghost" size="sm" fullWidth
                onMouseDown={() => { onChange(w); setOpen(false); }}
                className="justify-start"
              >{w}</Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const fieldStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
  background: T.warmIvory, border: `1.5px solid ${T.borderDef}`,
  borderRadius: 10, outline: "none", boxSizing: "border-box",
};
export const labelStyle: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 700,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Image dropzone backed by POST /uploads/photo, same flow as PhotoUploadField.
 * `onFile` receives the server-relative path (e.g. "/uploads/photos/x.png"),
 * NOT a data URL — inlining base64 here is what made GET /design-dispatches
 * return ~6.5MB per row and time out against Supabase's pooler.
 */
export function UploadZone({ label, hint, icon: Icon, preview, onFile }: {
  label: string; hint: string; icon: React.ElementType;
  preview: string | null; onFile: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local object URL wins while the upload is in flight so the user sees their
  // pick immediately; once it resolves, `preview` holds the stored path.
  const displayUrl = localPreview ?? resolveAssetUrl(preview);

  async function handleFile(file: File) {
    setError(null);
    if (!isAcceptedImageFile(file)) {
      setError(IMAGE_REJECTION_MESSAGE);
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      onFile(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload image. Please try again.");
      setLocalPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div
        onClick={() => { if (!uploading) inputRef.current?.click(); }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!uploading) inputRef.current?.click(); } }}
        style={{ height: 100, border: `2px dashed rgba(110,15,45,0.22)`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: uploading ? "wait" : "pointer", background: T.warmIvory, overflow: "hidden", position: "relative" }}
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
            <div style={{ position: "relative", zIndex: 1, background: "rgba(61,14,26,0.65)", borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <UploadSimple size={13} color={T.goldLight} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.goldLight, fontWeight: 600 }}>{uploading ? "Uploading…" : "Replace"}</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={T.taupe} />
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{hint}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>{uploading ? "Uploading…" : "Click to upload"}</span>
          </>
        )}
      </div>
      {error && <div style={{ fontFamily: F.ui, fontSize: 12, color: "#C0392B", marginTop: 6 }}>{error}</div>}
      <Input ref={inputRef} type="file" accept={IMAGE_ACCEPT_ATTR} className="hidden" onChange={e => {
        const file = e.target.files?.[0];
        if (file) void handleFile(file);
        e.target.value = "";
      }} />
    </div>
  );
}

export function DesignCodeCard({ design, onClose }: { design: DesignEntry; onClose: () => void }) {
  return (
    <Modal open onOpenChange={o => !o && onClose()} size="sm">
      <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "calc(100dvh - 96px)" }}>
        {design.colorSlipPhoto ? (
          <div style={{ height: 200, position: "relative", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", overflow: "hidden", flexShrink: 0 }}>
            <img src={design.colorSlipPhoto} alt={design.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(61,14,26,0.7) 0%, transparent 55%)" }} />
            <Dialog.Title asChild>
              <div style={{ position: "absolute", bottom: 16, left: 20, fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: T.goldLight, letterSpacing: "0.5px" }}>{design.code}</div>
            </Dialog.Title>
            <Dialog.Description className="sr-only">Design {design.code} preview</Dialog.Description>
            <Dialog.Close asChild>
              <IconButton label="Close" icon={PhX} variant="secondary" size="sm" shape="circle"
                className="absolute top-[14px] right-[14px] bg-[rgba(61,14,26,0.55)] text-white/85 border-none" />
            </Dialog.Close>
          </div>
        ) : (
          <div style={{ background: T.darkBurgundy, padding: "24px 24px 20px", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", position: "relative", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 8 }}>Design Code</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.antiqueGold, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "4px 10px" }}>{design.code}</span>
              <Dialog.Title asChild>
                <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#fff" }}>{design.name || design.code}</span>
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" icon={PhX} variant="secondary" size="sm" shape="circle"
                className="absolute top-[18px] right-[18px] bg-white/10 text-white/70 border-none" />
            </Dialog.Close>
          </div>
        )}

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
            {[
              { label: "Design Code", val: design.code,     entityType: "design" as const },
              { label: "Saree Type",  val: design.typeName || "—" },
              { label: "Type Code",   val: design.typeCode || "—" },
              { label: "Total Produced", val: design.total ? `${design.total.toLocaleString("en-IN")} sarees` : "—" },
            ].map(r => (
              <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{r.label}</div>
                {"entityType" in r && r.entityType ? (
                  <EntityCode type={r.entityType} value={r.val} />
                ) : (
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, fontVariantNumeric: "tabular-nums" }}>{r.val}</div>
                )}
              </div>
            ))}
          </div>

          {design.desc && (
            <div style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Description</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>{design.desc}</div>
            </div>
          )}

          {design.weaverName && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(30,102,64,0.06)", border: "1px solid rgba(30,102,64,0.18)", borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.goldLight }}>
                  {design.weaverName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Assigned Weaver</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{design.weaverName}</div>
              </div>
            </div>
          )}

          {design.notesForWeaver && (
            <div style={{ background: "rgba(200,155,71,0.07)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Notes for Weaver</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5E1A", lineHeight: 1.6 }}>{design.notesForWeaver}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: design.hasGraph ? "rgba(30,102,64,0.07)" : "rgba(200,155,71,0.09)", border: `1px solid ${design.hasGraph ? "rgba(30,102,64,0.20)" : "rgba(200,155,71,0.28)"}`, borderRadius: 10, padding: "11px 13px" }}>
              <Graph size={17} color={design.hasGraph ? T.green : "#8B6018"} />
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Design Graph</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: design.hasGraph ? T.green : "#8B6018" }}>
                  {design.hasGraph ? "Uploaded ✓" : "Not uploaded"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: design.hasColorSlip ? "rgba(30,102,64,0.07)" : "rgba(200,155,71,0.09)", border: `1px solid ${design.hasColorSlip ? "rgba(30,102,64,0.20)" : "rgba(200,155,71,0.28)"}`, borderRadius: 10, padding: "11px 13px" }}>
              <ImageSquare size={17} color={design.hasColorSlip ? T.green : "#8B6018"} />
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Color Slip</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: design.hasColorSlip ? T.green : "#8B6018" }}>
                  {design.hasColorSlip ? "Uploaded ✓" : "Not uploaded"}
                </div>
              </div>
            </div>
          </div>

          {design.designGraph && (
            <div style={{ borderRadius: 12, overflow: "hidden", height: 140 }}>
              <img src={design.designGraph} alt="Design Graph" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <Button onClick={onClose} variant="primary" size="lg" fullWidth>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function DesignCard({ d, onView, onSlip, onDispatch }: { d: DesignEntry; onView: (d: DesignEntry) => void; onSlip: (d: DesignEntry) => void; onDispatch: (code: string) => void }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.07)", display: "flex", flexDirection: "column", height: "100%" }}>
      {d.colorSlipPhoto ? (
        <div style={{ height: 148, overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <img src={d.colorSlipPhoto} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(61,14,26,0.45) 100%)" }} />
          <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6, background: "rgba(61,14,26,0.72)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "5px 10px" }}>
            <Hash size={13} color={T.goldLight} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.goldLight, letterSpacing: "0.4px" }}>{d.code}</span>
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: "rgba(255,253,249,0.18)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageSquare size={16} color="#FFFDF9" />
          </div>
        </div>
      ) : (
        <div style={{ height: 148, background: `linear-gradient(135deg, ${T.warmCream} 0%, #F0E4CE 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0, position: "relative" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageSquare size={28} color={T.taupe} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>Color Slip Not Uploaded</span>
          <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6, background: "rgba(139,112,96,0.14)", borderRadius: 8, padding: "5px 10px" }}>
            <Hash size={13} color={T.taupe} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.taupe }}>{d.code}</span>
          </div>
        </div>
      )}

      <div style={{ padding: "18px 18px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.25, marginBottom: 8 }}>{d.name || d.code}</div>

        {d.typeCode && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 8, padding: "5px 10px", marginBottom: 10, alignSelf: "flex-start" }}>
            <Swatches size={13} color={T.royalBurgundy} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{d.typeCode}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>· {d.typeName}</span>
          </div>
        )}

        {d.weaverName && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 5, padding: "2px 6px" }}>Weaver</span>
            {d.weaverName}
          </div>
        )}

        {d.desc && (
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6, marginBottom: 12 }}>{d.desc}</div>
        )}

        <div style={{ height: 1, background: T.borderDef, marginBottom: 12, marginTop: "auto" }} />

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", borderRadius: 10, padding: "10px 12px" }}>
            <Package size={18} color={T.royalBurgundy} />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{d.total.toLocaleString("en-IN")}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>total produced</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: d.hasGraph ? "rgba(30,102,64,0.07)" : "rgba(200,155,71,0.09)", border: `1px solid ${d.hasGraph ? "rgba(30,102,64,0.20)" : "rgba(200,155,71,0.28)"}`, borderRadius: 9, padding: "9px 13px", marginBottom: 14 }}>
          <Graph size={17} color={d.hasGraph ? T.green : "#8B6018"} />
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: d.hasGraph ? T.green : "#8B6018", flex: 1 }}>
            Design Graph: {d.hasGraph ? "Uploaded" : "Not uploaded yet"}
          </span>
          {d.hasGraph && <CheckCircle size={15} color={T.green} />}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 18px 18px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => onView(d)} variant="secondary" size="md" fullWidth>
            <PhEye size={15} /> View Design
          </Button>
          <Button onClick={() => onSlip(d)} variant="secondary" size="md" fullWidth>
            <UploadSimple size={15} />
            {d.hasColorSlip ? "Update Slip" : "Upload Slip"}
          </Button>
        </div>
        <Button onClick={() => onDispatch(d.code)} variant="primary" size="md" fullWidth>
          <PaperPlaneTilt size={15} color="#FFFDF9" /> Dispatch Design
        </Button>
      </div>
    </div>
  );
}
