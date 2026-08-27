import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown, ChevronRight, Truck, Camera, ImagePlus, X, Loader2, Search, RotateCcw,
} from "lucide-react";

import { C, F, Chip } from "./theme";
import {
  Stepper, StepHeader, StepBody, FlowActions, SummaryPanel, ConsequenceNote,
  ACCENT_WHOLESALE, type FlowStep, type SummaryRow,
} from "./flow-kit";
import { Button, Combobox, Input, Textarea } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { dispatchApi, type BackendDispatchRecord } from "../../../../shared/api/dispatch";
import { salesApi } from "../../../../shared/api/sales";
import { scanApi } from "../../../../shared/api/scan";
import { uploadsApi, resolveAssetUrl } from "@/shared/api/uploads";
import { ApiError } from "@/shared/api/client";
import { rupees, formatMoney } from "@/lib/domain/money";
import { WS_RETURN_REASONS } from "./wholesale-return-draft";

/**
 * A wholesale buyer sending back part of a consignment WE dispatched to them.
 *
 * This is the path that should be used whenever we have a record of the goods
 * going out, and it is the opposite of the untracked form next to it: nothing
 * is typed from a description, because the dispatch already knows which sarees
 * went where and at what price. The operator picks the buyer, picks the
 * consignment, ticks the pieces, and says why each one came back.
 *
 * Self-contained on purpose — it owns its own three steps and hands the parent
 * only the finished result, so the parent does not have to thread a dozen more
 * pieces of state through the wholesale flow.
 */

export interface ConsignmentReturnResult {
  sareeId: string;
  returnRef: string;
  refundAmount: number;
  sareeTypeLabel: string | null;
}

interface VendorOption {
  id: string;
  name: string;
  city: string | null;
}

/** What the operator is recording about one returned piece. */
interface PieceDraft {
  reason: string;
  reasonNote: string;
  photoUrl: string | null;
  photoPreview: string | null;
  photoUploading: boolean;
  photoError: string | null;
}

const emptyPiece = (): PieceDraft => ({
  reason: "",
  reasonNote: "",
  photoUrl: null,
  photoPreview: null,
  photoUploading: false,
  photoError: null,
});

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** How a consignment is named — the invoice if one was raised, else the LR. */
const consignmentLabel = (d: BackendDispatchRecord): string =>
  d.invoiceNumber
    ? `Invoice ${d.invoiceNumber}`
    : d.lrNumber
      ? `LR ${d.lrNumber}`
      : d.bulkOrderRef
        ? `Order ${d.bulkOrderRef}`
        : `Dispatch ${fmtDate(d.dispatchDate)}`;

/** A piece is only complete once it says why it came back. */
const pieceProblem = (p: PieceDraft): string | null => {
  if (!p.reason) return "Pick a return reason";
  if (p.reason === "Other" && !p.reasonNote.trim()) return "Describe the reason";
  if (p.photoUploading) return "Wait for the photo to finish uploading";
  return null;
};

function PhotoField({ piece, onChange, idBase }: {
  piece: PieceDraft;
  onChange: (patch: Partial<PieceDraft>) => void;
  idBase: string;
}) {
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  // Uploaded straight away so the return is saved with a real photoUrl rather
  // than a preview that dies with the component.
  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      onChange({ photoError: "Photo must be a JPG or PNG image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onChange({ photoError: "Photo must be under 5MB." });
      return;
    }
    onChange({ photoError: null, photoPreview: URL.createObjectURL(file), photoUploading: true });
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      onChange({ photoUrl: url, photoUploading: false });
    } catch (err) {
      onChange({
        photoError: err instanceof ApiError ? err.message : "Could not upload photo. Please try again.",
        photoPreview: null,
        photoUploading: false,
      });
    }
  };

  const preview = piece.photoPreview ?? resolveAssetUrl(piece.photoUrl);

  return (
    <div>
      <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted, display: "block", marginBottom: 6 }}>
        Photo of the saree <span style={{ opacity: 0.75 }}>(optional)</span>
      </span>
      <input ref={cameraInputRef} id={`${idBase}-cam`} aria-label="Take a photo of the saree" type="file" accept="image/png,image/jpeg" capture="environment" onChange={handleSelect} style={{ display: "none" }} />
      <input ref={galleryInputRef} id={`${idBase}-gal`} aria-label="Choose a photo of the saree from the gallery" type="file" accept="image/png,image/jpeg" onChange={handleSelect} style={{ display: "none" }} />

      {preview ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={preview}
            alt="Condition of the returned saree"
            style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.bdr}` }}
          />
          {piece.photoUploading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <Loader2 size={14} className="animate-spin" /> Uploading…
            </span>
          ) : (
            <Button
              variant="tertiary" size="sm" iconLeft={X}
              onClick={() => onChange({ photoUrl: null, photoPreview: null, photoError: null })}
              className="text-[13px] text-[#C0392B]"
            >
              Remove photo
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          <Button variant="secondary" size="sm" iconLeft={Camera} onClick={() => cameraInputRef.current?.click()} className="rounded-xl border-dashed">
            Take photo
          </Button>
          <Button variant="secondary" size="sm" iconLeft={ImagePlus} onClick={() => galleryInputRef.current?.click()} className="rounded-xl border-dashed">
            Choose from gallery
          </Button>
        </div>
      )}
      {piece.photoError && (
        <div role="alert" style={{ fontFamily: F.u, fontSize: 12.5, color: "#C0392B", marginTop: 6 }}>{piece.photoError}</div>
      )}
    </div>
  );
}

export function ProcessReturnWholesaleConsignment({
  vendors, vendorsLoading, onBackToType, onDone,
}: {
  vendors: VendorOption[];
  vendorsLoading: boolean;
  onBackToType: () => void;
  onDone: (vendorName: string, results: ConsignmentReturnResult[]) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerId, setCustomerId] = useState("");
  const [dispatchId, setDispatchId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [pieces, setPieces] = useState<Record<string, PieceDraft>>({});
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorName = vendors.find(v => v.id === customerId)?.name ?? "";

  const { data: dispatchRes, isLoading: dispatchesLoading, isError: dispatchesError, error: dispatchesErrorObj, refetch: refetchDispatches } = useQuery({
    queryKey: ["wholesale-dispatches-return"],
    queryFn: () => dispatchApi.list(200),
  });

  // Everything we ever sent this buyer, newest consignment first.
  const consignments = useMemo(() => {
    if (!customerId) return [];
    return (dispatchRes?.items ?? [])
      .filter(d => d.type === "WHOLESALE" && d.customerId === customerId)
      .sort((a, b) => new Date(b.dispatchDate).getTime() - new Date(a.dispatchDate).getTime());
  }, [dispatchRes, customerId]);

  const openDispatch = consignments.find(d => d.id === dispatchId) ?? null;
  const pricePerSaree = openDispatch?.pricePerSaree != null ? Number(openDispatch.pricePerSaree) : 0;

  // Descriptive detail for the pieces on the open consignment. The dispatch
  // record only stores saree ids, so the type/design/weaver are looked up —
  // one request per piece, in parallel, and only for the consignment actually
  // opened. Failure is not fatal: the row still shows its id and price.
  const sareeIds = useMemo(() => (openDispatch?.sarees ?? []).map(s => s.sareeId), [openDispatch]);
  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ["dispatch-saree-details", dispatchId],
    enabled: sareeIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(sareeIds.map(async id => {
        try {
          return await scanApi.lookup(id);
        } catch {
          return null;
        }
      }));
      return new Map(results.filter(Boolean).map(r => [r!.sareeId, r!]));
    },
  });

  const typeTextOf = useCallback((sareeId: string): string => {
    const d = details?.get(sareeId);
    if (!d?.sareeType) return "—";
    return `${d.sareeType.code} · ${d.sareeType.type}`;
  }, [details]);

  interface Row { sareeId: string }
  const rows: Row[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sareeIds
      .map(sareeId => ({ sareeId }))
      .filter(r => !q
        || r.sareeId.toLowerCase().includes(q)
        || typeTextOf(r.sareeId).toLowerCase().includes(q));
  }, [sareeIds, search, typeTextOf]);

  const columns: ColumnDef<Row>[] = useMemo(() => [
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: r => r.sareeId,
      cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: "#845E04" }}>{r.sareeId}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", priority: 1, sortable: true,
      accessor: r => typeTextOf(r.sareeId),
      cell: (_v, r) => {
        const d = details?.get(r.sareeId);
        return (
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
            {d?.sareeType
              ? <>
                  <span style={{ fontFamily: F.m, color: C.burg }}>{d.sareeType.code}</span>
                  <span style={{ color: C.muted }}> · {d.sareeType.type}</span>
                </>
              : <span style={{ color: C.muted }}>{detailsLoading ? "Loading…" : "—"}</span>}
          </span>
        );
      },
    },
    {
      id: "design", header: "Design", priority: 3, sortable: true,
      accessor: r => details?.get(r.sareeId)?.design?.code ?? "—",
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{details?.get(r.sareeId)?.design?.code ?? "—"}</span>,
    },
    {
      id: "weaver", header: "Weaver / Loom", priority: 3, sortable: true,
      accessor: r => {
        const d = details?.get(r.sareeId);
        return d?.weaver?.name ?? (d?.factoryLoom ? `Loom ${d.factoryLoom.code ?? d.factoryLoom.loomNumber}` : "—");
      },
      cell: (_v, r) => {
        const d = details?.get(r.sareeId);
        return <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{d?.weaver?.name ?? (d?.factoryLoom ? `Loom ${d.factoryLoom.code ?? d.factoryLoom.loomNumber}` : "—")}</span>;
      },
    },
    {
      id: "price", header: "Billed At", type: "currency", priority: 1, sortable: true,
      accessor: () => pricePerSaree,
      cell: () => pricePerSaree > 0
        ? <span style={{ fontFamily: F.m, fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums" }}>{formatMoney(rupees(pricePerSaree))}</span>
        : <span style={{ color: C.muted }} title="No per-saree price on this consignment">—</span>,
    },
  ], [details, detailsLoading, pricePerSaree, typeTextOf]);

  const pickedList = [...picked];
  const patchPiece = (sareeId: string, patch: Partial<PieceDraft>) =>
    setPieces(prev => ({ ...prev, [sareeId]: { ...(prev[sareeId] ?? emptyPiece()), ...patch } }));

  const firstProblem = pickedList
    .map(id => ({ id, problem: pieceProblem(pieces[id] ?? emptyPiece()) }))
    .find(p => p.problem);

  const refundTotal = pickedList.length * pricePerSaree;

  const steps: FlowStep[] = [
    {
      label: "Consignment",
      summary: openDispatch && picked.size > 0
        ? `${consignmentLabel(openDispatch)} · ${picked.size} saree${picked.size === 1 ? "" : "s"}`
        : vendorName || undefined,
    },
    { label: "Condition & Reason" },
    { label: "Review & Confirm" },
  ];

  const confirm = async () => {
    if (submitting || !dispatchId || pickedList.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const records = await salesApi.registerDispatchedReturns({
        dispatchId,
        items: pickedList.map(sareeId => {
          const p = pieces[sareeId] ?? emptyPiece();
          return {
            sareeId,
            reason: p.reason,
            reasonNote: p.reasonNote.trim() || undefined,
            photoUrl: p.photoUrl ?? undefined,
          };
        }),
      });
      const refBySaree = new Map(records.map(r => [r.sareeId, r.returnRef]));
      onDone(vendorName, pickedList.map(sareeId => ({
        sareeId,
        returnRef: refBySaree.get(sareeId) ?? "—",
        refundAmount: pricePerSaree,
        sareeTypeLabel: typeTextOf(sareeId) === "—" ? null : typeTextOf(sareeId),
      })));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not record this return: ${err.message}`
          : "Could not record this return.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Stepper steps={steps} current={step} accent={ACCENT_WHOLESALE} onJump={n => setStep(n as 1 | 2 | 3)} />

      {/* ── Step 1 — buyer → consignment → pieces ── */}
      {step === 1 && (
        <>
          <StepBody>
            <StepHeader
              title="Which consignment is coming back?"
              subtitle="Pick the wholesale buyer, open the consignment we sent them, and tick the sarees they are returning."
            />

            <div style={{ marginBottom: 22 }}>
              <label htmlFor="wsc-vendor" style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8 }}>
                Wholesale buyer <span style={{ color: "#AB3832" }}>*</span>
              </label>
              <Combobox
                options={vendors.map(v => ({ value: v.id, label: v.city ? `${v.name} · ${v.city}` : v.name }))}
                value={customerId}
                onValueChange={id => {
                  setCustomerId(id);
                  setDispatchId(null);
                  setPicked(new Set());
                  setPieces({});
                }}
                size="lg"
                className="w-full"
                placeholder={vendorsLoading ? "Loading wholesale customers…" : "Search or select a wholesale buyer"}
                searchPlaceholder="Type a name to search…"
                emptyMessage="No wholesale customer by that name"
              />
            </div>

            {customerId && dispatchesLoading && <LoadingState variant="skeleton" rows={3} />}

            {customerId && !dispatchesLoading && dispatchesError && (
              <ErrorState error={dispatchesErrorObj} onRetry={() => void refetchDispatches()} />
            )}

            {customerId && !dispatchesLoading && !dispatchesError && consignments.length === 0 && (
              <EmptyState
                icon="goodsReceipt"
                title={`Nothing has been dispatched to ${vendorName} yet`}
                description="Only sarees we actually sent to this buyer can come back this way. If the piece has no record with us, use ‘Not in our records’ instead."
              />
            )}

            {/* Their consignments, newest first — one collapsible block each. */}
            {consignments.map(d => {
              const open = d.id === dispatchId;
              const price = d.pricePerSaree != null ? Number(d.pricePerSaree) : 0;
              return (
                <div key={d.id} style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => {
                      // Switching consignment abandons the current pick —
                      // one return covers one consignment.
                      setDispatchId(open ? null : d.id);
                      setPicked(new Set());
                      setPieces({});
                      setSearch("");
                    }}
                    style={{
                      width: "100%", textAlign: "left", cursor: "pointer",
                      background: open ? "rgba(200,155,71,0.10)" : "rgba(200,155,71,0.05)",
                      border: `1px solid ${open ? "rgba(200,155,71,0.45)" : C.bdr}`,
                      borderRadius: open ? "14px 14px 0 0" : 14, padding: "12px 14px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    {open ? <ChevronDown size={16} color="#845E04" /> : <ChevronRight size={16} color="#845E04" />}
                    <Truck size={16} color="#845E04" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>
                        {consignmentLabel(d)}
                        <span style={{ fontWeight: 500, color: C.muted }}> · {d.sarees.length} saree{d.sarees.length === 1 ? "" : "s"}</span>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                        Dispatched {fmtDate(d.dispatchDate)}
                        {d.bulkOrderRef ? ` · ${d.bulkOrderRef}` : ""}
                        {d.transportCompany ? ` · ${d.transportCompany}` : ""}
                      </div>
                    </div>
                    {price > 0 && (
                      <Chip label={`${formatMoney(rupees(price))} each`} color="#845E04" bg="rgba(200,155,71,0.16)" />
                    )}
                  </button>

                  {open && (
                    <div style={{ border: `1px solid rgba(200,155,71,0.45)`, borderTop: "none", borderRadius: "0 0 14px 14px", background: C.white, padding: 12 }}>
                      <div style={{ marginBottom: 10 }}>
                        <Input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search this consignment by Saree ID or saree type"
                          iconLeft={Search}
                          size="lg"
                          containerClassName="rounded-xl h-12"
                        />
                      </div>
                      <DataTable
                        columns={columns}
                        data={rows}
                        getRowId={r => r.sareeId}
                        caption={`Sarees on ${consignmentLabel(d)}`}
                        density="compact"
                        responsive
                        isFiltered={search.trim() !== ""}
                        onClearFilters={() => setSearch("")}
                        emptyTitle="No sarees match"
                        emptyDescription="Nothing on this consignment matches that search."
                        selectedIds={picked}
                        onSelectionChange={ids => {
                          setPicked(ids);
                          // Open a draft for every newly ticked piece so the
                          // next step has something to fill in.
                          setPieces(prev => {
                            const next = { ...prev };
                            ids.forEach(id => { if (!next[id]) next[id] = emptyPiece(); });
                            Object.keys(next).forEach(id => { if (!ids.has(id)) delete next[id]; });
                            return next;
                          });
                        }}
                      />
                      {picked.size > 0 && (
                        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(200,155,71,0.10)", borderRadius: 10, fontFamily: F.u, fontSize: 13, color: C.text }}>
                          <strong>{picked.size}</strong> saree{picked.size === 1 ? "" : "s"} selected
                          {price > 0 && <> · credit of <strong>{formatMoney(rupees(picked.size * price))}</strong></>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </StepBody>
          <FlowActions
            accent={ACCENT_WHOLESALE}
            backLabel="Change return type"
            onBack={onBackToType}
            primaryLabel={picked.size > 1 ? `Next — Condition (${picked.size} sarees)` : "Next — Condition"}
            onPrimary={() => setStep(2)}
            primaryDisabled={picked.size === 0}
            hint={!customerId
              ? "Pick the wholesale buyer first"
              : !dispatchId
                ? "Open the consignment the sarees came back from"
                : picked.size === 0 ? "Tick at least one saree" : undefined}
          />
        </>
      )}

      {/* ── Step 2 — why each piece came back, and what it looks like ── */}
      {step === 2 && (
        <>
          <StepBody>
            <StepHeader
              title="Why did each saree come back?"
              subtitle="A reason is recorded against every piece. Add a photo where the condition matters — it is the only visual record we keep."
            />
            {pickedList.map((sareeId, i) => {
              const piece = pieces[sareeId] ?? emptyPiece();
              const problem = pieceProblem(piece);
              return (
                <div
                  key={sareeId}
                  style={{
                    border: `1px solid ${problem ? "rgba(192,57,43,0.28)" : "rgba(200,155,71,0.35)"}`,
                    borderRadius: 16, background: C.white, marginBottom: 16, overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(200,155,71,0.10)", borderBottom: "1px solid rgba(200,155,71,0.30)" }}>
                    <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.4, color: "#845E04", fontWeight: 700, textTransform: "uppercase" as const }}>
                      Saree {i + 1} of {pickedList.length}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{sareeId}</span>
                  </div>

                  <div style={{ padding: 16 }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 14 }}>
                      {typeTextOf(sareeId)}
                      {pricePerSaree > 0 && <> · billed at {formatMoney(rupees(pricePerSaree))}</>}
                    </div>

                    <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8 }}>
                      Return reason <span style={{ color: "#AB3832" }}>*</span>
                    </span>
                    <div role="radiogroup" aria-label={`Return reason for ${sareeId}`} style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 14 }}>
                      {WS_RETURN_REASONS.map(r => {
                        const on = piece.reason === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => patchPiece(sareeId, { reason: r })}
                            style={{
                              padding: "7px 15px", borderRadius: 999, cursor: "pointer",
                              border: `1px solid ${on ? "#845E04" : C.bdr}`,
                              background: on ? "rgba(200,155,71,0.16)" : "transparent",
                              color: on ? "#845E04" : C.muted,
                              fontFamily: F.u, fontSize: 13, fontWeight: 600,
                            }}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>

                    {piece.reason === "Other" && (
                      <div style={{ marginBottom: 14 }}>
                        <label htmlFor={`wsc-${sareeId}-note`} style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8 }}>
                          Describe the reason <span style={{ color: "#AB3832" }}>*</span>
                        </label>
                        <Textarea
                          id={`wsc-${sareeId}-note`}
                          value={piece.reasonNote}
                          onChange={e => patchPiece(sareeId, { reasonNote: e.target.value })}
                          placeholder="What did the buyer say? This is stored with the return."
                          rows={2}
                          className="w-full resize-none"
                        />
                      </div>
                    )}

                    <PhotoField piece={piece} idBase={`wsc-${sareeId}`} onChange={patch => patchPiece(sareeId, patch)} />

                    {problem && (
                      <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 12.5, color: "#C0392B" }}>
                        {problem}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </StepBody>
          <FlowActions
            accent={ACCENT_WHOLESALE}
            onBack={() => setStep(1)}
            primaryLabel="Next — Review"
            onPrimary={() => setStep(3)}
            primaryDisabled={!!firstProblem}
            hint={firstProblem ? `${firstProblem.id}: ${firstProblem.problem}` : undefined}
          />
        </>
      )}

      {/* ── Step 3 — review & confirm ── */}
      {step === 3 && openDispatch && (
        <>
          <StepBody>
            <StepHeader
              title="Review & confirm return"
              subtitle="Check every piece before committing — this credits the buyer and takes the sarees back into our records."
            />
            <SummaryPanel
              title="Consignment return"
              accent={ACCENT_WHOLESALE}
              rows={([
                { label: "Wholesale buyer", value: vendorName },
                { label: "Consignment", value: consignmentLabel(openDispatch) },
                { label: "Dispatched on", value: fmtDate(openDispatch.dispatchDate) },
                ...(openDispatch.bulkOrderRef ? [{ label: "Bulk order", value: openDispatch.bulkOrderRef, mono: true }] : []),
                { label: "Sarees returned", value: `${pickedList.length} of ${openDispatch.sarees.length}` },
                ...(pricePerSaree > 0 ? [{ label: "Billed per saree", value: formatMoney(rupees(pricePerSaree)), mono: true }] : []),
                { label: "Total credit", value: formatMoney(rupees(refundTotal)), mono: true, emphasis: true },
              ] as SummaryRow[])}
              footer={
                <div>
                  {pickedList.map(sareeId => {
                    const piece = pieces[sareeId] ?? emptyPiece();
                    const preview = piece.photoPreview ?? resolveAssetUrl(piece.photoUrl);
                    return (
                      <div key={sareeId} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                        {preview ? (
                          <img src={preview} alt="" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.bdr}`, flexShrink: 0 }} />
                        ) : (
                          <span aria-hidden style={{ width: 42, height: 42, borderRadius: 8, background: "rgba(200,155,71,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Camera size={16} color="#845E04" />
                          </span>
                        )}
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{sareeId}</span>
                          <span style={{ display: "block", fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                            {typeTextOf(sareeId)} · {piece.reason}
                            {piece.reason === "Other" && piece.reasonNote.trim() ? ` — ${piece.reasonNote.trim()}` : ""}
                          </span>
                        </span>
                        {pricePerSaree > 0 && (
                          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                            {formatMoney(rupees(pricePerSaree))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>Total credit</span>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 30, color: "#845E04", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                      {formatMoney(rupees(refundTotal))}
                    </span>
                  </div>
                </div>
              }
            />
            <ConsequenceNote>
              Confirming records {pickedList.length === 1 ? "this piece" : `these ${pickedList.length} pieces`} against{" "}
              <strong>{vendorName}</strong> and holds {pickedList.length === 1 ? "it" : "them"} under{" "}
              <strong>Wholesale returns</strong> in Shop Inventory. Nothing goes back on sale by itself — send it to
              inventory from there once it has been checked.
            </ConsequenceNote>
          </StepBody>
          {error && (
            <div role="alert" style={{ margin: "0 0 14px", fontFamily: F.u, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          <FlowActions
            accent={ACCENT_WHOLESALE}
            backLabel="Edit details"
            onBack={() => setStep(2)}
            primaryIcon={RotateCcw}
            primaryLabel={submitting
              ? "Recording…"
              : pickedList.length > 1 ? `Confirm return — ${pickedList.length} sarees` : "Confirm return"}
            onPrimary={() => void confirm()}
            primaryDisabled={submitting}
          />
        </>
      )}
    </div>
  );
}
