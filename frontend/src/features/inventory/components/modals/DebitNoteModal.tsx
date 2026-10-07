import { useEffect, useMemo, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { pieceCodeFromLineCode } from "@/features/suppliers";
import { resolveAssetUrl } from "@/shared/api/uploads";
import { formatPaise, toPaise } from "../../../../lib/gst";
import { STOPGAP_ACTING_USER_ID } from "@/shared/api/purchase-requests";
import {
  supplierDebitNotesApi,
  type BackendSupplierDebitNote,
  type BackendSupplierReturnStatus,
} from "@/shared/api/supplier-returns";
import { Button, IconButton, Textarea } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import {
  DocumentViewer,
  DebitNoteDocument,
  DEFAULT_LETTERHEAD_FIRM,
  type DebitNoteItem,
} from "../../../../shared/ui/document";
import { T, F } from "../externalPurchases/theme";

export const DEBIT_NOTE_STATUS_STYLE: Record<
  BackendSupplierReturnStatus,
  { bg: string; color: string; label: string }
> = {
  PENDING: { bg: "rgba(200,155,71,0.12)", color: "#8B6018", label: "Pending" },
  APPROVED: { bg: "rgba(30,102,64,0.10)", color: "#1E6640", label: "Approved" },
  PARTIALLY_APPROVED: { bg: "rgba(59,130,246,0.10)", color: "#1D4ED8", label: "Partly Approved" },
  REJECTED: { bg: "rgba(192,57,43,0.10)", color: "#C0392B", label: "Rejected" },
  CANCELLED: { bg: "rgba(105,99,94,0.12)", color: "#69635E", label: "Cancelled" },
};

/**
 * Whether the signed-in user may approve or reject supplier returns — the
 * backend's @AdminOnly rule. An admin looking at a staff portal through
 * "view as" still holds the admin session, so that counts too.
 */
export function useCanDecideReturns(): boolean {
  const { role, adminViewingAs } = useAuth();
  return role === "admin" || role === "superadmin" || adminViewingAs !== null;
}

/** Decided by an admin, as opposed to still pending or withdrawn. */
const isDecided = (status: BackendSupplierReturnStatus) =>
  status === "APPROVED" || status === "PARTIALLY_APPROVED" || status === "REJECTED";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fullName = (u: { firstName: string; lastName: string } | null) =>
  u ? `${u.firstName} ${u.lastName}`.trim() : "";

const formatRupees = (n: number) => formatPaise(toPaise(n));

const linkBtn = (color: string): CSSProperties => ({
  fontFamily: F.ui,
  fontSize: 11,
  fontWeight: 600,
  color,
  background: "none",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 6,
  cursor: "pointer",
  padding: "3px 10px",
});

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: F.ui,
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: T.taupe,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? "var(--font-mono)" : F.ui,
          fontSize: 12,
          fontWeight: 600,
          color: T.luxuryBrown,
          overflowWrap: "anywhere",
          marginTop: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/** Backend debit note → the props DebitNoteDocument prints. */
function toDocumentItems(note: BackendSupplierDebitNote): DebitNoteItem[] {
  const decided = isDecided(note.status);
  return note.requests.map((r) => ({
    lineCode: r.sareeLine.code,
    description:
      [r.sareeLine.sareeType, r.sareeLine.color].filter(Boolean).join(" · ") || undefined,
    pieceCodes: r.pieceNos.map((n) => pieceCodeFromLineCode(r.sareeLine.code, n)),
    quantity: r.quantity,
    rate: Number(r.sareeLine.price) || 0,
    acceptedQuantity: decided ? (r.approvedQuantity ?? 0) : undefined,
    acceptedPieceCodes: decided
      ? r.approvedPieceNos.map((n) => pieceCodeFromLineCode(r.sareeLine.code, n))
      : undefined,
  }));
}

export function DebitNoteDocumentFor({ note }: { note: BackendSupplierDebitNote }) {
  const decided = isDecided(note.status);
  const address =
    [note.supplier.address, note.supplier.city].filter(Boolean).join(", ") || undefined;
  return (
    <DebitNoteDocument
      noteNumber={note.id}
      date={formatDate(note.createdAt)}
      firm={DEFAULT_LETTERHEAD_FIRM}
      supplier={{
        name: note.supplier.name,
        address,
        contact: note.supplier.phone ?? undefined,
        gstin: note.supplier.gstCode ?? note.purchase.gstNumber ?? undefined,
      }}
      purchaseRef={note.purchaseId}
      supplierInvoice={note.purchase.invoiceNumber ?? undefined}
      items={toDocumentItems(note)}
      reason={note.reason ?? undefined}
      decisionNote={note.decisionNote ?? undefined}
      decided={decided}
      statusLabel={
        note.status !== "PENDING" ? DEBIT_NOTE_STATUS_STYLE[note.status].label : undefined
      }
      raisedBy={fullName(note.requestedBy)}
      approvedBy={decided && note.status !== "REJECTED" ? fullName(note.decidedBy) : undefined}
      approvedDate={decided ? formatDate(note.decidedAt) : undefined}
    />
  );
}

interface DebitNoteModalProps {
  noteId: string;
  onClose: () => void;
  /** Shows the piece-by-piece approval panel while the note is pending — admins only; ignored for anyone else. */
  canDecide?: boolean;
}

/**
 * One debit note: the printable document, plus — for an admin, while it is
 * still pending — a panel to accept some or all of the pieces on it.
 */
export function DebitNoteModal({ noteId, onClose, canDecide }: DebitNoteModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const decidedById = user?.id ?? STOPGAP_ACTING_USER_ID;
  const isAdmin = useCanDecideReturns();

  const {
    data: note,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["supplier-debit-notes", "detail", noteId],
    queryFn: () => supplierDebitNotesApi.get(noteId),
  });

  // Every requested piece starts ticked — the common case is approving the
  // whole note, and unticking the few refused pieces is the exception.
  const [approved, setApproved] = useState<Record<string, Set<number>>>({});
  useEffect(() => {
    if (!note) return;
    setApproved(Object.fromEntries(note.requests.map((r) => [r.id, new Set(r.pieceNos)])));
  }, [note]);
  const [decisionNote, setDecisionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const requested = note?.requests.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
    const accepted = Object.values(approved).reduce((sum, set) => sum + set.size, 0);
    const value =
      note?.requests.reduce(
        (sum, r) => sum + (approved[r.id]?.size ?? 0) * (Number(r.sareeLine.price) || 0),
        0
      ) ?? 0;
    return { requested, accepted, value };
  }, [note, approved]);

  const togglePiece = (requestId: string, pieceNo: number) =>
    setApproved((prev) => {
      const next = new Set(prev[requestId]);
      if (next.has(pieceNo)) next.delete(pieceNo);
      else next.add(pieceNo);
      return { ...prev, [requestId]: next };
    });

  const setLine = (requestId: string, pieceNos: number[]) =>
    setApproved((prev) => ({ ...prev, [requestId]: new Set(pieceNos) }));

  const submit = async (rejectAll: boolean) => {
    if (!note) return;
    setSubmitting(true);
    setError("");
    try {
      await supplierDebitNotesApi.decide(
        note.id,
        {
          lines: note.requests.map((r) => ({
            requestId: r.id,
            approvedPieceNos: rejectAll ? [] : [...(approved[r.id] ?? [])].sort((a, b) => a - b),
          })),
          decisionNote: decisionNote.trim() || undefined,
        },
        decidedById
      );
      toast.success(
        rejectAll || totals.accepted === 0
          ? `${note.id} rejected`
          : `${note.id} — ${totals.accepted} of ${totals.requested} piece${totals.requested === 1 ? "" : "s"} approved`
      );
      void qc.invalidateQueries({ queryKey: ["supplier-debit-notes"] });
      void qc.invalidateQueries({ queryKey: ["supplier-returns"] });
      void qc.invalidateQueries({ queryKey: ["suppliers", "purchases"] });
      setDecisionNote("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not record that decision. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);
  const cancelNote = async () => {
    if (!note) return;
    if (
      !window.confirm(
        `Cancel debit note ${note.id}? The sarees on it stay with us and can be picked for return again.`
      )
    )
      return;
    setCancelling(true);
    setError("");
    try {
      await supplierDebitNotesApi.cancel(note.id, decidedById, decisionNote.trim() || undefined);
      toast.success(`${note.id} cancelled`);
      void qc.invalidateQueries({ queryKey: ["supplier-debit-notes"] });
      void qc.invalidateQueries({ queryKey: ["supplier-returns"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not cancel this debit note. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  const status = note ? DEBIT_NOTE_STATUS_STYLE[note.status] : null;
  const showReview = !!note && !!canDecide && isAdmin && note.status === "PENDING";
  // Whoever raised it, or an admin, may withdraw a note nobody has decided yet.
  const canCancel =
    !!note && note.status === "PENDING" && (isAdmin || note.requestedById === user?.id);

  return (
    <Modal
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size={showReview ? "full" : "xl"}
    >
      <div className="flex flex-col h-[88vh] max-md:h-[90dvh] rounded-2xl overflow-hidden bg-[#FFFDF9]">
        <div
          style={{
            background: T.darkBurgundy,
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <Dialog.Title asChild>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#FFFDF9",
                  marginBottom: 4,
                }}
              >
                Debit Note
              </div>
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Debit note raised for sarees returned to the supplier
            </Dialog.Description>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold }}>
                {noteId}
              </span>
              {status && (
                <span
                  style={{
                    fontFamily: F.ui,
                    fontSize: 11,
                    fontWeight: 700,
                    color: status.color,
                    background: "#FFFDF9",
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  {status.label}
                </span>
              )}
              {note && (
                <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.7)" }}>
                  {note.supplier.name}
                </span>
              )}
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton
              label="Close"
              icon={X}
              variant="ghost"
              size="md"
              className="h-9 w-9 rounded-[10px] bg-white/10 text-white border border-white/20 hover:bg-white/25 hover:text-white shrink-0"
            />
          </Dialog.Close>
        </div>

        {isLoading ? (
          <div style={{ padding: 24 }}>
            <LoadingState variant="skeleton" rows={4} />
          </div>
        ) : isError || !note ? (
          <div style={{ padding: 24 }}>
            <ErrorState error={undefined} onRetry={() => void refetch()} />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {showReview && (
              <div
                className="md:w-[380px] shrink-0 flex flex-col min-h-0 border-b md:border-b-0 md:border-r max-h-[50%] md:max-h-none"
                style={{ borderColor: T.borderDef, background: T.silkCream }}
              >
                <div
                  className="flex-1 min-h-0 overflow-y-auto"
                  style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* What's being returned, at a glance */}
                  <div
                    style={{
                      background: "#FFF",
                      border: `1px solid ${T.borderGold}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}
                    >
                      <Fact label="Supplier" value={note.supplier.name} />
                      <Fact label="Purchase" value={note.purchaseId} mono />
                      <Fact
                        label="Raised by"
                        value={`${fullName(note.requestedBy)} · ${formatDate(note.createdAt)}`}
                      />
                      <Fact label="Invoice" value={note.purchase.invoiceNumber ?? "—"} mono />
                    </div>
                    {note.reason && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: `1px dashed ${T.borderDef}`,
                        }}
                      >
                        <Fact label="Reason" value={note.reason} />
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        background: T.silkCream,
                        borderRadius: 8,
                        padding: "8px 10px",
                      }}
                    >
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
                        Accepting <b>{totals.accepted}</b> of {totals.requested} pc
                        {totals.requested === 1 ? "" : "s"}
                      </span>
                      <span
                        style={{
                          fontFamily: F.ui,
                          fontSize: 15,
                          fontWeight: 700,
                          color: T.royalBurgundy,
                        }}
                      >
                        {formatRupees(totals.value)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontSize: 13,
                        fontWeight: 700,
                        color: T.luxuryBrown,
                      }}
                    >
                      Review pieces
                    </div>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontSize: 12,
                        color: T.taupe,
                        marginTop: 2,
                        lineHeight: 1.5,
                      }}
                    >
                      Untick any piece the supplier won't take back. Only ticked pieces leave stock.
                    </div>
                  </div>

                  {note.requests.map((r) => {
                    const set = approved[r.id] ?? new Set<number>();
                    const photo = resolveAssetUrl(r.sareeLine.imageUrl);
                    const rate = Number(r.sareeLine.price) || 0;
                    return (
                      <div
                        key={r.id}
                        style={{
                          background: "#FFF",
                          border: `1px solid ${T.borderDef}`,
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            padding: 10,
                            borderBottom: `1px solid ${T.borderDef}`,
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 56,
                              borderRadius: 8,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: T.silkCream,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {photo ? (
                              <img
                                src={photo}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <ImageIcon size={16} color={T.taupe} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 13,
                                fontWeight: 700,
                                color: T.royalBurgundy,
                                overflowWrap: "anywhere",
                              }}
                            >
                              {r.sareeLine.code}
                            </div>
                            <div
                              style={{
                                fontFamily: F.ui,
                                fontSize: 12,
                                color: T.luxuryBrown,
                                marginTop: 1,
                              }}
                            >
                              {[r.sareeLine.sareeType, r.sareeLine.color]
                                .filter(Boolean)
                                .join(" · ") || "Saree"}
                            </div>
                            <div
                              style={{
                                fontFamily: F.ui,
                                fontSize: 11,
                                color: T.taupe,
                                marginTop: 2,
                              }}
                            >
                              {formatRupees(rate)} / pc ·{" "}
                              <b style={{ color: set.size === r.quantity ? T.green : "#8B6018" }}>
                                {set.size}/{r.quantity} accepted
                              </b>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setLine(r.id, r.pieceNos)}
                              style={linkBtn(T.royalBurgundy)}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => setLine(r.id, [])}
                              style={linkBtn(T.taupe)}
                            >
                              None
                            </button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {r.pieceNos.map((n) => {
                            const code = pieceCodeFromLineCode(r.sareeLine.code, n);
                            const on = set.has(n);
                            return (
                              <label
                                key={n}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  cursor: "pointer",
                                  padding: "8px 12px",
                                  background: on ? "rgba(30,102,64,0.05)" : "#FAF7F2",
                                  borderTop: `1px solid ${T.borderDef}`,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => togglePiece(r.id, n)}
                                  aria-label={`Accept ${code}`}
                                  style={{
                                    width: 17,
                                    height: 17,
                                    accentColor: T.royalBurgundy,
                                    cursor: "pointer",
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    flex: 1,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 13,
                                    color: on ? T.luxuryBrown : T.taupe,
                                    textDecoration: on ? undefined : "line-through",
                                  }}
                                >
                                  {code}
                                </span>
                                <span
                                  style={{
                                    fontFamily: F.ui,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: on ? T.green : T.crimson,
                                  }}
                                >
                                  {on ? "Accept" : "Keep"}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <Textarea
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Approval note (optional)"
                    rows={2}
                  />

                  {error && (
                    <div
                      role="alert"
                      style={{
                        fontFamily: F.ui,
                        fontSize: 12,
                        color: T.crimson,
                        background: T.crimsonBg,
                        border: "1px solid rgba(192,57,43,0.20)",
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>

                {/* Actions stay in view however many pieces are listed above */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 16,
                    borderTop: `1px solid ${T.borderDef}`,
                    background: "#FFFDF9",
                    flexShrink: 0,
                  }}
                >
                  <Button
                    variant="primary"
                    iconLeft={CheckCircle2}
                    fullWidth
                    disabled={submitting || cancelling || totals.accepted === 0}
                    onClick={() => submit(false)}
                    className="rounded-[10px]"
                  >
                    {submitting
                      ? "Saving…"
                      : totals.accepted === totals.requested
                        ? `Approve all ${totals.requested} piece${totals.requested === 1 ? "" : "s"}`
                        : `Approve ${totals.accepted} of ${totals.requested} pieces`}
                  </Button>
                  <Button
                    variant="secondary"
                    iconLeft={X}
                    fullWidth
                    disabled={submitting || cancelling}
                    onClick={() => submit(true)}
                    className="rounded-[10px]"
                  >
                    Reject whole note
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
              {!showReview && error && (
                <div
                  style={{
                    margin: "10px 16px 0",
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: T.crimson,
                    background: T.crimsonBg,
                    border: "1px solid rgba(192,57,43,0.20)",
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  {error}
                </div>
              )}
              <DocumentViewer
                className="flex-1 min-h-0"
                fileName={note.id}
                documentTitle={`Debit Note ${note.id}`}
                actions={
                  canCancel ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={Ban}
                      onClick={cancelNote}
                      disabled={cancelling || submitting}
                    >
                      {cancelling ? "Cancelling…" : "Cancel Note"}
                    </Button>
                  ) : undefined
                }
              >
                <DebitNoteDocumentFor note={note} />
              </DocumentViewer>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
