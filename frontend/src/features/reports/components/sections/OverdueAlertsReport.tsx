import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, BellRing, Boxes, ShieldAlert, MessageSquare, Package, Eye } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SumCard, SectionCard, StatusPill } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable } from "../../../../shared/ui/data";
import { invoicesApi } from "../../../../shared/api/invoices";
import { bulkOrdersApi } from "../../../../shared/api/bulk-orders";
import { customersApi } from "../../../../shared/api/customers";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { batchesApi } from "../../../../shared/api/batches";
import { weaversApi } from "../../../../shared/api/weavers";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { jariToReels, formatBunsReels } from "../../../../shared/lib/weightUnits";
import { useRegisterExport } from "../PeriodContext";

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((a.getTime() - b.getTime()) / 86400000));
}

export function SubAlert({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <AlertTriangle size={16} style={{ color, flexShrink: 0 }} />
      <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

export function OverdueAlertsReport() {
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ["reports", "invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const { data: customersRes, isError: customersError, refetch: refetchCustomers } = useQuery({
    queryKey: ["reports", "customers-roster"],
    queryFn: () => customersApi.list(),
  });
  const { data: bulkOrdersRes, isLoading: bulkOrdersLoading, isError: bulkOrdersError, refetch: refetchBulkOrders } = useQuery({
    queryKey: ["reports", "bulk-orders"],
    queryFn: () => bulkOrdersApi.list(),
  });
  const { data: stockRes, isLoading: stockLoading, isError: stockError, refetch: refetchStock } = useQuery({
    queryKey: ["reports", "raw-stock-low"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const { data: batchesRes, isLoading: batchesLoading, isError: batchesError, refetch: refetchBatches } = useQuery({
    queryKey: ["reports", "batches-overdue"],
    queryFn: () => batchesApi.list(),
  });
  const { data: weaversRes, isLoading: weaversLoading, isError: weaversError, refetch: refetchWeavers } = useQuery({
    queryKey: ["reports", "weavers-overdue"],
    queryFn: () => weaversApi.list(),
  });

  const invoicesTableError = invoicesError || customersError;
  const bulkOrdersTableError = bulkOrdersError || customersError;
  const refetchInvoicesTable = () => { void refetchInvoices(); void refetchCustomers(); };
  const refetchBulkOrdersTable = () => { void refetchBulkOrders(); void refetchCustomers(); };

  const customerNameById = useMemo(() => new Map((customersRes?.items ?? []).map(c => [c.id, c.name])), [customersRes]);
  const weaverMap = useMemo(() => new Map((weaversRes?.items ?? []).map(w => [w.id, w])), [weaversRes]);
  const now = useMemo(() => new Date(), []);

  // Dynamic low stock materials from rawMaterialsApi
  const lowStockMaterials = useMemo(() => {
    const items = stockRes?.items ?? [];
    // currentStock / reorderLevel arrive as strings (Prisma Decimal serialises
    // over JSON as text). Compared as-is they sorted lexicographically —
    // "1334" <= "200" is true — flagging healthy stock as running low.
    return items
      .map(item => ({ ...item, currentStock: Number(item.currentStock), reorderLevel: Number(item.reorderLevel) }))
      .filter(item => item.currentStock <= item.reorderLevel)
      .map(item => {
        const isJari = item.materialType === "JARI";
        return {
          type: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
          sub: [item.name, item.color, item.grade].filter(Boolean).join(" - "),
          batch: `RM-${item.id.slice(-6).toUpperCase()}`,
          isJari,
          current: isJari ? jariToReels(item.currentStock, item.unit) : item.currentStock,
          minimum: isJari ? jariToReels(item.reorderLevel, item.unit) : item.reorderLevel,
          shortage: isJari
            ? Math.max(0, jariToReels(item.reorderLevel, item.unit) - jariToReels(item.currentStock, item.unit))
            : Math.max(0, item.reorderLevel - item.currentStock),
          lastOrder: item.vendor?.name ?? "Vendor",
        };
      });
  }, [stockRes]);

  // Dynamic late weavers from active batches with overdue dueDates. One
  // batch commonly assigns several sarees to the same weaver, so rows are
  // aggregated per weaver+batch (summing done/remaining) rather than pushed
  // one per saree — pushing one per saree produced duplicate `code+batch`
  // keys (e.g. two "Ramarao-005" rows for "BATCH-014") wherever a weaver had
  // more than one saree in the same overdue batch.
  const lateWeavers = useMemo(() => {
    const batches = batchesRes?.items ?? [];
    const lateMap = new Map<string, { name: string; code: string; batch: string; expected: string; days: number; done: number; remaining: number }>();

    for (const b of batches) {
      if (b.status === "ACTIVE" && new Date(b.dueDate).getTime() < now.getTime()) {
        for (const r of b.rows) {
          if (r.weaverId && r.recipientType === "WEAVER") {
            const weaver = weaverMap.get(r.weaverId);
            const code = weaver?.code ?? r.weaverId;
            const key = `${code}::${b.id}`;
            const days = daysBetween(now, new Date(b.dueDate));
            const existing = lateMap.get(key);
            if (existing) {
              if (r.qcPassed) existing.done += 1;
              else existing.remaining += 1;
            } else {
              lateMap.set(key, {
                name: weaver?.name ?? "Weaver",
                code,
                batch: b.id,
                expected: new Date(b.dueDate).toLocaleDateString("en-IN"),
                days,
                done: r.qcPassed ? 1 : 0,
                remaining: r.qcPassed ? 0 : 1,
              });
            }
          }
        }
      }
    }
    return Array.from(lateMap.values()).slice(0, 10);
  }, [batchesRes, weaverMap, now]);

  const overdueCustomers = (invoicesRes?.items ?? [])
    .filter(inv => inv.status === "OVERDUE")
    .map(inv => ({
      customer: inv.customer?.name ?? customerNameById.get(inv.customerId) ?? "Unknown Customer",
      inv: inv.code ?? inv.id,
      total: Number(inv.total),
      paid: Number(inv.paid),
      overdue: Number(inv.total) - Number(inv.paid),
      dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "—",
      days: inv.dueDate ? daysBetween(now, new Date(inv.dueDate)) : 0,
    }));

  const atRiskOrders = (bulkOrdersRes?.items ?? [])
    .filter(o => o.status === "AT_RISK" || o.status === "OVERDUE")
    .map(o => ({
      customer: customerNameById.get(o.customerId) ?? "Unknown Customer",
      order: o.ref,
      ordered: o.total,
      produced: o.done,
      shortage: o.shortage,
      deadline: new Date(o.dueDate).toLocaleDateString("en-IN"),
      daysLeft: daysBetween(new Date(o.dueDate), now),
      status: o.status === "OVERDUE" ? "Overdue" : "At Risk",
    }));

  // Alerts are live status, not a period report — the export mirrors the four
  // alert tables as one flat "what needs action now" sheet.
  useRegisterExport(useMemo(() => ({
    name: "Overdue and Alerts Report",
    headers: ["Alert Type", "Subject", "Reference", "Detail", "Amount / Quantity", "Due"],
    rows: [
      ...overdueCustomers.map(r => ["Overdue Invoice", r.customer, r.inv, `${r.days} days overdue`, r.overdue, r.dueDate]),
      ...lowStockMaterials.map(r => ["Low Stock", `${r.type} — ${r.sub}`, r.batch, `Shortage ${r.shortage}${r.isJari ? " reels" : " kg"}`, r.current, ""]),
      ...lateWeavers.map(r => ["Late Weaver", r.name, r.code, `${r.remaining} remaining in ${r.batch}`, r.days, r.expected]),
      ...atRiskOrders.map(r => ["Bulk Order at Risk", r.customer, r.order, r.status, r.shortage, r.deadline]),
    ],
  }), [overdueCustomers, lowStockMaterials, lateWeavers, atRiskOrders]));

  return (
    <div id="rep-overdue" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
    <SectionCard
      icon={BellRing}
      title="Overdue & Alerts Report"
      subtitle="Everything that needs urgent attention — overdue customer payments, low raw material stock, weavers running late, and bulk orders at risk. This report is generated fresh every day."
    >
      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={14} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "#7B5C18" }}>This report always shows today's live status. Period filter does not apply.</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold, marginLeft: "auto" }}>{now.toLocaleDateString("en-IN")} · {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* 4 alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16, marginBottom: 32, alignItems: "stretch" }}>
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Customer Invoices Overdue" value={`${overdueCustomers.length} invoices`} sub="Immediate follow-up needed" crimsonHi />
        <SumCard icon={<Boxes size={22} color={T.antiqueGold} />} label="Raw Material Running Low" value={`${lowStockMaterials.length} items`} sub="Place purchase orders now" hi />
        <SumCard icon={<Clock size={22} color={T.crimson} />} label="Weavers Running Behind Schedule" value={`${lateWeavers.length} weavers`} sub="Batches delayed" crimsonHi />
        <SumCard icon={<ShieldAlert size={22} color={T.antiqueGold} />} label="Bulk Orders at Risk" value={`${atRiskOrders.length} orders`} sub="May miss deadline" hi />
      </div>

      {/* Overdue customers */}
      <FadeUp>
        <SubAlert label="Overdue Customer Payments — Act Now" color={T.crimson} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div className="w-full">
            <div className="min-w-[850px]">
              <DataTable<(typeof overdueCustomers)[number]>
                columns={[
                  { id: "customer", header: "Customer Name", accessor: r => r.customer, priority: 1, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span> },
                  { id: "inv", header: "Invoice No.", accessor: r => r.inv, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.inv}</span> },
                  { id: "total", header: "Invoice Amount", accessor: r => r.total, align: "end", priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}><Money value={rupees(r.total)} /></span> },
                  { id: "paid", header: "Amount Paid", accessor: r => r.paid, align: "end", priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", color: T.green }}><Money value={rupees(r.paid)} /></span> },
                  { id: "overdue", header: "Amount Overdue", accessor: r => r.overdue, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}><Money value={rupees(r.overdue)} /></span> },
                  { id: "dueDate", header: "Due Date", accessor: r => r.dueDate, cell: (_v, r) => <span style={{ color: T.crimson, fontWeight: 600 }}>{r.dueDate}</span> },
                  { id: "days", header: "Days Overdue", accessor: r => r.days, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.crimson }}>{r.days}d overdue</span> },
                  { id: "reminder", header: "Last Reminder Sent", accessor: () => "—", priority: 3, cell: () => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>—</span> },
                  { id: "action", header: "Action", accessor: () => null, type: "actions", align: "center", cell: () => <Button variant="primary" size="sm" iconLeft={MessageSquare}>Send WhatsApp Reminder</Button> },
                ]}
                data={overdueCustomers}
                getRowId={r => r.inv}
                loading={invoicesLoading}
                error={!invoicesLoading && !!invoicesTableError}
                onRetry={refetchInvoicesTable}
                emptyTitle="No overdue invoices — everything is on track."
                pagination
                responsive={false}
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Low stock */}
      <FadeUp>
        <SubAlert label="Materials Running Low — Order Soon" color={T.antiqueGold} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div className="w-full">
            <div className="min-w-[850px]">
              <DataTable<(typeof lowStockMaterials)[number]>
                columns={[
                  { id: "type", header: "Material Type", accessor: r => r.type, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span> },
                  { id: "sub", header: "Sub-type / Color / Grade", accessor: r => r.sub, priority: 1 },
                  { id: "batch", header: "Batch No.", accessor: r => r.batch, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.batch}</span> },
                  { id: "current", header: "Current Stock", accessor: r => r.current, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}>{r.isJari ? formatBunsReels(r.current) : `${r.current} kg`}</span> },
                  { id: "minimum", header: "Minimum Required", accessor: r => r.minimum, align: "end", priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)" }}>{r.isJari ? formatBunsReels(r.minimum) : `${r.minimum} kg`}</span> },
                  { id: "shortage", header: "Shortage", accessor: r => r.shortage, align: "end", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}>{r.isJari ? formatBunsReels(r.shortage) : `${r.shortage} kg`}</span> },
                  { id: "lastOrder", header: "Last Ordered From", accessor: r => r.lastOrder, priority: 3, cell: (_v, r) => <span style={{ color: T.taupe }}>{r.lastOrder}</span> },
                  { id: "action", header: "Action", accessor: () => null, type: "actions", align: "center", cell: () => <Button variant="primary" size="sm" iconLeft={Package}>Create Purchase Order</Button> },
                ]}
                data={lowStockMaterials}
                getRowId={r => r.batch}
                loading={stockLoading}
                error={stockError}
                onRetry={refetchStock}
                emptyTitle="No materials currently low in stock."
                pagination
                responsive={false}
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Late weavers */}
      <FadeUp>
        <SubAlert label="Weavers Behind Schedule — Follow Up" color={T.crimson} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div className="w-full">
            <div className="min-w-[850px]">
              <DataTable<(typeof lateWeavers)[number]>
                columns={[
                  { id: "name", header: "Weaver Name", accessor: r => r.name, priority: 1, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span> },
                  { id: "code", header: "Code", accessor: r => r.code, priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.code}</span> },
                  { id: "batch", header: "Batch No.", accessor: r => r.batch, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.batch}</span> },
                  { id: "expected", header: "Expected End Date", accessor: r => r.expected, cell: (_v, r) => <span style={{ color: T.crimson, fontWeight: 600 }}>{r.expected}</span> },
                  { id: "days", header: "Days Overdue", accessor: r => r.days, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.crimson }}>{r.days}d late</span> },
                  { id: "done", header: "Sarees Done", accessor: r => r.done, align: "center", priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.green }}>{r.done}</span> },
                  { id: "remaining", header: "Sarees Remaining", accessor: r => r.remaining, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}>{r.remaining}</span> },
                  { id: "action", header: "Action", accessor: () => null, type: "actions", align: "center", cell: () => <Button variant="primary" size="sm" iconLeft={MessageSquare}>Send Message</Button> },
                ]}
                data={lateWeavers}
                getRowId={r => r.code + r.batch}
                loading={batchesLoading || weaversLoading}
                error={batchesError || weaversError}
                onRetry={() => { void refetchBatches(); void refetchWeavers(); }}
                emptyTitle="No weavers running behind schedule."
                pagination
                responsive={false}
              />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Bulk orders at risk */}
      <FadeUp>
        <SubAlert label="Bulk Orders That May Miss Deadline" color={T.antiqueGold} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div className="w-full">
            <div className="min-w-[850px]">
              <DataTable<(typeof atRiskOrders)[number]>
                columns={[
                  { id: "customer", header: "Customer Name", accessor: r => r.customer, priority: 1, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span> },
                  { id: "order", header: "Order No.", accessor: r => r.order, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.order}</span> },
                  { id: "ordered", header: "Sarees Ordered", accessor: r => r.ordered, align: "center", priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.ordered}</span> },
                  { id: "produced", header: "Sarees Produced", accessor: r => r.produced, align: "center", priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.green }}>{r.produced}</span> },
                  { id: "shortage", header: "Shortage", accessor: r => r.shortage, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.crimson }}>{r.shortage}</span> },
                  { id: "deadline", header: "Deadline", accessor: r => r.deadline, priority: 3, cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.deadline}</span> },
                  { id: "daysLeft", header: "Days Remaining", accessor: r => r.daysLeft, align: "center", cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: r.daysLeft < 10 ? T.crimson : T.antiqueGold }}>{r.daysLeft} days</span> },
                  { id: "status", header: "Status", accessor: r => r.status, type: "status", align: "center", cell: (_v, r) => <StatusPill label={r.status} type="bad" /> },
                  { id: "action", header: "Action", accessor: () => null, type: "actions", align: "center", cell: () => <Button variant="secondary" size="sm" iconLeft={Eye}>View Order</Button> },
                ]}
                data={atRiskOrders}
                getRowId={r => r.order}
                loading={bulkOrdersLoading}
                error={!bulkOrdersLoading && !!bulkOrdersTableError}
                onRetry={refetchBulkOrdersTable}
                emptyTitle="No bulk orders at risk right now."
                pagination
                responsive={false}
              />
            </div>
          </div>
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
