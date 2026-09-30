import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, FileText, Image as ImageIcon, PackageX, ScanLine, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { STOPGAP_ACTING_USER_ID } from "@/shared/api/purchase-requests";
import { supplierDebitNotesApi, type ReturnableLine } from "@/shared/api/supplier-returns";
import { resolveAssetUrl } from "@/shared/api/uploads";
import { Button, Textarea } from "../../../../shared/ui/primitives";
import { CameraScannerModal } from "../../../../shared/ui/CameraScannerModal";
import { formatPaise, toPaise } from "../../../../lib/gst";
import { T, F } from "../externalPurchases/theme";
import { SectionCard } from "../externalPurchases/common/primitives";

const pieceKey = (lineId: string, pieceNo: number) => `${lineId}:${pieceNo}`;
const rupees = (n: number) => formatPaise(toPaise(n));
const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const describe = (l: ReturnableLine) => [l.sareeType, l.color].filter(Boolean).join(" · ") || "Saree";

interface Picked { line: ReturnableLine; pieceNo: number }

/**
 * Record Supplier Return — find sarees by scanning their tag (camera or a
 * USB scanner typing into the box), typing a piece / line code, or searching
 * invoice, supplier, type or colour. Every match shows its full details and
 * each piece's status; picked pieces collect in a return list, and raising it
 * creates one debit note per purchase (a note is always against one purchase).
 */
export function RecordSupplierReturnPanel({ onNoteRaised }: { onNoteRaised: (noteId: string) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<ReturnableLine[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [picked, setPicked] = useState<Map<string, Picked>>(new Map());
  const [reason, setReason] = useState("");
  const [raising, setRaising] = useState(false);
  const [raiseError, setRaiseError] = useState("");

  const addPiece = (line: ReturnableLine, pieceNo: number) =>
    setPicked(prev => new Map(prev).set(pieceKey(line.lineId, pieceNo), { line, pieceNo }));
  const removePiece = (lineId: string, pieceNo: number) =>
    setPicked(prev => { const next = new Map(prev); next.delete(pieceKey(lineId, pieceNo)); return next; });
  const togglePiece = (line: ReturnableLine, pieceNo: number) =>
    picked.has(pieceKey(line.lineId, pieceNo)) ? removePiece(line.lineId, pieceNo) : addPiece(line, pieceNo);

  const runLookup = async (raw: string, fromScan = false) => {
    const q = raw.trim();
    if (q.length < 2) { setLookupError("Type at least 2 characters, or scan a saree tag."); return; }
    setSearching(true);
    setLookupError("");
    try {
      const lines = await supplierDebitNotesApi.lookup(q);
      setResults(lines);
      setLastQuery(q);
      // A scanned tag names one piece — add it straight to the return list.
      const exact = lines.find(l => l.match === "PIECE" && l.matchedPieceNo);
      if (exact && exact.matchedPieceNo) {
        const piece = exact.pieces.find(p => p.pieceNo === exact.matchedPieceNo)!;
        if (!exact.supplier) toast.error(`${piece.code} was bought from an unregistered supplier — it can't be returned here.`);
        else if (piece.status === "RETURNED") toast.error(`${piece.code} has already been returned to the supplier.`);
        else if (piece.status === "PENDING") toast.error(`${piece.code} is already on pending debit note ${piece.debitNoteId ?? ""}.`);
        else if (picked.has(pieceKey(exact.lineId, piece.pieceNo))) toast.info(`${piece.code} is already in the return list.`);
        else { addPiece(exact, piece.pieceNo); toast.success(`${piece.code} added to the return list`); }
        setQuery("");
      } else if (lines.length === 0 && fromScan) {
        toast.error(`No saree found for "${q}".`);
      }
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed. Please try again.");
    } finally {
      setSearching(false);
      inputRef.current?.focus();
    }
  };

  // One debit note per purchase.
  const groups = useMemo(() => {
    const byPurchase = new Map<string, { line: ReturnableLine; items: Picked[] }>();
    for (const p of picked.values()) {
      const g = byPurchase.get(p.line.purchase.id) ?? { line: p.line, items: [] };
      g.items.push(p);
      byPurchase.set(p.line.purchase.id, g);
    }
    for (const g of byPurchase.values()) g.items.sort((a, b) => a.line.lineCode.localeCompare(b.line.lineCode) || a.pieceNo - b.pieceNo);
    return [...byPurchase.values()];
  }, [picked]);
  const totalValue = useMemo(() => [...picked.values()].reduce((s, p) => s + p.line.price, 0), [picked]);

  const raise = async () => {
    if (groups.length === 0) return;
    setRaising(true);
    setRaiseError("");
    const requestedById = user?.id ?? STOPGAP_ACTING_USER_ID;
    const raised: string[] = [];
    const failed: string[] = [];
    for (const g of groups) {
      const byLine = new Map<string, number[]>();
      for (const it of g.items) byLine.set(it.line.lineId, [...(byLine.get(it.line.lineId) ?? []), it.pieceNo]);
      try {
        const note = await supplierDebitNotesApi.create(
          {
            purchaseId: g.line.purchase.id,
            lines: [...byLine].map(([sareeLineId, pieceNos]) => ({ sareeLineId, pieceNos })),
            reason: reason.trim() || undefined,
          },
          requestedById,
        );
        raised.push(note.id);
        // Drop just this purchase's pieces, so a failure elsewhere keeps its own for a retry.
        setPicked(prev => {
          const next = new Map(prev);
          for (const it of g.items) next.delete(pieceKey(it.line.lineId, it.pieceNo));
          return next;
        });
      } catch (err) {
        failed.push(`${g.line.purchase.id}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }
    setRaising(false);
    if (raised.length) {
      void qc.invalidateQueries({ queryKey: ["supplier-debit-notes"] });
      void qc.invalidateQueries({ queryKey: ["supplier-returns"] });
      void qc.invalidateQueries({ queryKey: ["suppliers", "purchases"] });
      toast.success(raised.length === 1 ? `Debit note ${raised[0]} raised` : `${raised.length} debit notes raised`, {
        description: "Sent to an admin for approval.",
      });
      setResults(null);
      setLastQuery("");
      if (failed.length === 0) setReason("");
      onNoteRaised(raised[0]);
    }
    if (failed.length) setRaiseError(failed.join("\n"));
  };

  return (
    <SectionCard
      icon={ScanLine}
      title="Record Supplier Return"
      subtitle="Scan a saree tag, or enter its code, invoice, supplier, type or colour. Pick the pieces going back and raise the debit note."
    >
      {/* ── Find ── */}
      <form
        onSubmit={e => { e.preventDefault(); void runLookup(query); }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="flex-1 relative">
          <ScanLine size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Scan tag or type saree code, e.g. SABO-3850-001-02"
            aria-label="Saree code or search"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-12 rounded-xl border pl-11 pr-3 outline-none focus:ring-2"
            style={{ fontFamily: "var(--font-mono)", fontSize: 14, borderColor: "var(--border-default)", background: "#FFF", color: T.luxuryBrown }}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" iconLeft={Search} disabled={searching} className="h-12 rounded-xl flex-1 sm:flex-none">
            {searching ? "Finding…" : "Find"}
          </Button>
          <Button type="button" variant="secondary" iconLeft={Camera} onClick={() => setScannerOpen(true)} className="h-12 rounded-xl flex-1 sm:flex-none">
            Scan
          </Button>
        </div>
      </form>
      {lookupError && <div role="alert" style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.crimson }}>{lookupError}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 mt-5">
        {/* ── Results ── */}
        <div className="min-w-0 flex flex-col gap-3">
          {results === null ? (
            <Hint icon={ScanLine} title="Nothing looked up yet" body="Scanning a tag adds that piece straight to the return list. Searching shows every matching saree so you can pick pieces." />
          ) : results.length === 0 ? (
            <Hint icon={PackageX} title={`No sarees match "${lastQuery}"`} body="Check the code on the tag, or search by invoice number or supplier instead." />
          ) : (
            <>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                {results.length} saree line{results.length === 1 ? "" : "s"} for <b style={{ color: T.luxuryBrown }}>"{lastQuery}"</b>
                {results.length >= 25 && " — showing the first 25, narrow the search for more"}
              </div>
              {results.map(line => (
                <LineCard key={line.lineId} line={line} picked={picked} onToggle={togglePiece}
                  onAddAll={() => line.pieces.filter(p => p.status === "AVAILABLE").forEach(p => addPiece(line, p.pieceNo))} />
              ))}
            </>
          )}
        </div>

        {/* ── Return list ── */}
        <aside className="xl:sticky xl:top-4 self-start w-full rounded-2xl border overflow-hidden" style={{ borderColor: T.borderDef, background: T.silkCream }}>
          <div style={{ background: T.darkBurgundy, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: "#FFFDF9" }}>Return list</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.goldLight }}>
              {picked.size} pc{picked.size === 1 ? "" : "s"} · {rupees(totalValue)}
            </span>
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", padding: "18px 6px" }}>
                No pieces yet. Scan a tag or tick pieces from the results.
              </div>
            ) : groups.map(g => {
              const value = g.items.reduce((s, it) => s + it.line.price, 0);
              return (
                <div key={g.line.purchase.id} style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{g.line.supplier?.name}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe, overflowWrap: "anywhere" }}>
                        {g.line.purchase.id}{g.line.purchase.invoiceNumber ? ` · Inv ${g.line.purchase.invoiceNumber}` : ""}
                      </div>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, whiteSpace: "nowrap" }}>{rupees(value)}</div>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    {g.items.map(it => {
                      const code = it.line.pieces[it.pieceNo - 1]?.code ?? `${it.line.lineCode}-${it.pieceNo}`;
                      return (
                        <li key={code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderTop: `1px dashed ${T.borderDef}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{code}</div>
                            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{describe(it.line)} · {rupees(it.line.price)}</div>
                          </div>
                          <button type="button" onClick={() => removePiece(it.line.lineId, it.pieceNo)} aria-label={`Remove ${code}`}
                            style={{ background: "none", border: 0, padding: 6, cursor: "pointer", color: T.taupe, borderRadius: 6 }}>
                            <X size={15} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {groups.length > 1 && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", background: "rgba(200,155,71,0.12)", borderRadius: 8, padding: "8px 10px" }}>
                These pieces come from {groups.length} purchases — one debit note will be raised for each.
              </div>
            )}

            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for return (e.g. colour mismatch, damaged border)" rows={2} />

            {raiseError && (
              <div role="alert" style={{ whiteSpace: "pre-line", fontFamily: F.ui, fontSize: 12, color: T.crimson, background: T.crimsonBg, borderRadius: 8, padding: "8px 10px" }}>
                {raiseError}
              </div>
            )}

            <Button variant="primary" iconLeft={FileText} fullWidth disabled={raising || picked.size === 0} onClick={() => void raise()} className="rounded-[10px]">
              {raising ? "Raising…" : groups.length > 1
                ? `Raise ${groups.length} Debit Notes · ${picked.size} pcs`
                : `Raise Debit Note · ${picked.size} pc${picked.size === 1 ? "" : "s"}`}
            </Button>
            {picked.size > 0 && (
              <Button variant="ghost" iconLeft={Trash2} fullWidth disabled={raising} onClick={() => setPicked(new Map())} className="rounded-[10px]">
                Clear list
              </Button>
            )}
          </div>
        </aside>
      </div>

      <CameraScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={text => { setScannerOpen(false); setQuery(text); void runLookup(text, true); }}
        title="Scan Saree Tag"
        accentColor={T.royalBurgundy}
      />
    </SectionCard>
  );
}

function Hint({ icon: Icon, title, body }: { icon: typeof ScanLine; title: string; body: string }) {
  return (
    <div style={{ border: `1px dashed ${T.borderGold}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", background: "#FFFDF9" }}>
      <Icon size={26} color={T.antiqueGold} style={{ margin: "0 auto 8px" }} />
      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4, maxWidth: "min(420px, 100%)", marginInline: "auto" }}>{body}</div>
    </div>
  );
}

const PIECE_STYLE = {
  AVAILABLE: { label: "In stock", color: "#1E6640" },
  PENDING: { label: "On pending note", color: "#8B6018" },
  RETURNED: { label: "Returned", color: "#69635E" },
} as const;

function LineCard({ line, picked, onToggle, onAddAll }: {
  line: ReturnableLine;
  picked: Map<string, Picked>;
  onToggle: (line: ReturnableLine, pieceNo: number) => void;
  onAddAll: () => void;
}) {
  const photo = resolveAssetUrl(line.imageUrl);
  const counts = { AVAILABLE: 0, PENDING: 0, RETURNED: 0 };
  line.pieces.forEach(p => { counts[p.status]++; });
  const returnable = !!line.supplier;
  const allPicked = line.pieces.filter(p => p.status === "AVAILABLE").every(p => picked.has(pieceKey(line.lineId, p.pieceNo)));

  const facts: [string, string][] = [
    ["Supplier", line.supplierName ?? "—"],
    ["Purchase", line.purchase.id],
    ["Invoice", line.purchase.invoiceNumber ?? "—"],
    ["Bought on", formatDate(line.purchase.date)],
    ["Buying price", rupees(line.price)],
    ["Weight", line.weight || "—"],
  ];

  return (
    <div style={{ background: "#FFF", border: `1px solid ${line.match === "PIECE" ? T.antiqueGold : T.borderDef}`, borderRadius: 14, padding: 14 }}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div style={{ width: 96, height: 120, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: T.silkCream, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.borderDef}` }}>
          {photo ? <img src={photo} alt={line.lineCode} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={22} color={T.taupe} />}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{line.lineCode}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, marginTop: 2 }}>{describe(line)}</div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
              {line.quantity} pcs · <span style={{ color: PIECE_STYLE.AVAILABLE.color, fontWeight: 600 }}>{counts.AVAILABLE} in stock</span>
              {counts.PENDING > 0 && ` · ${counts.PENDING} pending`}
              {counts.RETURNED > 0 && ` · ${counts.RETURNED} returned`}
            </div>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5" style={{ marginTop: 10 }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <dt style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.taupe }}>{k}</dt>
                <dd style={{ margin: 0, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, overflowWrap: "anywhere" }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {!returnable ? (
        <div style={{ marginTop: 12, fontFamily: F.ui, fontSize: 12, color: T.crimson, background: T.crimsonBg, borderRadius: 8, padding: "8px 10px" }}>
          Bought from an unregistered supplier — a debit note can't be raised for it.
        </div>
      ) : (
        <div style={{ marginTop: 12, borderTop: `1px solid ${T.borderDef}`, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>Pieces</span>
            {counts.AVAILABLE > 0 && !allPicked && (
              <button type="button" onClick={onAddAll} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "none", border: 0, cursor: "pointer" }}>
                Add all {counts.AVAILABLE} in stock
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {line.pieces.map(p => {
              const isPicked = picked.has(pieceKey(line.lineId, p.pieceNo));
              const available = p.status === "AVAILABLE";
              const scanned = line.matchedPieceNo === p.pieceNo;
              return (
                <button
                  key={p.pieceNo}
                  type="button"
                  disabled={!available}
                  aria-pressed={isPicked}
                  onClick={() => onToggle(line, p.pieceNo)}
                  title={available ? (isPicked ? "In the return list — click to remove" : "Add to the return list") : p.status === "PENDING" ? `On pending debit note ${p.debitNoteId ?? ""}` : "Already returned"}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, padding: "6px 10px", borderRadius: 8,
                    cursor: available ? "pointer" : "not-allowed",
                    border: `1.5px solid ${isPicked ? T.royalBurgundy : scanned ? T.antiqueGold : T.borderDef}`,
                    background: isPicked ? T.royalBurgundy : available ? "#FFF" : "#F4F1EC",
                    color: isPicked ? "#FFF" : PIECE_STYLE[p.status].color,
                    textDecoration: p.status === "RETURNED" ? "line-through" : undefined,
                  }}
                >
                  {p.code}
                  {!available && <span style={{ fontFamily: F.ui, fontSize: 10, marginLeft: 6 }}>{PIECE_STYLE[p.status].label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
