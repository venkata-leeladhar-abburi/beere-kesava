import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Image as ImageIcon, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { STOPGAP_ACTING_USER_ID } from "@/shared/api/purchase-requests";
import { BackendSupplierReturnStatus, supplierReturnsApi } from "@/shared/api/supplier-returns";
import { Button } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { Modal } from "../../../shared/ui/overlay";
import { T, F } from "./externalPurchases/theme";

type StatusFilter = "ALL" | BackendSupplierReturnStatus;

const STATUS_STYLE: Record<BackendSupplierReturnStatus, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(200,155,71,0.10)", color: T.antiqueGold, label: "Pending" },
  APPROVED: { bg: "rgba(30,102,64,0.08)", color: "#1E6640", label: "Approved" },
  REJECTED: { bg: "rgba(192,57,43,0.08)", color: "#C0392B", label: "Rejected" },
};

/**
 * Sarees sent back to a supplier from an External Purchase, pending an
 * admin's approval. Approving is what actually pulls the pieces out of that
 * purchase's available stock (see SupplierReturnsService.decide on the
 * backend) — this page is both the approval queue and the permanent record
 * of every return, decided or not.
 */
export function SupplierReturnsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const decidedById = user?.id ?? STOPGAP_ACTING_USER_ID;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // pageSize is capped at 100 server-side (ListSupplierReturnRequestsQueryDto);
  // requesting more than that 400s. isError is surfaced below rather than
  // left silent, since an unnoticed fetch failure here looks identical to
  // "no return requests exist" — which is exactly what masked this once already.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["supplier-returns", "list"],
    queryFn: () => supplierReturnsApi.list({ pageSize: 100 }),
  });

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    return statusFilter === "ALL" ? items : items.filter(r => r.status === statusFilter);
  }, [data, statusFilter]);

  const pendingCount = (data?.items ?? []).filter(r => r.status === "PENDING").length;

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setDecidingId(id);
    setError("");
    try {
      await supplierReturnsApi.decide(id, { decision }, decidedById);
      void qc.invalidateQueries({ queryKey: ["supplier-returns"] });
      // Approving changes PurchaseSareeLine.returnedQuantity, which is what
      // the External Purchases saree list reads to show "Returned" — without
      // this, that page keeps showing the piece as "With Us" until reloaded.
      void qc.invalidateQueries({ queryKey: ["suppliers", "purchases"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record that decision. Please try again.");
    } finally {
      setDecidingId(null);
    }
  };

  const columns: ColumnDef<(typeof rows)[number]>[] = [
    {
      id: "id", header: "Return ID", accessor: r => r.id, priority: 1,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>{r.id}</span>,
    },
    {
      id: "photo", header: "Photo", accessor: r => r.sareeLine.imageUrl,
      cell: (_v, r) => r.sareeLine.imageUrl ? (
        <button type="button" onClick={() => setPreview(r.sareeLine.imageUrl)} className="p-0 border-0 bg-transparent cursor-pointer">
          <img src={r.sareeLine.imageUrl} alt={r.sareeLine.code}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
        </button>
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon size={14} color={T.taupe} />
        </div>
      ),
    },
    {
      id: "purchase", header: "From Purchase", accessor: r => r.purchaseId,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{r.purchaseId}</span>,
    },
    {
      id: "supplier", header: "Supplier", accessor: r => r.supplier.name,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{r.supplier.name}</span>,
    },
    {
      id: "line", header: "Saree Line", accessor: r => r.sareeLine.code,
      cell: (_v, r) => (
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{r.sareeLine.code}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{[r.sareeLine.sareeType, r.sareeLine.color].filter(Boolean).join(" · ") || "—"}</div>
        </div>
      ),
    },
    {
      id: "quantity", header: "Pieces", accessor: r => r.quantity,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{r.quantity}</span>,
    },
    {
      id: "reason", header: "Reason", accessor: r => r.reason ?? "", priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, maxWidth: 220 }}>{r.reason || "—"}</span>,
    },
    {
      id: "requestedBy", header: "Requested By", accessor: r => `${r.requestedBy.firstName} ${r.requestedBy.lastName}`, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>{r.requestedBy.firstName} {r.requestedBy.lastName}</span>,
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => {
        const s = STATUS_STYLE[r.status];
        return <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap" as const }}>{s.label}</span>;
      },
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions",
      cell: (_v, r) => r.status !== "PENDING" ? (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>
          {r.decidedBy ? `${r.decidedBy.firstName} ${r.decidedBy.lastName}` : "—"}
        </span>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            variant="primary"
            size="sm"
            iconLeft={CheckCircle2}
            disabled={decidingId === r.id}
            onClick={() => decide(r.id, "APPROVED")}
            className="whitespace-nowrap"
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={X}
            disabled={decidingId === r.id}
            onClick={() => decide(r.id, "REJECTED")}
            className="whitespace-nowrap"
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 32px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <RotateCcw size={22} color={T.royalBurgundy} />
        <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, margin: 0 }}>Supplier Returns</h1>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "0 0 24px" }}>
        Sarees sent back to a supplier from an External Purchase. Approving removes the pieces from that purchase's available stock.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { key: "PENDING", label: `Pending${pendingCount ? ` (${pendingCount})` : ""}` },
          { key: "APPROVED", label: "Approved" },
          { key: "REJECTED", label: "Rejected" },
          { key: "ALL", label: "All" },
        ] as { key: StatusFilter; label: string }[]).map(f => (
          <Button
            key={f.key}
            variant={statusFilter === f.key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16, fontFamily: F.ui, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 8, padding: "10px 14px" }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Loading supplier returns…</div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F.ui, fontSize: 14, color: "#C0392B" }}>
          Could not load supplier returns. Please refresh the page.
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          No {statusFilter === "ALL" ? "" : STATUS_STYLE[statusFilter as BackendSupplierReturnStatus]?.label.toLowerCase() + " "}return requests.
        </div>
      ) : (
        <DataTable responsive columns={columns} data={rows} getRowId={r => r.id} />
      )}

      <Modal open={!!preview} onOpenChange={o => { if (!o) setPreview(null); }} size="xl">
        <Dialog.Title className="sr-only">Saree photo preview</Dialog.Title>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {preview && (
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={preview} alt="Saree" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          )}
        </div>
      </Modal>
    </div>
  );
}
