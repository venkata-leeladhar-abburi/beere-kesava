import React, { useState } from "react";
import { motion } from "motion/react";
import { Scan, Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { C, F } from "../tokens";
import { Button, Input } from "../../../../../shared/ui/primitives";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const WORKER_NAME = "Ravi Kumar (WK-042)";

// ── Shared atoms ──────────────────────────────────────────────────────────────

export function SectionHeader({ icon, title, count, accent }: {
  icon: React.ReactNode; title: string; count?: number; accent?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: accent ?? "rgba(110,15,45,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{title}</div>
      </div>
      {count !== undefined && (
        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, background: "rgba(110,15,45,0.09)", color: C.burg, padding: "3px 9px", borderRadius: 999 }}>
          {count}
        </span>
      )}
    </div>
  );
}

// Barcode scanners act as keyboards — they type the code and submit — so this
// one input serves both a physical scanner and manual entry. It is
// autofocusable and keeps focus after each submit so a scanner can fire
// several codes back to back without anyone touching the keyboard.
export function ScanBar({ value, onChange, onSubmit, onDetected, label = "Scan Barcode", tone = "burgundy", inputRef }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void;
  /** Fired with the raw decoded text once the camera modal reads a barcode —
   *  the caller resolves it immediately (never through `value`, which
   *  wouldn't have updated yet inside the same event). */
  onDetected?: (text: string) => void;
  label?: string;
  tone?: "burgundy" | "green";
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleDetected = (text: string) => {
    setCameraOpen(false);
    onChange(text);
    onDetected?.(text);
  };

  return (
    <>
      <form
        onSubmit={e => { e.preventDefault(); onSubmit(); }}
        className="flex items-center gap-2 w-full min-w-0"
        role="search"
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type a saree ID, then press Enter"
          aria-label="Saree ID to scan"
          autoComplete="off"
          spellCheck={false}
          className="h-[38px] min-w-0 flex-1 font-mono text-xs"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          iconLeft={Camera}
          onClick={() => setCameraOpen(true)}
          className={`h-[38px] flex-shrink-0 rounded-[10px] text-xs px-3 whitespace-nowrap ${
            tone === "green" ? "bg-[#15603D] hover:bg-[#1E6640]" : "bg-[#3D0E1A] hover:bg-[#6E0F2D]"
          }`}
        >
          <span>{label}</span>
        </Button>
        {value.trim() !== "" && (
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            iconLeft={Scan}
            className="h-[38px] flex-shrink-0 rounded-[10px] text-xs px-3 whitespace-nowrap"
          >
            <span>Select</span>
          </Button>
        )}
      </form>
      <BarcodeScannerModal open={cameraOpen} onClose={() => setCameraOpen(false)} onDetected={handleDetected} />
    </>
  );
}

// Feedback line under the scan bar. Told apart by tone so "selected it" and
// "that saree isn't here" don't look identical.
export function ScanFeedback({ msg, tone }: { msg: string; tone: ScanTone }) {
  if (!msg) return null;
  const cfg = tone === "error"
    ? { bg: "rgba(192,57,43,0.07)", bd: "rgba(192,57,43,0.24)", fg: "#B03024", Icon: AlertCircle }
    : tone === "warn"
      ? { bg: "rgba(200,155,71,0.12)", bd: "rgba(200,155,71,0.32)", fg: "#8D5802", Icon: AlertCircle }
      : { bg: "rgba(30,102,64,0.07)", bd: "rgba(30,102,64,0.20)", fg: "#1F774E", Icon: CheckCircle2 };
  return (
    <div role="status" aria-live="polite"
      style={{ background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 10, padding: "8px 12px", fontFamily: F.u, fontSize: 12, fontWeight: 600, color: cfg.fg, display: "flex", alignItems: "center", gap: 7 }}>
      <cfg.Icon size={14} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: F.m }}>{msg}</span>
    </div>
  );
}

// ── Barcode scan ──────────────────────────────────────────────────────────────

// Resolves the id that was actually scanned against the sarees on screen. This
// previously ignored its input and picked a *random* candidate, so a worker
// pressing Scan could confirm a saree they never handled.
export function useScan(candidateIds: string[], onScanned: (id: string) => void) {
  const [scanValue, setScanValue] = useState("");
  const [scanMsg, setScanMsg] = useState("");

  const show = (msg: string) => { setScanMsg(msg); setTimeout(() => setScanMsg(""), 2500); };

  const submitScan = () => {
    const id = scanValue.trim();
    if (!id) return show("Scan a barcode or type a saree ID.");
    setScanValue("");
    const match = candidateIds.find(c => c.toLowerCase() === id.toLowerCase());
    if (!match) return show(`No saree "${id}" available to scan here.`);
    onScanned(match);
    show(`Scanned ${match}`);
  };

  return { scanMsg, scanValue, setScanValue, submitScan };
}

export type ScanTone = "ok" | "warn" | "error";

const normalizeId = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "");

/** Exact match wins; otherwise a single substring hit counts (so a worker can
 *  type just "B014-011" instead of the whole id). Several hits are ambiguous
 *  and are refused rather than guessed at. */
function resolveId(ids: string[], query: string): { match?: string; ambiguous?: string[] } {
  const q = normalizeId(query);
  const exact = ids.find(c => normalizeId(c) === q);
  if (exact) return { match: exact };
  const partial = ids.filter(c => normalizeId(c).includes(q));
  if (partial.length === 1) return { match: partial[0] };
  if (partial.length > 1) return { ambiguous: partial };
  return {};
}

/**
 * Scan / type-to-select for the finishing lists.
 *
 * The old hook only ever searched the *unselected, currently-visible* ids, so
 * scanning was dead the moment a grouping tab was open (nothing is visible
 * until you drill in), reported "not available" for a saree you had already
 * selected, and gave the same message for "no such saree" as for "hidden by
 * your filters". Each of those is now a distinct, actionable outcome, and a
 * saree hidden by a filter is revealed instead of refused.
 */
export function useSareeScan({
  visibleIds, allIds, selectedIds, onScanned, onReveal,
}: {
  /** Ids selectable right now, given the active filters/grouping. */
  visibleIds: string[];
  /** Every id this section knows about, filters ignored. */
  allIds: string[];
  /** Ids already ticked — scanning one again reports that, it isn't an error. */
  selectedIds?: Set<string>;
  onScanned: (id: string) => void;
  /** Called when the scanned saree exists but is filtered/grouped out of view;
   *  clear the filters here and the saree is then selected. */
  onReveal?: (id: string) => void;
}) {
  const [scanValue, setScanValue] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [scanTone, setScanTone] = useState<ScanTone>("ok");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback((msg: string, tone: ScanTone) => {
    setScanMsg(msg); setScanTone(tone);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setScanMsg(""), 4000);
  }, []);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const submitScan = (overrideValue?: string) => {
    const raw = (overrideValue ?? scanValue).trim();
    if (!raw) return show("Scan a barcode or type a saree ID first.", "warn");

    const visible = resolveId(visibleIds, raw);
    if (visible.match) {
      setScanValue("");
      if (selectedIds?.has(visible.match)) return show(`${visible.match} is already selected.`, "warn");
      onScanned(visible.match);
      return show(`Selected ${visible.match}`, "ok");
    }
    if (visible.ambiguous) {
      return show(`"${raw}" matches ${visible.ambiguous.length} sarees — type more of the ID.`, "warn");
    }

    // Not on screen: either filtered/grouped out, or genuinely not here.
    const anywhere = resolveId(allIds, raw);
    if (anywhere.match) {
      setScanValue("");
      if (onReveal) {
        onReveal(anywhere.match);
        return show(`${anywhere.match} was hidden by your filters — filters cleared and selected.`, "ok");
      }
      return show(`${anywhere.match} is hidden by the active filters. Clear them to select it.`, "warn");
    }
    if (anywhere.ambiguous) {
      return show(`"${raw}" matches ${anywhere.ambiguous.length} sarees — type more of the ID.`, "warn");
    }
    return show(`No saree matching "${raw}" in this list.`, "error");
  };

  /** Wired to ScanBar's `onDetected` — submits the decoded text directly,
   *  since the `value` prop hasn't caught up to it in the same event. */
  const submitDetected = (text: string) => {
    setScanValue(text);
    submitScan(text);
  };

  return { scanMsg, scanTone, scanValue, setScanValue, submitScan, submitDetected };
}

// ── Success toast ─────────────────────────────────────────────────────────────

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#FFF", padding: "12px 18px", borderRadius: 12, fontFamily: F.u, fontSize: 13, fontWeight: 600, zIndex: 400, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
      <CheckCircle2 size={15} color={C.gold} /> {msg}
    </motion.div>
  );
}
