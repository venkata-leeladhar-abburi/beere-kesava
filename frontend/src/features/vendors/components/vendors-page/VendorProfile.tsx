import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin, Phone, Building2, FileText,
  IndianRupee, AlertTriangle, Package, Trash2,
} from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "./theme";
import { Vendor, VendorBill, VendorPaymentTxn } from "./types";
import { PAY_MODE_FILL } from "./data";
import { StatusPill, StarRating } from "./SharedBits";
import { StatusPill as DomainStatusPill, EntityCode } from "../../../../shared/ui/domain";
import type { StatusValueOf } from "../../../../lib/domain/status";
import { PurchaseOrderHistoryTable } from "./PurchaseOrderHistoryTable";
import { FadeUp } from "./FadeUp";
import { VendorEditFormTab } from "./VendorEditFormTab";
import { purchaseOrdersApi } from "../../../../shared/api/purchase-orders";
import { Button } from "../../../../shared/ui/primitives";
import { vendorBillsApi, VendorBillStatus } from "../../../../shared/api/vendor-bills";
import { vendorPaymentsApi } from "../../../../shared/api/payments";
import { useMoneyVisible } from "../../../../shared/ui/MoneyValue";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { recordView, useConfirm } from "../../../../shared/ui/overlay";

export function VendorProfile({ vendor, onBack, onUpdate, onDelete }: { vendor: Vendor; onBack: () => void; onUpdate?: (v: Vendor) => void; onDelete?: (v: Vendor) => void }) {
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
  const confirm = useConfirm();

  // Command palette RECENT group (design-system/05-OVERLAYS.md Part H) —
  // record this profile as viewed once per mount.
  useEffect(() => {
    recordView({ key: `vendor:${vendor.id}`, label: vendor.name, path: "/admin/vendors", kind: "Vendor" });
  }, [vendor.id, vendor.name]);
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Order History" },
    { key: "payments", label: "Payment History" },
    { key: "contact", label: "Contact Details" },
    { key: "edit", label: "Edit Profile" },
  ] as const;
  const [orderDateFilter, setOrderDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payFilter, setPayFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const { data: poRes, isLoading: posLoading, isError: posError } = useQuery({
    queryKey: ["vendor-pos", vendor.id],
    queryFn: () => purchaseOrdersApi.list(),
  });
  const { data: billsRes, isLoading: billsLoading, isError: billsError } = useQuery({
    queryKey: ["vendor-bills", vendor.id],
    queryFn: () => vendorBillsApi.list(vendor.id),
  });
  const { data: paymentsRes, isLoading: paymentsLoading, isError: paymentsError } = useQuery({
    queryKey: ["vendor-payments", vendor.id],
    queryFn: () => vendorPaymentsApi.list(vendor.id),
  });
  const ledgerLoading = billsLoading || paymentsLoading;
  const ledgerError = billsError || paymentsError;

  const BILL_STATUS_LABEL: Record<VendorBillStatus, VendorBill["status"]> = {
    PAID: "Paid", PARTIAL: "Partial", PENDING: "Pending", OVERDUE: "Overdue",
  };
  // VendorBill.status normalized onto the shared payment taxonomy
  // (lib/domain/status.ts) per design-system/06-DOMAIN.md Part D.
  const BILL_STATUS_KEY: Record<VendorBill["status"], StatusValueOf<"payment">> = {
    Paid: "paid", Partial: "partial", Pending: "unpaid", Overdue: "overdue",
  };

  const ledger = React.useMemo(() => {
    const rawBills = billsRes?.items ?? [];
    const rawPayments = paymentsRes?.items ?? [];
    const today = new Date();

    const bills: VendorBill[] = rawBills.map(b => {
      const paid = rawPayments
        .filter(p => p.billId === b.id)
        .reduce((a, p) => a + Number(p.amount), 0);
      const amount = Number(b.amount);
      const balance = Math.max(0, amount - paid);
      const dueDateObj = b.dueDate ? new Date(b.dueDate) : null;
      const daysOverdue = b.status === "OVERDUE" && dueDateObj
        ? Math.max(0, Math.ceil((today.getTime() - dueDateObj.getTime()) / 86400000))
        : 0;
      return {
        id: b.id.slice(0, 8).toUpperCase(),
        invoiceNo: b.poId ? `PO ${b.poId.slice(0, 8).toUpperCase()}` : (b.description || "—"),
        date: b.createdAt ? b.createdAt.split("T")[0] : "",
        dueDate: b.dueDate ? b.dueDate.split("T")[0] : "—",
        amount, paid, balance,
        status: BILL_STATUS_LABEL[b.status],
        daysOverdue,
      };
    });

    const txns: VendorPaymentTxn[] = rawPayments.map(p => ({
      id: p.id.slice(0, 8).toUpperCase(),
      billId: p.billId ? p.billId.slice(0, 8).toUpperCase() : "General",
      date: p.date ? p.date.split("T")[0] : "",
      amount: Number(p.amount),
      mode: p.method || "—",
      reference: p.utr || "—",
      firm: p.firmId || "Beere Kesava Silks (Head Firm)",
      notes: "",
    }));

    const totalBilled = bills.reduce((a, b) => a + b.amount, 0);
    const totalPaid = rawPayments.reduce((a, p) => a + Number(p.amount), 0);
    const outstanding = bills.reduce((a, b) => a + b.balance, 0);

    return { bills, txns, totalBilled, totalPaid, outstanding };
  }, [billsRes, paymentsRes]);
  const vendorPos = React.useMemo(
    () => (poRes?.items ?? []).filter(p => p.vendorId === vendor.id || p.vendor?.id === vendor.id),
    [poRes, vendor.id]
  );
  const orders = React.useMemo(() => vendorPos.map(p => ({
    id: p.poNumber || p.id,
    date: p.createdAt ? p.createdAt.split("T")[0] : "",
    materials: (p.items ?? []).map(item => ({
      type: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
      description: item.name,
      qty: `${item.quantity} ${item.unit}`,
      invoiceAmount: item.invoicedAmount ? formatMoney(rupees(Number(item.invoicedAmount))) : undefined,
    })),
    totalAmount: formatMoney(rupees(Number(p.totalValue || 0))),
    amount: Number(p.totalValue || 0),
    grnId: p.grnId || undefined,
    firmName: p.grnId ? "Beere Kesava Silks (Head Firm)" : undefined,
    receivedDate: undefined as string | undefined,
    status: (p.status === "RECEIVED" ? "Delivered" : p.status === "APPROVED" ? "Approved" : p.status === "REJECTED" ? "Cancelled" : "Pending") as any,
    receiveStatus: undefined as string | undefined,
  })), [vendorPos]);
  const realTotalSpend = React.useMemo(() => vendorPos.reduce((a, p) => a + Number(p.totalValue || 0), 0), [vendorPos]);
  const lastOrderDate = React.useMemo(() => {
    if (!vendorPos.length) return null;
    return vendorPos.reduce((latest, p) => (!latest || p.createdAt > latest ? p.createdAt : latest), "" as string);
  }, [vendorPos]);

  const filteredBills = React.useMemo(
    () => ledger.bills.filter(b => matchesDateFilter(b.date, payFilter)),
    [ledger.bills, payFilter]
  );
  const filteredTxns = React.useMemo(
    () => ledger.txns.filter(t => matchesDateFilter(t.date, payFilter)),
    [ledger.txns, payFilter]
  );
  const paidInRange = filteredTxns.reduce((a, t) => a + t.amount, 0);
  const overdueBills = ledger.bills.filter(b => b.status === "Overdue");
  const modeSplit = React.useMemo(() => {
    const m = new Map<string, number>();
    filteredTxns.forEach(t => m.set(t.mode, (m.get(t.mode) || 0) + t.amount));
    return [...m.entries()].map(([mode, amount]) => ({ mode, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredTxns]);
  const moneyVisible = useMoneyVisible();
  const inr = (n: number) => (moneyVisible ? formatMoney(rupees(n)) : "—");

  const billColumns: ColumnDef<VendorBill>[] = [
    {
      id: "poInvoice", header: "PO / Invoice", accessor: b => b.id, priority: 1,
      cell: (_v, b) => (
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{b.id}</div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>{b.invoiceNo}</div>
        </div>
      ),
    },
    { id: "billDate", header: "Bill Date", accessor: b => b.date, priority: 3, cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.date}</span> },
    {
      id: "dueDate", header: "Due Date", accessor: b => b.dueDate,
      cell: (_v, b) => (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: b.daysOverdue > 0 ? T.crimson : T.taupe, fontWeight: b.daysOverdue > 0 ? 700 : 400 }}>
          {b.dueDate}
          {b.daysOverdue > 0 && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>{b.daysOverdue}d overdue</div>}
        </span>
      ),
    },
    { id: "amount", header: "Invoice Amount", accessor: b => b.amount, cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018" }}>{inr(b.amount)}</span> },
    { id: "paid", header: "Paid", accessor: b => b.paid, priority: 3, cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.greenMid }}>{inr(b.paid)}</span> },
    { id: "balance", header: "Balance", accessor: b => b.balance, cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: b.balance > 0 ? T.crimson : T.taupe }}>{b.balance > 0 ? inr(b.balance) : "—"}</span> },
    {
      id: "status", header: "Status", accessor: b => b.status, type: "status",
      cell: (_v, b) => <DomainStatusPill taxonomy="payment" status={BILL_STATUS_KEY[b.status]} />,
    },
  ];

  const txnColumns: ColumnDef<VendorPaymentTxn>[] = [
    { id: "ref", header: "Payment Ref", accessor: p => p.id, priority: 1, cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{p.id}</span> },
    { id: "date", header: "Date", accessor: p => p.date, cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span> },
    { id: "billId", header: "Against PO", accessor: p => p.billId, cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.billId}</span> },
    {
      id: "mode", header: "Mode", accessor: p => p.mode,
      cell: (_v, p) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: PAY_MODE_FILL[p.mode] ?? T.taupe }} />{p.mode}
        </span>
      ),
    },
    { id: "reference", header: "UTR / Reference", accessor: p => p.reference, priority: 3, cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{p.reference}</span> },
    { id: "firm", header: "Paying Firm", accessor: p => p.firm, priority: 3, cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.firm}</span> },
    { id: "amount", header: "Amount", accessor: p => p.amount, align: "end", cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.greenMid }}>{inr(p.amount)}</span> },
  ];

  return (
    <div style={{ padding: "40px 56px" }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "vendors", label: "Vendors", onClick: onBack },
            { key: "vendor", label: vendor.name },
          ]}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
          <Button onClick={onBack} variant="secondary" iconLeft="back" className="rounded-lg text-[#6E0F2D]">
            Back to Vendors
          </Button>
        </motion.div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <StatusPill status={vendor.status} />
          <EntityCode type="vendor" value={vendor.id} />
          {onDelete && (
            <Button
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete vendor "${vendor.name}"?`,
                  description: "This can't be undone. Vendors with existing purchase orders, bills, or payments can't be deleted — deactivate them instead.",
                  confirmLabel: "Delete Vendor",
                  tone: "danger",
                });
                if (ok) onDelete(vendor);
              }}
              variant="tertiary" size="sm" iconLeft={Trash2}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <FadeUp>
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 20, fontWeight: 800, flexShrink: 0, boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>{vendor.initials}</div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, margin: "0 0 6px" }}>{vendor.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{vendor.city}, {vendor.state}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Package size={13} color={T.antiqueGold} />{vendor.type}</span>
                <StarRating rating={vendor.rating} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>TOTAL SPEND</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.goldLight }}>{moneyVisible ? formatMoney(rupees(realTotalSpend)) : "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>OUTSTANDING</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: vendor.outstanding !== "0" ? "#F87171" : T.goldLight }}>{!moneyVisible ? "—" : formatMoney(rupees(Number(vendor.outstanding) || 0))}</div>
            </div>
          </div>
        </div>
      </FadeUp>

      <div style={{ display: "flex", borderBottom: `2px solid ${T.borderDef}`, marginBottom: 28 }}>
        {tabs.map(t => (
          <Button
            key={t.key}
            onClick={() => setTab(t.key)}
            variant="tertiary"
            className={
              "rounded-none px-6 py-3.5 mb-[-2px] " +
              (tab === t.key
                ? "border-b-[3px] border-[#6E0F2D] text-[#6E0F2D] font-bold"
                : "border-b-[3px] border-transparent text-[#9C8672] font-medium")
            }
          >
            {t.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
                {[
                  { label: "Active Orders", value: orders.filter(o => o.status === "Approved" || o.status === "Pending").length, sub: "In progress", color: T.royalBurgundy },
                  { label: "Total Orders", value: orders.length, sub: lastOrderDate ? `Last order ${lastOrderDate.split("T")[0]}` : "All time", color: T.luxuryBrown },
                  { label: "Pending Bills", value: inr(ledger.outstanding), sub: `${overdueBills.length} overdue`, color: ledger.outstanding > 0 ? T.crimson : T.green },
                  { label: "Rating", value: `${vendor.rating} ★`, sub: "Vendor score", color: T.antiqueGold },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: 20 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                    <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: s.color, margin: "6px 0 2px" }}>{s.value}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Recent Purchase Orders</div>
                </div>
                {posLoading ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading purchase orders…</div>
                ) : posError ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load purchase orders. Please try again.</div>
                ) : orders.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchase orders yet for this vendor.</div>
                ) : (
                  <PurchaseOrderHistoryTable orders={orders.slice(0, 2)} />
                )}
              </div>
            </div>
          )}
          {tab === "orders" && (
            <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>Full Purchase Order History</div>
                <DateFilterBar filter={orderDateFilter} onChange={setOrderDateFilter} />
              </div>
              {posLoading ? (
                <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading purchase orders…</div>
              ) : posError ? (
                <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load purchase orders. Please try again.</div>
              ) : orders.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchase orders yet for this vendor.</div>
              ) : (
                <PurchaseOrderHistoryTable orders={orders.filter(o => matchesDateFilter(o.date, orderDateFilter))} />
              )}
            </div>
          )}
          {tab === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
                {[
                  { label: "Paid in Range", value: inr(paidInRange), color: T.greenMid, sub: `${filteredTxns.length} transaction${filteredTxns.length === 1 ? "" : "s"}` },
                  { label: "Paid All Time", value: inr(ledger.totalPaid), color: T.luxuryBrown, sub: `of ${inr(ledger.totalBilled)} billed` },
                  { label: "Outstanding", value: inr(ledger.outstanding), color: ledger.outstanding > 0 ? T.crimson : T.green, sub: ledger.outstanding > 0 ? "Awaiting settlement" : "Fully settled" },
                  { label: "Overdue Bills", value: String(overdueBills.length), color: overdueBills.length ? T.crimson : T.green, sub: `Terms ${vendor.terms}` },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "18px 20px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>Settlement Progress</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>
                    {ledger.totalBilled ? Math.round((ledger.totalPaid / ledger.totalBilled) * 100) : 0}% cleared
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: T.silkCream, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
                  <div style={{ width: `${ledger.totalBilled ? (ledger.totalPaid / ledger.totalBilled) * 100 : 0}%`, height: "100%", background: `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 8 }}>
                  <span>Paid {inr(ledger.totalPaid)}</span>
                  <span>Billed {inr(ledger.totalBilled)}</span>
                </div>
                {modeSplit.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 16, borderTop: `1px solid ${T.borderDef}`, paddingTop: 14, flexWrap: "wrap" as const }}>
                    {modeSplit.map(m => (
                      <div key={m.mode} style={{ display: "flex", alignItems: "center", gap: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 20, padding: "6px 14px" }}>
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: PAY_MODE_FILL[m.mode] ?? T.taupe }} />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{m.mode}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{inr(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "16px 22px 2px" }}>
                <DateFilterBar filter={payFilter} onChange={setPayFilter} />
              </div>

              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Invoice-wise Settlement</div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Due dates from payment terms · {vendor.terms}</span>
                </div>
                {ledgerLoading ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading bills…</div>
                ) : ledgerError ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load bills. Please try again.</div>
                ) : filteredBills.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No bills raised in this period.</div>
                ) : (
                  <DataTable responsive columns={billColumns} data={filteredBills} getRowId={b => b.id} emptyTitle="No bills raised in this period." />
                )}
              </div>

              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Payments Made</div>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.greenMid }}>{inr(paidInRange)}</span>
                </div>
                {ledgerLoading ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading payments…</div>
                ) : ledgerError ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load payments. Please try again.</div>
                ) : filteredTxns.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
                ) : (
                  <DataTable responsive columns={txnColumns} data={filteredTxns} getRowId={p => p.id} emptyTitle="No payments in this period." />
                )}
              </div>

              {overdueBills.length > 0 && (
                <div style={{ background: T.crimsonBg, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <AlertTriangle size={16} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.crimson }}>
                      {overdueBills.length} bill{overdueBills.length > 1 ? "s" : ""} past the agreed {vendor.terms} terms
                    </span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                    {overdueBills.map(b => `${b.id} — ${inr(b.balance)} (${b.daysOverdue}d)`).join(" · ")}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "contact" && (
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              {[
                { label: "Contact Person", value: vendor.contactName, Icon: Building2 },
                { label: "Phone", value: vendor.phone, Icon: Phone },
                { label: "WhatsApp", value: vendor.whatsapp || "—", Icon: Phone },
                { label: "GST Number", value: vendor.gstCode || "—", Icon: FileText },
                { label: "Bank Name", value: vendor.bankName || "—", Icon: IndianRupee },
                { label: "Account Number", value: vendor.accountNo || "—", Icon: IndianRupee },
              ].map(f => (
                <div key={f.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>{f.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}><f.Icon size={14} color={T.royalBurgundy} /> {f.value}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Address</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{vendor.address || "—"}</div>
              </div>
              {vendor.notes && (
                <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Notes</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{vendor.notes}</div>
                </div>
              )}
            </div>
          )}
          {tab === "edit" && (
            <VendorEditFormTab vendor={vendor} onUpdate={onUpdate} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
