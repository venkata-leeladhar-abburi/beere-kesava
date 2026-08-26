import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Image as ImageIcon, RotateCcw, X, LayoutGrid, List, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { STOPGAP_ACTING_USER_ID } from "@/shared/api/purchase-requests";
import { BackendSupplierReturnStatus, supplierReturnsApi } from "@/shared/api/supplier-returns";
import { Button, SearchInput } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../shared/ui/state";
import { Modal } from "../../../shared/ui/overlay";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { LuxuryStatsCard } from "@/shared/ui/LuxuryStatsCard";
import { T, F } from "./externalPurchases/theme";
import { SectionCard } from "./externalPurchases/common/primitives";

type StatusFilter = "ALL" | BackendSupplierReturnStatus;

const STATUS_STYLE: Record<BackendSupplierReturnStatus, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(200,155,71,0.12)", color: "#8B6018", label: "Pending" },
  APPROVED: { bg: "rgba(30,102,64,0.10)", color: "#1E6640", label: "Approved" },
  REJECTED: { bg: "rgba(192,57,43,0.10)", color: "#C0392B", label: "Rejected" },
};

export function SupplierReturnsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const decidedById = user?.id ?? STOPGAP_ACTING_USER_ID;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // pageSize is capped at 100 server-side (ListSupplierReturnRequestsQueryDto);
  // requesting more than that 400s. isError is surfaced below rather than
  // left silent, since an unnoticed fetch failure here looks identical to
  // "no return requests exist" — which is exactly what masked this once already.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["supplier-returns", "list"],
    queryFn: () => supplierReturnsApi.list({ pageSize: 100 }),
  });

  // Two useMemos below depend on this — a fresh [] each render made both of
  // them recompute every render.
  const allItems = useMemo(() => data?.items ?? [], [data]);

  const rows = useMemo(() => {
    let result = allItems;
    if (statusFilter !== "ALL") {
      result = result.filter(r => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.purchaseId.toLowerCase().includes(q) ||
        r.supplier.name.toLowerCase().includes(q) ||
        r.sareeLine.code.toLowerCase().includes(q) ||
        (r.reason && r.reason.toLowerCase().includes(q))
      );
    }
    if (dateFilter.mode !== "all") {
      result = result.filter(r => matchesDateFilter(r.createdAt, dateFilter));
    }
    return result;
  }, [allItems, statusFilter, search, dateFilter]);

  const pendingCount = useMemo(() => allItems.filter(r => r.status === "PENDING").length, [allItems]);

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setDecidingId(id);
    setError("");
    try {
      await supplierReturnsApi.decide(id, { decision }, decidedById);
      void qc.invalidateQueries({ queryKey: ["supplier-returns"] });
      void qc.invalidateQueries({ queryKey: ["suppliers", "purchases"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record that decision. Please try again.");
    } finally {
      setDecidingId(null);
    }
  };

  const statItems = [
    { label: "TOTAL RETURNS", value: String(allItems.length), sub: "All time return requests", icon: <RotateCcw size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "PENDING APPROVAL", value: String(pendingCount), sub: "Awaiting admin decision", icon: <Clock size={20} color="rgba(245,232,208,0.90)" />, highlight: true },
    { label: "APPROVED RETURNS", value: String(allItems.filter(r => r.status === "APPROVED").length), sub: "Stock deducted from purchase", icon: <CheckCircle2 size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "REJECTED RETURNS", value: String(allItems.filter(r => r.status === "REJECTED").length), sub: "Returned requests rejected", icon: <X size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
  ];

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
        return <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 6, padding: "2.5px 8px", whiteSpace: "nowrap" as const }}>{s.label}</span>;
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
            className="whitespace-nowrap rounded-[10px]"
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={X}
            disabled={decidingId === r.id}
            onClick={() => decide(r.id, "REJECTED")}
            className="whitespace-nowrap rounded-[10px]"
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Hero Banner Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 flex-col xl:flex-row" style={{ position: "relative", zIndex: 2, paddingTop: 44, paddingBottom: 80, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Since 1999 · Supplier Returns & Quality Assurance
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Supplier Returns</h1>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px, 4.5vw, 32px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Stock Return Oversight</span>
            </div>
            <p className="max-w-[640px]" style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
              Review and approve sarees sent back to suppliers from External Purchases. Approving a return request automatically removes the pieces from available stock and updates vendor ledger records.
            </p>
          </div>
        </div>
      </header>

      {/* Floating Summary Cards */}
      <div className="px-4 md:px-7 xl:px-14 -mt-6 md:-mt-8 xl:-mt-[36px]" style={{ zIndex: 20, position: "relative" }}>
        <LuxuryStatsCard stats={statItems} />
      </div>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <SectionCard
          icon={RotateCcw}
          title="Supplier Returns Queue"
          subtitle="Sarees sent back to a supplier from an External Purchase. Approving removes the pieces from that purchase's available stock."
        >
        {/* Search & Filter Bar */}
        <div style={{
          background: "white",
          borderRadius: 18,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 4px 20px rgba(74,6,27,0.07)",
          padding: "18px 22px",
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                placeholder="Search by supplier, saree code, return ID, or reason…"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
              {([
                { key: "PENDING", label: `Pending${pendingCount ? ` (${pendingCount})` : ""}` },
                { key: "APPROVED", label: "Approved" },
                { key: "REJECTED", label: "Rejected" },
                { key: "ALL", label: "All" },
              ] as { key: StatusFilter; label: string }[]).map(f => (
                <Button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  size="sm"
                  className={
                    statusFilter === f.key
                      ? "rounded-[10px] bg-[var(--surface-brand)] text-[#FFFDF9] border-none shadow-none"
                      : "rounded-[10px] bg-transparent text-[var(--text-tertiary)] border border-[rgba(110,15,45,0.18)] shadow-none"
                  }
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div style={{ marginBottom: 16 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        {/* Card View / Table View Toggle (Mobile) */}
        <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 mb-4 w-fit">
          <Button
            onClick={() => setViewMode("card")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              viewMode === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            onClick={() => setViewMode("table")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              viewMode === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
            }`}
          >
            <List size={14} /> Table View
          </Button>
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontFamily: F.ui, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 14px" }}>
            {error}
          </div>
        )}

        {/* Mobile View (Card Grid or Table View) */}
        <div className="block md:hidden">
          {isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : isError ? (
            <ErrorState error={undefined} onRetry={() => void refetch()} />
          ) : rows.length === 0 ? (
            statusFilter !== "ALL" ? (
              <FilteredEmptyState onClearFilters={() => setStatusFilter("ALL")} />
            ) : (
              <EmptyState title="No return requests yet" description="Sarees returned to suppliers will show up here." />
            )
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {rows.map(r => {
                const s = STATUS_STYLE[r.status];
                return (
                  <div
                    key={r.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: `1px solid ${T.borderDef}`,
                      boxShadow: "0 2px 12px rgba(74,6,27,0.06)",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: T.royalBurgundy }}>{r.id}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 6, padding: "2.5px 8px" }}>{s.label}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      {r.sareeLine.imageUrl ? (
                        <button type="button" onClick={() => setPreview(r.sareeLine.imageUrl)} className="p-0 border-0 bg-transparent cursor-pointer shrink-0">
                          <img src={r.sareeLine.imageUrl} alt={r.sareeLine.code} style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
                        </button>
                      ) : (
                        <div style={{ width: 50, height: 50, borderRadius: 10, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ImageIcon size={18} color={T.taupe} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.supplier.name}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{r.sareeLine.code}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{[r.sareeLine.sareeType, r.sareeLine.color].filter(Boolean).join(" · ") || "—"}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: T.silkCream, borderRadius: 10, padding: "10px 12px" }}>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>From Purchase</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{r.purchaseId}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Pieces</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{r.quantity}</div>
                      </div>
                    </div>

                    {r.reason && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>
                        "{r.reason}"
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[rgba(110,15,45,0.06)]" style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                      <span>Req: {r.requestedBy.firstName} {r.requestedBy.lastName}</span>
                      {r.status !== "PENDING" && r.decidedBy && (
                        <span>Decided: {r.decidedBy.firstName} {r.decidedBy.lastName}</span>
                      )}
                    </div>

                    {r.status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          iconLeft={CheckCircle2}
                          disabled={decidingId === r.id}
                          onClick={() => decide(r.id, "APPROVED")}
                          className="rounded-[10px]"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          iconLeft={X}
                          disabled={decidingId === r.id}
                          onClick={() => decide(r.id, "REJECTED")}
                          className="rounded-[10px]"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <DataTable responsive columns={columns} data={rows} getRowId={r => r.id} />
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          {isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : isError ? (
            <ErrorState error={undefined} onRetry={() => void refetch()} />
          ) : rows.length === 0 ? (
            statusFilter !== "ALL" ? (
              <FilteredEmptyState onClearFilters={() => setStatusFilter("ALL")} />
            ) : (
              <EmptyState title="No return requests yet" description="Sarees returned to suppliers will show up here." />
            )
          ) : (
            <DataTable responsive columns={columns} data={rows} getRowId={r => r.id} />
          )}
        </div>
      </SectionCard>

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
    </div>
  );
}
