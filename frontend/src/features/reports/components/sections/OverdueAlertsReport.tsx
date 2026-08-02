import React from "react";
import { AlertTriangle, Clock, BellRing, Boxes, ShieldAlert, MessageSquare, Package, Eye } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SumCard, TabTitle, StatusPill, TH, TD } from "../common/primitives";

const overdueCustomers = [
  { customer: "Padmavathi Textiles",    inv: "INV-2026-038", total: 600000,  paid: 465000, overdue: 135000, dueDate: "25 Apr 2026", days: 5,  lastReminder: "20 May 2026" },
  { customer: "Narayana Silk Emporium", inv: "INV-2026-032", total: 300000,  paid: 254400, overdue: 45600,  dueDate: "20 Apr 2026", days: 3,  lastReminder: "19 May 2026" },
  { customer: "Kalavathi Exports",      inv: "INV-2026-027", total: 660000,  paid: 614400, overdue: 45600,  dueDate: "02 May 2026", days: 2,  lastReminder: "21 May 2026" },
];
const lowStockMaterials = [
  { type: "Resham", sub: "Blue",   batch: "RSH-B-022", current: 0, minimum: 5, shortage: 5, lastOrder: "Natraj Traders" },
  { type: "Resham", sub: "Maroon", batch: "RSH-M-018", current: 0, minimum: 5, shortage: 5, lastOrder: "Natraj Traders" },
  { type: "Resham", sub: "Cream",  batch: "RSH-C-019", current: 0, minimum: 4, shortage: 4, lastOrder: "Kumar Silks"    },
];
const lateWeavers = [
  { name: "Anand K.",  code: "WV-005", batch: "BK-2026-03", expected: "20 May 2026", days: 11, done: 5, remaining: 2 },
  { name: "Meena R.",  code: "WV-012", batch: "BK-2026-05", expected: "22 May 2026", days: 9,  done: 4, remaining: 1 },
];
const bulkOrders = [
  { customer: "Meenakshi Silks",  order: "BO-2026-01", ordered: 20, produced: 12, shortage: 8, deadline: "15 Jun 2026", daysLeft: 14, status: "At Risk"  },
  { customer: "Lakshmi Silks",    order: "BO-2026-02", ordered: 15, produced: 8,  shortage: 7, deadline: "10 Jun 2026", daysLeft: 9,  status: "At Risk"  },
];

export function SubAlert({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <AlertTriangle size={16} style={{ color, flexShrink: 0 }} />
      <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

export function OverdueAlertsReport() {
  return (
    <div id="rep-overdue" style={{ padding: "32px 40px" }}>
      <TabTitle title="Overdue & Alerts Report"
        sub="Everything that needs urgent attention — overdue customer payments, low raw material stock, weavers running late, and bulk orders at risk. This report is generated fresh every day." />

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={14} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "#7B5C18" }}>This report always shows today's live status. Period filter does not apply.</span>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, marginLeft: "auto" }}>Live as of 01 Jun 2026 · 9:00 AM</span>
      </div>

      {/* 4 alert cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Customer Invoices Overdue" value="3 invoices" sub="Immediate follow-up needed" crimsonHi />
        <SumCard icon={<Boxes size={22} color={T.antiqueGold} />} label="Raw Material Running Low" value="3 items" sub="Place purchase orders now" hi />
        <SumCard icon={<Clock size={22} color={T.crimson} />} label="Weavers Running Behind Schedule" value="2 weavers" sub="Batches delayed" crimsonHi />
        <SumCard icon={<ShieldAlert size={22} color={T.antiqueGold} />} label="Bulk Orders at Risk" value="2 orders" sub="May miss deadline" hi />
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
                {overdueCustomers.map((r, i) => (
                  <tr key={r.inv} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.inv}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.total.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green }}>₹{r.paid.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>₹{r.overdue.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, color: T.crimson, fontWeight: 600 }}>{r.dueDate}</td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.crimson }}>{r.days}d overdue</span>
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.lastReminder}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                        <MessageSquare size={11} />Send WhatsApp Reminder
                      </button>
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
                {lowStockMaterials.map((r, i) => (
                  <tr key={r.batch} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span></td>
                    <td style={TD}>{r.sub}</td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.batch}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.current} kg</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono }}>{r.minimum} kg</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.shortage} kg</td>
                    <td style={TD}><span style={{ color: T.taupe }}>{r.lastOrder}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                        <Package size={11} />Create Purchase Order
                      </button>
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
              {lateWeavers.map((r, i) => (
                <tr key={r.code} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.code}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.batch}</span></td>
                  <td style={{ ...TD, color: T.crimson, fontWeight: 600 }}>{r.expected}</td>
                  <td style={{ ...TD, textAlign: "center" }}><span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.crimson }}>{r.days}d late</span></td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green }}>{r.done}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.remaining}</td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                      <MessageSquare size={11} />Send Message
                    </button>
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
              {bulkOrders.map((r, i) => (
                <tr key={r.order} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.antiqueGold}` }}>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.order}</span></td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.ordered}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green }}>{r.produced}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.shortage}</td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{r.deadline}</span></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: r.daysLeft < 10 ? T.crimson : T.antiqueGold }}>{r.daysLeft} days</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.status} type="bad" /></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                      <Eye size={11} />View Order
                    </button>
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

