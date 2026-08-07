import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, BellRing, Boxes, ShieldAlert, MessageSquare, Package, Eye } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SumCard, TabTitle, StatusPill, TH, TD } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";
import { invoicesApi } from "../../../../shared/api/invoices";
import { bulkOrdersApi } from "../../../../shared/api/bulk-orders";
import { customersApi } from "../../../../shared/api/customers";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { batchesApi } from "../../../../shared/api/batches";
import { weaversApi } from "../../../../shared/api/weavers";

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
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError } = useQuery({
    queryKey: ["reports", "invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const { data: customersRes, isError: customersError } = useQuery({
    queryKey: ["reports", "customers-roster"],
    queryFn: () => customersApi.list(),
  });
  const { data: bulkOrdersRes, isLoading: bulkOrdersLoading, isError: bulkOrdersError } = useQuery({
    queryKey: ["reports", "bulk-orders"],
    queryFn: () => bulkOrdersApi.list(),
  });
  const { data: stockRes } = useQuery({
    queryKey: ["reports", "raw-stock-low"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const { data: batchesRes } = useQuery({
    queryKey: ["reports", "batches-overdue"],
    queryFn: () => batchesApi.list(),
  });
  const { data: weaversRes } = useQuery({
    queryKey: ["reports", "weavers-overdue"],
    queryFn: () => weaversApi.list(),
  });

  const invoicesTableError = invoicesError || customersError;
  const bulkOrdersTableError = bulkOrdersError || customersError;

  const customerNameById = useMemo(() => new Map((customersRes?.items ?? []).map(c => [c.id, c.name])), [customersRes]);
  const weaverMap = useMemo(() => new Map((weaversRes?.items ?? []).map(w => [w.id, w])), [weaversRes]);
  const now = new Date();

  // Dynamic low stock materials from rawMaterialsApi
  const lowStockMaterials = useMemo(() => {
    const items = stockRes?.items ?? [];
    return items
      .filter(item => item.currentStock <= item.reorderLevel)
      .map(item => ({
        type: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
        sub: [item.name, item.color, item.grade].filter(Boolean).join(" - "),
        batch: `RM-${item.id.slice(-6).toUpperCase()}`,
        current: item.currentStock,
        minimum: item.reorderLevel,
        shortage: Math.max(0, item.reorderLevel - item.currentStock),
        lastOrder: item.vendor?.name ?? "Vendor",
      }));
  }, [stockRes]);

  // Dynamic late weavers from active batches with overdue dueDates
  const lateWeavers = useMemo(() => {
    const batches = batchesRes?.items ?? [];
    const lateList: { name: string; code: string; batch: string; expected: string; days: number; done: number; remaining: number }[] = [];

    for (const b of batches) {
      if (b.status === "ACTIVE" && new Date(b.dueDate).getTime() < now.getTime()) {
        for (const r of b.rows) {
          if (r.weaverId && r.recipientType === "WEAVER") {
            const weaver = weaverMap.get(r.weaverId);
            const name = weaver?.name ?? "Weaver";
            const days = daysBetween(now, new Date(b.dueDate));
            lateList.push({
              name,
              code: r.weaverId,
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
    return lateList.slice(0, 10);
  }, [batchesRes, weaverMap, now]);

  const overdueCustomers = (invoicesRes?.items ?? [])
    .filter(inv => inv.status === "OVERDUE")
    .map(inv => ({
      customer: inv.customer?.name ?? customerNameById.get(inv.customerId) ?? "Unknown Customer",
      inv: inv.id,
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

  return (
    <div id="rep-overdue" style={{ padding: "32px 40px" }}>
      <TabTitle title="Overdue & Alerts Report"
        sub="Everything that needs urgent attention — overdue customer payments, low raw material stock, weavers running late, and bulk orders at risk. This report is generated fresh every day." />

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={14} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "#7B5C18" }}>This report always shows today's live status. Period filter does not apply.</span>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, marginLeft: "auto" }}>{now.toLocaleDateString("en-IN")} · {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* 4 alert cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Customer Invoices Overdue" value={`${overdueCustomers.length} invoices`} sub="Immediate follow-up needed" crimsonHi />
        <SumCard icon={<Boxes size={22} color={T.antiqueGold} />} label="Raw Material Running Low" value={`${lowStockMaterials.length} items`} sub="Place purchase orders now" hi />
        <SumCard icon={<Clock size={22} color={T.crimson} />} label="Weavers Running Behind Schedule" value={`${lateWeavers.length} weavers`} sub="Batches delayed" crimsonHi />
        <SumCard icon={<ShieldAlert size={22} color={T.antiqueGold} />} label="Bulk Orders at Risk" value={`${atRiskOrders.length} orders`} sub="May miss deadline" hi />
      </div>

      {/* Overdue customers */}
      <FadeUp>
        <SubAlert label="Overdue Customer Payments — Act Now" color={T.crimson} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Customer Name</th><th style={TH}>Invoice No.</th>
                  <th style={{ ...TH, textAlign: "right" }}>Invoice Amount</th><th style={{ ...TH, textAlign: "right" }}>Amount Paid</th>
                  <th style={{ ...TH, textAlign: "right" }}>Amount Overdue</th><th style={TH}>Due Date</th>
                  <th style={{ ...TH, textAlign: "center" }}>Days Overdue</th><th style={TH}>Last Reminder Sent</th>
                  <th style={{ ...TH, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoicesLoading && (
                  <tr><td style={TD} colSpan={9}>Loading…</td></tr>
                )}
                {!invoicesLoading && invoicesTableError && (
                  <tr><td style={{ ...TD, color: T.crimson }} colSpan={9}>Failed to load overdue invoices.</td></tr>
                )}
                {!invoicesLoading && !invoicesTableError && overdueCustomers.length === 0 && (
                  <tr><td style={TD} colSpan={9}>No overdue invoices — everything is on track.</td></tr>
                )}
                {!invoicesLoading && !invoicesTableError && overdueCustomers.map((r, i) => (
                  <tr key={r.inv} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.inv}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.total.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green }}>₹{r.paid.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>₹{r.overdue.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, color: T.crimson, fontWeight: 600 }}>{r.dueDate}</td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson }}>{r.days}d overdue</span>
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>—</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <Button variant="primary" size="sm" iconLeft={MessageSquare}>
                        Send WhatsApp Reminder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Low stock */}
      <FadeUp>
        <SubAlert label="Materials Running Low — Order Soon" color={T.antiqueGold} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={TH}>Material Type</th><th style={TH}>Sub-type / Color / Grade</th>
                  <th style={TH}>Batch No.</th><th style={{ ...TH, textAlign: "right" }}>Current Stock</th>
                  <th style={{ ...TH, textAlign: "right" }}>Minimum Required</th><th style={{ ...TH, textAlign: "right" }}>Shortage</th>
                  <th style={TH}>Last Ordered From</th><th style={{ ...TH, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockMaterials.length === 0 && (
                  <tr><td style={TD} colSpan={8}>No materials currently low in stock.</td></tr>
                )}
                {lowStockMaterials.map((r, i) => (
                  <tr key={r.batch} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span></td>
                    <td style={TD}>{r.sub}</td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.batch}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.current} kg</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono }}>{r.minimum} kg</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.shortage} kg</td>
                    <td style={TD}><span style={{ color: T.taupe }}>{r.lastOrder}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <Button variant="primary" size="sm" iconLeft={Package}>
                        Create Purchase Order
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Late weavers */}
      <FadeUp>
        <SubAlert label="Weavers Behind Schedule — Follow Up" color={T.crimson} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Weaver Name</th><th style={TH}>Code</th><th style={TH}>Batch No.</th>
                <th style={TH}>Expected End Date</th><th style={{ ...TH, textAlign: "center" }}>Days Overdue</th>
                <th style={{ ...TH, textAlign: "center" }}>Sarees Done</th><th style={{ ...TH, textAlign: "center" }}>Sarees Remaining</th>
                <th style={{ ...TH, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lateWeavers.length === 0 && (
                <tr><td style={TD} colSpan={8}>No weavers running behind schedule.</td></tr>
              )}
              {lateWeavers.map((r, i) => (
                <tr key={r.code + r.batch} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.code}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.batch}</span></td>
                  <td style={{ ...TD, color: T.crimson, fontWeight: 600 }}>{r.expected}</td>
                  <td style={{ ...TD, textAlign: "center" }}><span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson }}>{r.days}d late</span></td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green }}>{r.done}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.remaining}</td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <Button variant="primary" size="sm" iconLeft={MessageSquare}>
                      Send Message
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeUp>

      {/* Bulk orders at risk */}
      <FadeUp>
        <SubAlert label="Bulk Orders That May Miss Deadline" color={T.antiqueGold} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Customer Name</th><th style={TH}>Order No.</th>
                <th style={{ ...TH, textAlign: "center" }}>Sarees Ordered</th><th style={{ ...TH, textAlign: "center" }}>Sarees Produced</th>
                <th style={{ ...TH, textAlign: "center" }}>Shortage</th><th style={TH}>Deadline</th>
                <th style={{ ...TH, textAlign: "center" }}>Days Remaining</th>
                <th style={{ ...TH, textAlign: "center" }}>Status</th><th style={{ ...TH, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bulkOrdersLoading && (
                <tr><td style={TD} colSpan={9}>Loading…</td></tr>
              )}
              {!bulkOrdersLoading && bulkOrdersTableError && (
                <tr><td style={{ ...TD, color: T.crimson }} colSpan={9}>Failed to load bulk orders at risk.</td></tr>
              )}
              {!bulkOrdersLoading && !bulkOrdersTableError && atRiskOrders.length === 0 && (
                <tr><td style={TD} colSpan={9}>No bulk orders at risk right now.</td></tr>
              )}
              {!bulkOrdersLoading && !bulkOrdersTableError && atRiskOrders.map((r, i) => (
                <tr key={r.order} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.antiqueGold}` }}>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.order}</span></td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.ordered}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green }}>{r.produced}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.shortage}</td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12 }}>{r.deadline}</span></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: r.daysLeft < 10 ? T.crimson : T.antiqueGold }}>{r.daysLeft} days</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.status} type="bad" /></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <Button variant="secondary" size="sm" iconLeft={Eye}>
                      View Order
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeUp>
    </div>
  );
}
