import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, PackageCheck, ScanLine, XCircle } from "lucide-react";

import { C, F } from "./theme";
import { ACCENT_SALE } from "./flow-kit";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import {
  shopReceiptsApi,
  shopReceiptKeys,
  type PendingShopDispatch,
  type ShopReceiptItemStatus,
} from "../../../../shared/api/shop-receipts";
import { Button, Input, Textarea } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

/**
 * Receiving one consignment at the shop counter — the step that turns an
 * admin's SHOP dispatch into sellable shop stock.
 *
 * A verdict is recorded per saree, never for the lorry as a whole: goods go
 * short and goods arrive damaged, and an "all received" button that hides
 * that would put pieces on the shelf which are not there. A row starts with
 * no verdict and is left off the receipt entirely until it gets one, so a
 * consignment can be received in two passes — what turned up today, and what
 * turned up when the shortage was chased.
 *
 * Two ways in, both writing the same rows: the camera (the counter's normal
 * tool — same scanner as the sale flow) and the tick, for a tag that will not
 * read.
 */

/** No verdict yet — the row is simply not on this receipt. */
type RowStatus = ShopReceiptItemStatus | "PENDING";

const STATUS_META: Record<
  ShopReceiptItemStatus,
  { label: string; icon: typeof CheckCircle2; color: string; soft: string }
> = {
  RECEIVED: { label: "Received", icon: CheckCircle2, color: "#0F766E", soft: "rgba(15,118,110,0.10)" },
  DAMAGED: { label: "Damaged", icon: AlertTriangle, color: "#B45309", soft: "rgba(180,83,9,0.10)" },
  MISSING: { label: "Missing", icon: XCircle, color: "#C0392B", soft: "rgba(192,57,43,0.10)" },
};

/** The consignment's label, matching how ShopInventory names one. */
export function consignmentLabel(d: {
  challanNumber: string | null;
  lrNumber: string | null;
  dispatchDate: string;
}): string {
  if (d.challanNumber) return d.challanNumber;
  if (d.lrNumber) return `LR ${d.lrNumber}`;
  const parsed = new Date(d.dispatchDate);
  return isNaN(parsed.getTime())
    ? "Dispatch"
    : `Dispatch ${parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
}

export function ReceiveDispatchModal({
  dispatch,
  open,
  onClose,
  onReceived,
}: {
  dispatch: PendingShopDispatch;
  open: boolean;
  onClose: () => void;
  /** Fired with the receipt number (SGR-<FY>-NNN) once it is written. */
  onReceived: (code: string) => void;
}) {
  const queryClient = useQueryClient();

  // Only pieces still awaiting a verdict are actionable. One already marked
  // RECEIVED or DAMAGED on an earlier receipt has been dealt with; one marked
  // MISSING can be received now that it has turned up.
  const outstanding = useMemo(
    () => dispatch.sarees.filter(s => s.receiptStatus === null || s.receiptStatus === "MISSING"),
    [dispatch.sarees],
  );

  const [rows, setRows] = useState<Record<string, RowStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reopening the modal must not carry the last session's ticks over.
  useEffect(() => {
    if (!open) return;
    setRows({});
    setRemarks({});
    setNotes("");
    setError(null);
    setScanMessage(null);
  }, [open, dispatch.id]);

  const statusOf = (sareeId: string): RowStatus => rows[sareeId] ?? "PENDING";
  const setStatus = (sareeId: string, status: RowStatus) =>
    setRows(prev => ({ ...prev, [sareeId]: status }));

  const counts = useMemo(() => {
    const tally = { RECEIVED: 0, DAMAGED: 0, MISSING: 0, PENDING: 0 };
    for (const s of outstanding) tally[statusOf(s.sareeId)] += 1;
    return tally;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outstanding, rows]);

  const marked = outstanding.filter(s => statusOf(s.sareeId) !== "PENDING");

  /** A discrepancy with no reason is unusable to whoever has to chase it. */
  const missingRemark = marked.find(
    s => statusOf(s.sareeId) !== "RECEIVED" && !(remarks[s.sareeId] ?? "").trim(),
  );

  const receive = useMutation({
    mutationFn: () =>
      shopReceiptsApi.create({
        dispatchId: dispatch.id,
        notes: notes.trim() || undefined,
        items: marked.map(s => ({
          sareeId: s.sareeId,
          status: statusOf(s.sareeId) as ShopReceiptItemStatus,
          remarks: remarks[s.sareeId]?.trim() || undefined,
        })),
      }),
    onSuccess: receipt => {
      // Everything that changes the moment a consignment lands: the incoming
      // list shrinks, the receipt history grows, and received pieces become
      // sellable shop stock.
      void queryClient.invalidateQueries({ queryKey: shopReceiptKeys.pending });
      void queryClient.invalidateQueries({ queryKey: shopReceiptKeys.history });
      void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
      onReceived(receipt.code);
      onClose();
    },
    onError: (e: unknown) =>
      setError(e instanceof Error ? `Could not record the receipt: ${e.message}` : "Could not record the receipt."),
  });

  const onDetected = (text: string) => {
    const scanned = text.trim();
    const match = outstanding.find(s => s.sareeId.toLowerCase() === scanned.toLowerCase());
    if (!match) {
      setScanMessage(`${scanned} is not awaiting receipt on this consignment.`);
      return;
    }
    setStatus(match.sareeId, "RECEIVED");
    setScanMessage(`${match.sareeId} marked received.`);
    setScanning(false);
  };

  return (
    <>
      <Modal open={open} onOpenChange={next => { if (!next) onClose(); }} size="lg">
        <Modal.Header
          banner
          icon={PackageCheck}
          title={`Receive ${consignmentLabel(dispatch)}`}
          subtitle={`${outstanding.length} saree(s) awaiting receipt${
            dispatch.receipts.length ? ` · already receipted on ${dispatch.receipts.map(r => r.code).join(", ")}` : ""
          }`}
          onClose={onClose}
        />

        <Modal.Body className="py-5">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <Button variant="primary" size="md" iconLeft={ScanLine} onClick={() => { setScanMessage(null); setScanning(true); }}>
              Scan saree tag
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconLeft={CheckCircle2}
              onClick={() =>
                setRows(Object.fromEntries(outstanding.map(s => [s.sareeId, "RECEIVED" as RowStatus])))
              }
            >
              Mark all received
            </Button>
            <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted }}>
              {counts.RECEIVED} received · {counts.DAMAGED} damaged · {counts.MISSING} missing · {counts.PENDING} not checked
            </span>
          </div>

          {scanMessage && (
            <div
              role="status"
              style={{
                fontFamily: F.u, fontSize: 13, marginBottom: 12, padding: "9px 12px", borderRadius: 10,
                background: ACCENT_SALE.soft, border: `1px solid ${ACCENT_SALE.softBorder}`, color: C.text,
              }}
            >
              {scanMessage}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {outstanding.map(saree => {
              const status = statusOf(saree.sareeId);
              const meta = status === "PENDING" ? null : STATUS_META[status];
              return (
                <div
                  key={saree.sareeId}
                  style={{
                    border: `1px solid ${meta ? meta.color + "55" : C.bdr}`,
                    background: meta ? meta.soft : C.white,
                    borderRadius: 12, padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13.5, color: C.text }}>
                      {saree.sareeId}
                      {saree.receiptStatus === "MISSING" && (
                        <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 12, color: "#C0392B" }}>
                          reported missing earlier
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(Object.keys(STATUS_META) as ShopReceiptItemStatus[]).map(key => {
                        const m = STATUS_META[key];
                        const active = status === key;
                        const Icon = m.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setStatus(saree.sareeId, active ? "PENDING" : key)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                              fontFamily: F.u, fontSize: 12, fontWeight: 600,
                              padding: "6px 10px", borderRadius: 999,
                              border: `1px solid ${active ? m.color : C.bdr}`,
                              background: active ? m.color : C.white,
                              color: active ? "#FFFDF9" : C.muted,
                            }}
                          >
                            <Icon size={13} />
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {status !== "PENDING" && status !== "RECEIVED" && (
                    <div style={{ marginTop: 8 }}>
                      <Input
                        value={remarks[saree.sareeId] ?? ""}
                        onChange={e => setRemarks(prev => ({ ...prev, [saree.sareeId]: e.target.value }))}
                        placeholder={status === "DAMAGED" ? "What is the damage?" : "Where was it last seen?"}
                        aria-label={`Reason for ${saree.sareeId}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes for this receipt (optional) — e.g. lorry arrived late, one bundle opened"
              aria-label="Receipt notes"
            />
          </div>

          {error && (
            <div role="alert" style={{ marginTop: 12, fontFamily: F.u, fontSize: 13, color: "#C0392B" }}>
              {error}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            iconLeft={PackageCheck}
            loading={receive.isPending}
            disabled={marked.length === 0 || missingRemark !== undefined}
            onClick={() => { setError(null); receive.mutate(); }}
          >
            {marked.length === 0
              ? "Nothing marked yet"
              : missingRemark
                ? `Add a reason for ${missingRemark.sareeId}`
                : `Confirm receipt of ${marked.length} saree(s)`}
          </Button>
        </Modal.Footer>
      </Modal>

      <BarcodeScannerModal
        open={scanning}
        onClose={() => setScanning(false)}
        onDetected={onDetected}
        accent={ACCENT_SALE}
      />
    </>
  );
}
