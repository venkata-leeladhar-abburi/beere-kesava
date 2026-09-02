import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Search, XCircle } from "lucide-react";

import { C, F, SectionCard } from "./theme";
import { consignmentLabel } from "./ReceiveDispatchModal";
import { shopReceiptsApi, shopReceiptKeys, type ShopReceipt, type ShopReceiptItemStatus } from "../../../../shared/api/shop-receipts";
import { Input } from "../../../../shared/ui/primitives";
import { EntityCode } from "../../../../shared/ui/domain";
import { DataTable, ViewToggle, type ColumnDef, type DataView } from "../../../../shared/ui/data";
import { DateFilterBar, DEFAULT_DATE_FILTER, matchesDateFilter, type DateFilterState } from "../../../../shared/ui/DateFilterBar";

/**
 * Received-dispatch history — every receipt this shop has raised, newest first.
 *
 * The receipt number (SGR-<FY>-NNN) is the record: it is what the counter quotes
 * when a shortage is chased, and it ties back to the challan (DC-<FY>-NNN) the
 * factory dispatched under. Rows expand to the per-saree verdicts, because the
 * discrepancies are the only part anyone comes back to this table to read.
 */

const fmtDateTime = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const STATUS_META: Record<ShopReceiptItemStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  RECEIVED: { label: "Received", icon: CheckCircle2, color: "#0F766E" },
  DAMAGED: { label: "Damaged", icon: AlertTriangle, color: "#B45309" },
  MISSING: { label: "Missing", icon: XCircle, color: "#C0392B" },
};

function tally(receipt: ShopReceipt) {
  return {
    received: receipt.items.filter(i => i.status === "RECEIVED").length,
    damaged: receipt.items.filter(i => i.status === "DAMAGED").length,
    missing: receipt.items.filter(i => i.status === "MISSING").length,
  };
}

export function ReceivedHistorySection() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dataView, setDataView] = useState<DataView>("table");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: shopReceiptKeys.history,
    queryFn: () => shopReceiptsApi.list(),
  });

  const receipts = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receipts.filter(r => {
      if (!matchesDateFilter(r.receivedAt, dateFilter)) return false;
      if (!q) return true;
      return (
        r.code.toLowerCase().includes(q) ||
        (r.dispatch.challanNumber ?? "").toLowerCase().includes(q) ||
        (r.dispatch.lrNumber ?? "").toLowerCase().includes(q) ||
        r.items.some(i => i.sareeId.toLowerCase().includes(q))
      );
    });
  }, [receipts, search, dateFilter]);

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const columns: ColumnDef<ShopReceipt>[] = [
    {
      id: "code",
      header: "Receipt No.",
      type: "code",
      priority: 1,
      accessor: r => r.code,
      cell: (_v, r) => (
        <button
          type="button"
          onClick={() => toggle(r.id)}
          aria-expanded={expanded.has(r.id)}
          aria-label={`${expanded.has(r.id) ? "Hide" : "Show"} the sarees on receipt ${r.code}`}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            padding: 0, cursor: "pointer",
          }}
        >
          {expanded.has(r.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <EntityCode type="shopReceipt" value={r.code} size="sm" />
        </button>
      ),
    },
    {
      id: "consignment",
      header: "Consignment",
      accessor: r => consignmentLabel(r.dispatch),
    },
    {
      id: "receivedAt",
      header: "Received on",
      sortable: true,
      accessor: r => r.receivedAt,
      cell: (_v, r) => fmtDateTime(r.receivedAt),
    },
    {
      id: "receivedBy",
      header: "Received by",
      accessor: r => (r.receivedBy ? `${r.receivedBy.firstName} ${r.receivedBy.lastName}`.trim() : "—"),
    },
    {
      id: "counts",
      header: "Sarees",
      accessor: r => tally(r).received,
      cell: (_v, r) => {
        const t = tally(r);
        return (
          <span style={{ fontFamily: F.u, fontSize: 12.5 }}>
            <span style={{ color: "#0F766E", fontWeight: 600 }}>{t.received} received</span>
            {t.damaged > 0 && <span style={{ color: "#B45309" }}> · {t.damaged} damaged</span>}
            {t.missing > 0 && <span style={{ color: "#C0392B" }}> · {t.missing} missing</span>}
          </span>
        );
      },
    },
  ];

  return (
    <div style={{ margin: "0 20px" }}>
      <SectionCard
        icon={ClipboardCheck}
        title="Received dispatch history"
        subtitle="Every goods receipt this shop has raised, with what was short or damaged"
        bodyPadding="20px"
      >
        <div style={{ marginBottom: 14 }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by receipt no., challan, LR number or saree ID"
            iconLeft={Search}
            size="lg"
            containerClassName="rounded-xl h-12"
          />
        </div>

        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          <ViewToggle value={dataView} onChange={setDataView} />
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          getRowId={r => r.id}
          caption="Shop goods receipts raised at this counter"
          density="compact"
          view={dataView}
          pagination
          loading={isLoading}
          error={isError}
          onRetry={() => void refetch()}
          isFiltered={search.trim() !== "" || dateFilter.mode !== "all"}
          onClearFilters={() => { setSearch(""); setDateFilter(DEFAULT_DATE_FILTER); }}
          emptyTitle="No receipts yet"
          emptyDescription="Consignments received at this counter will be listed here."
        />

        {/* Expanded detail sits below the table rather than inside it: the
            per-saree verdicts are a second table's worth of content, and
            nesting one inside a row breaks the responsive card layout. */}
        {filtered.filter(r => expanded.has(r.id)).map(r => (
          <div
            key={r.id}
            style={{ marginTop: 14, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px", background: C.white }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontFamily: F.u, fontWeight: 700, fontSize: 13.5, color: C.text, marginBottom: 8 }}>
              <EntityCode type="shopReceipt" value={r.code} size="sm" copyable />
              <span>· {consignmentLabel(r.dispatch)}</span>
              {r.dispatch.dispatchedBy && (
                <span style={{ fontWeight: 500, color: C.muted }}>
                  {" "}· dispatched by {r.dispatch.dispatchedBy.firstName} {r.dispatch.dispatchedBy.lastName}
                </span>
              )}
            </div>
            {r.notes && (
              <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginBottom: 10 }}>Note: {r.notes}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {r.items.map(item => {
                const meta = STATUS_META[item.status];
                const Icon = meta.icon;
                return (
                  <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "baseline", fontFamily: F.u, fontSize: 12.5 }}>
                    <Icon size={13} color={meta.color} style={{ flexShrink: 0, alignSelf: "center" }} />
                    <span style={{ fontWeight: 600, color: C.text }}>{item.sareeId}</span>
                    <span style={{ color: meta.color }}>{meta.label}</span>
                    {item.remarks && <span style={{ color: C.muted }}>— {item.remarks}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
