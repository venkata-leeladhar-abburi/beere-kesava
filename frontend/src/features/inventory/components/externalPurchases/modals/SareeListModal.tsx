import React, { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Printer, Undo2 } from "lucide-react";
import {
  Purchase,
  lineProfit, purchaseTotals, expandSareePieces, withPieceImage,
  SareeInventoryTable, type PieceExtra,
  useSuppliers,
} from "@/features/suppliers";
import { useAuth } from "@/contexts/AuthContext";
import { STOPGAP_ACTING_USER_ID } from "@/shared/api/purchase-requests";
import { supplierReturnsApi } from "@/shared/api/supplier-returns";
import { formatMoney, rupees } from "@/lib/domain/money";
import { T, F } from "../theme";
import { Button, IconButton, Textarea } from "../../../../../shared/ui/primitives";
import { Modal } from "../../../../../shared/ui/overlay";
import { useDocument } from "../../../../../shared/ui/document";

/** Full saree/barcode breakdown for one purchase — grouped by serial number
 * (one row per purchase line), matching the Suppliers → Order History view,
 * expandable to the individual physical pieces under each serial. */
export function SareeListModal({
  purchase,
  onClose,
}: {
  purchase: Purchase;
  onClose: () => void;
}) {
  const { print } = useDocument();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { updatePurchase } = useSuppliers();
  const requestedById = user?.id ?? STOPGAP_ACTING_USER_ID;

  // Pending return requests reserve pieces the same way an APPROVED one
  // removes them — fetched here so "With Us" doesn't show a piece that's
  // already been sent back and is just waiting on a decision.
  const { data: pendingRes } = useQuery({
    queryKey: ["supplier-returns", "pending", purchase.id],
    queryFn: () => supplierReturnsApi.list({ status: "PENDING" }),
  });
  const pendingByLineId = useMemo(() => {
    const map = new Map<string, number>();
    (pendingRes?.items ?? [])
      .filter(r => r.purchaseId === purchase.id)
      .forEach(r => map.set(r.sareeLineId, (map.get(r.sareeLineId) ?? 0) + r.quantity));
    return map;
  }, [pendingRes, purchase.id]);

  // One row per physical saree — a line bought in bulk is tagged piece by
  // piece. Pending pieces are treated the same way expandSareePieces already
  // treats returned ones: the first N (by position) of a line are pending,
  // since the backend tracks a per-line count rather than a per-piece flag.
  const pieces = useMemo(() => {
    return expandSareePieces(purchase.sarees).map(s => {
      const pendingQty = s.lineId ? pendingByLineId.get(s.lineId) ?? 0 : 0;
      const returnedQty = Number(s.returnedQuantity) || 0;
      return { ...s, pending: !s.returned && s.pieceNo <= returnedQty + pendingQty };
    });
  }, [purchase.sarees, pendingByLineId]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Only pieces with nothing already in motion can be selected.
  const selectedReturnablePieces = pieces.filter(s => selectedIds.has(s.id) && !s.returned && !s.pending);

  // Raises one SupplierReturnRequest per affected line (PENDING — nothing
  // leaves the purchase until an admin approves it in Supplier Returns).
  // Previously this bumped PurchaseSareeLine.returnedQuantity immediately via
  // a full purchase rewrite, with no approval step and no separate record.
  const handleReturnSelected = async () => {
    if (selectedReturnablePieces.length === 0) return;
    const countByLineId = new Map<string, number>();
    selectedReturnablePieces.forEach(s => {
      if (!s.lineId) return;
      countByLineId.set(s.lineId, (countByLineId.get(s.lineId) ?? 0) + 1);
    });
    setSubmitting(true);
    setSubmitError("");
    try {
      await Promise.all(
        [...countByLineId].map(([sareeLineId, quantity]) =>
          supplierReturnsApi.create(
            { purchaseId: purchase.id, sareeLineId, quantity, reason: reason.trim() || undefined },
            requestedById,
          ),
        ),
      );
      setSelectedIds(new Set());
      setReason("");
      void qc.invalidateQueries({ queryKey: ["supplier-returns"] });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not request this return. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge + selectability per physical piece, keyed by piece id —
  // handed to SareeInventoryTable's expanded piece list so a piece already
  // returned or pending a decision can't be selected again.
  const pieceExtra = (pieceId: string): PieceExtra | undefined => {
    const s = pieces.find(p => p.id === pieceId);
    if (!s) return undefined;
    if (s.returned) return { badge: { label: "Returned", color: T.crimson, bg: "rgba(192,57,43,0.08)" }, selectable: false };
    if (s.pending) return { badge: { label: "Return Pending", color: T.antiqueGold, bg: "rgba(200,155,71,0.10)" }, selectable: false };
    return { badge: { label: "With Us", color: T.green, bg: "rgba(30,102,64,0.08)" }, selectable: true };
  };

  const toggleSelectPiece = (pieceId: string) => {
    if (!pieceExtra(pieceId)?.selectable) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(pieceId)) next.delete(pieceId); else next.add(pieceId);
      return next;
    });
  };

  // The parent owns `purchase` and only refreshes it when the modal opens, so
  // a photo uploaded now is mirrored locally too — otherwise the new picture
  // wouldn't appear until the saree list was closed and reopened.
  const [sarees, setSarees] = useState(purchase.sarees);
  useEffect(() => { setSarees(purchase.sarees); }, [purchase.sarees]);

  const rows = sarees.map(s => ({ ...s, purchaseId: purchase.id, invoiceNumber: purchase.invoiceNumber, supplier: purchase.supplier }));

  const persistSarees = (next: typeof sarees) => {
    setSarees(next);
    updatePurchase(purchase.id, { sarees: next });
  };

  const handleUploadPhoto = (row: (typeof rows)[number], url: string) =>
    persistSarees(sarees.map(s => s.id === row.id ? { ...s, imageUrl: url } : s));

  const handleUploadPieceImage = (row: (typeof rows)[number], pieceNo: number, url: string) =>
    persistSarees(sarees.map(s => s.id === row.id ? withPieceImage(s, pieceNo, url) : s));

  const totals = purchaseTotals(purchase.sarees);

  // A plain print table, not <DataTable> — DataTable's sort/hover chrome and
  // the per-row "Print" barcode button aren't meaningful on paper. Same data,
  // same column order minus the interactive Barcode column.
  const printTable = (
    <div style={{ padding: "16mm" }}>
      <div style={{ marginBottom: "4mm" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14pt", color: "var(--doc-burgundy)" }}>
          {purchase.id} — Saree Details
        </div>
        <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)" }}>{purchase.supplier}</div>
      </div>
      {/* eslint-disable-next-line no-restricted-syntax -- printable document template */}
      <table className="bk-doc__table">
        <thead>
          <tr>
            {["S.No", "Saree Code", "Line Serial", "Saree Type", "Colour", "Weight", "Buying Price", "Sell %", "Selling Price", "Profit", "Notes"].map(h => (
              // eslint-disable-next-line no-restricted-syntax -- printable document template
              <th key={h} style={{ textAlign: /Price|Profit|%/.test(h) ? "end" : "start" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pieces.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{s.id}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{s.lineCode} · pc {s.pieceNo}/{s.lineQuantity}</td>
              <td>{s.sareeType || "—"}</td>
              <td>{s.color || "—"}</td>
              <td>{s.weight}</td>
              <td data-num>{formatMoney(rupees(s.price))}</td>
              <td data-num>{s.sellPercent}%</td>
              <td data-num>{formatMoney(rupees(s.finalAmount))}</td>
              <td data-num>{formatMoney(rupees(lineProfit(s)))}</td>
              <td>{s.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700 }}>
            <td colSpan={6}>Totals — {totals.pieces} piece{totals.pieces !== 1 ? "s" : ""}</td>
            <td data-num>{formatMoney(rupees(totals.buying))}</td>
            <td aria-label="Not applicable">—</td>
            <td data-num>{formatMoney(rupees(totals.selling))}</td>
            <td data-num>{formatMoney(rupees(totals.profit))}</td>
            <td aria-label="Not applicable">—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="xl">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "calc(100dvh - 96px)",
          background: "#FFF",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
        }}
      >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <Dialog.Title style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFF", margin: 0 }}>
                {purchase.id} — Saree Details
              </Dialog.Title>
              <Dialog.Description asChild>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(200,155,71,0.8)" }}>
                  {purchase.supplier}
                </div>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                onClick={onClose}
                size="sm"
                className="rounded-full bg-white/12 text-white hover:bg-white/20"
              />
            </Dialog.Close>
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            <SareeInventoryTable
              rows={rows}
              onUploadPhoto={handleUploadPhoto}
              onUploadPieceImage={handleUploadPieceImage}
              pieceExtra={pieceExtra}
              selectedPieceIds={selectedIds}
              onTogglePieceSelect={toggleSelectPiece}
            />
            {/* SareeInventoryTable has no tfoot support — totals row rendered as a matching footer bar. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: T.silkCream,
                borderTop: `1px solid ${T.borderDef}`,
                padding: "10px 14px",
                flexWrap: "wrap" as const,
              }}
            >
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>
                Totals — {totals.pieces} piece{totals.pieces !== 1 ? "s" : ""}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>Buying {formatMoney(rupees(totals.buying))}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>Selling {formatMoney(rupees(totals.selling))}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" as const }}>Profit {formatMoney(rupees(totals.profit))}</span>
            </div>
          </div>

          {selectedReturnablePieces.length > 0 && (
            <div style={{ padding: "12px 24px 0", flexShrink: 0 }}>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for return (optional)"
                rows={2}
              />
              {submitError && (
                <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 8, padding: "8px 12px" }}>
                  {submitError}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              padding: "14px 24px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {selectedReturnablePieces.length > 0 && (
              <Button
                variant="danger"
                iconLeft={Undo2}
                onClick={handleReturnSelected}
                disabled={submitting}
                fullWidth
                className="rounded-full"
              >
                {submitting
                  ? "Requesting…"
                  : `Request Return of ${selectedReturnablePieces.length} Selected Saree${selectedReturnablePieces.length !== 1 ? "s" : ""}`}
              </Button>
            )}
            <Button
              variant="primary"
              iconLeft={Printer}
              onClick={() => print(printTable)}
              fullWidth
              className="rounded-full"
            >
              Print All Barcodes
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-none rounded-full"
            >
              Close
            </Button>
          </div>
      </div>
    </Modal>
  );
}
