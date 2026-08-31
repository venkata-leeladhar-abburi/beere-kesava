import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Image as ImageIcon } from "lucide-react";
import { Pagination, UsePaginationReturn } from "../../../../shared/ui/DataPagination";
import { T } from "./theme";
import { WeaverSareeRow } from "./types";
import { inr, fmtDate, externalSerialOf } from "./utils";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Modal } from "../../../../shared/ui/overlay";
import { StatusPill } from "../../../../shared/ui/domain";

interface ExternalSareesTableProps {
  pageRows: WeaverSareeRow[];
  canSeeMoney: boolean;
  pag: UsePaginationReturn;
  responsive?: boolean;
}

export function ExternalSareesTable({ pageRows, canSeeMoney, pag, responsive = false }: ExternalSareesTableProps) {
  const [preview, setPreview] = useState<string | null>(null);

  /** The piece's own photo when it has one, otherwise the purchase line's. */
  const photoOf = (r: WeaverSareeRow) => r.receivedPhotoUrl ?? r.external?.linePhotoUrl ?? null;

  const columns: ColumnDef<WeaverSareeRow>[] = [
    {
      id: "photo", header: "Photo", accessor: r => photoOf(r), priority: 1,
      cell: (_v, r) => {
        const src = photoOf(r);
        return src ? (
          <button type="button" onClick={() => setPreview(src)} title={`View photo of ${r.sareeId}`} className="p-0 border-0 bg-transparent cursor-pointer">
            <img src={src} alt={r.sareeId}
              style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
          </button>
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#F7F2EA", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={14} color="rgba(139,112,96,0.6)" />
          </div>
        );
      },
    },
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId, type: "code", priority: 1,
      cell: (_v, r) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>{r.sareeId}</span>
          {r.external && r.external.lineQuantity > 1 && (
            <span style={{ fontSize: 11, color: "rgba(139,112,96,0.85)" }}>
              pc {r.external.pieceNo}/{r.external.lineQuantity}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "pieceStatus", header: "Status", accessor: r => (r.external?.returned ? "Returned" : "With Us"), priority: 1,
      cell: (_v, r) => {
        const returned = r.external?.returned ?? false;
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const, borderRadius: 6, padding: "3px 8px",
            color: returned ? "#C0392B" : "#1E6640",
            background: returned ? "rgba(192,57,43,0.08)" : "rgba(30,102,64,0.08)",
          }}>
            {returned ? "Returned to Supplier" : "With Us"}
          </span>
        );
      },
    },
    {
      id: "serialNo", header: "Serial No.", accessor: r => externalSerialOf(r.sareeId), priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{externalSerialOf(r.sareeId) || "—"}</span>,
    },
    {
      id: "supplier", header: "Supplier", accessor: r => r.stock?.supplier,
      cell: (_v, r) => <span style={{ fontWeight: 600, color: T.royalBurgundy }}>{r.stock?.supplier || "—"}</span>,
    },
    {
      id: "purchaseOrder", header: "Purchase Order", accessor: r => r.stock?.purchaseId, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock?.purchaseId || "—"}</span>,
    },
    {
      id: "invoice", header: "Invoice No.", accessor: r => r.stock?.invoiceNumber ?? "—", priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock?.invoiceNumber || "—"}</span>,
    },
    { id: "location", header: "Location", accessor: r => r.stock?.supplierLocation ?? "—", priority: 3 },
    { id: "sareeType", header: "Saree Type", accessor: r => r.sareeTypeName || "—" },
    {
      id: "colour", header: "Colour", accessor: r => r.color,
      cell: (_v, r) => r.color ? <>{r.color}</> : <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>,
    },
    { id: "weight", header: "Weight", accessor: r => r.stock?.weight || "—", priority: 3 },
    {
      id: "purchaseDate", header: "Purchase Date", accessor: r => r.stock?.purchaseDate, priority: 3,
      cell: (_v, r) => <>{fmtDate(r.stock?.purchaseDate)}</>,
    },
    {
      id: "paymentStatus", header: "Payment", accessor: r => r.external?.paymentStatus ?? "Pending", type: "status", priority: 2,
      cell: (_v, r) => (
        <StatusPill
          taxonomy="payment"
          status={r.external?.paymentStatus === "Paid" ? "paid" : r.external?.paymentStatus === "Partial" ? "partial" : "unpaid"}
        />
      ),
    },
    ...(canSeeMoney ? [
      {
        id: "costPrice", header: "Cost Price", accessor: r => r.stock?.costPrice, align: "end",
        cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock ? inr(r.stock.costPrice) : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "sellPercent", header: "Sell %", accessor: r => r.stock?.sellPercent, align: "end",
        cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock ? `${r.stock.sellPercent}%` : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "finalAmount", header: "Final Amount", accessor: r => r.stock?.finalAmount, align: "end",
        cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{r.stock ? inr(r.stock.finalAmount) : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
    ] : []),
  ];

  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <div className="w-full overflow-x-auto section-nav-scroll p-2">
        <div className="min-w-[1150px]">
          <DataTable responsive={responsive} columns={columns} data={pageRows} getRowId={r => r.sareeId} />
        </div>
      </div>
      <Modal open={!!preview} onOpenChange={o => { if (!o) setPreview(null); }} size="xl">
        <Dialog.Title className="sr-only">Saree photo preview</Dialog.Title>
        <Dialog.Description className="sr-only">Full-size photo of the purchased saree</Dialog.Description>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {preview && (
            <img src={preview} alt="Saree"
              style={{ maxWidth: "100%", maxHeight: "82vh", objectFit: "contain", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }} />
          )}
        </div>
      </Modal>

      <div style={{ padding: "0 14px" }}>
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
      </div>
    </div>
  );
}
