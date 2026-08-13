import React, { useMemo, useState } from "react";
import { AlignJustify, BadgeCheck, CircleAlert, Clock, LayoutGrid, Store, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { useSuppliers } from "../../../suppliers/contexts/SupplierContext";
import { Supplier } from "../../../suppliers/contexts/supplier-types";
import { F, T, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { FadeUp } from "../common/motion";
import { DropBtn, SectionCard } from "../common/primitives";
import { SupplierPayNowModal } from "./SupplierPayNowModal";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

type SupplierStatusKey = "Paid" | "Pending" | "Overdue";

interface SupplierRow {
  supplier: Supplier;
  totalPurchased: number;
  totalPaid: number;
  outstanding: number;
  lastPurchaseDate: string;
  status: SupplierStatusKey;
}

const STATUS_CFG: Record<SupplierStatusKey, { color: string; bg: string }> = {
  Paid:     { color: T.green,        bg: "rgba(30,102,64,0.10)" },
  Pending:  { color: T.antiqueGold,  bg: "rgba(200,155,71,0.14)" },
  Overdue:  { color: T.crimson,      bg: "rgba(192,57,43,0.10)" },
};

function SupplierStatusBadge({ status }: { status: SupplierStatusKey }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "4px 10px", borderRadius: 20 }}>
      {status}
    </span>
  );
}

export function SupplierPaymentsSection() {
  const { suppliers, payments, addPayment, statsFor } = useSuppliers();

  const [view, setView] = useState<"card" | "table">("card");
  const [statusFilter, setStatusFilter] = useState("All Bill Status");
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payForId, setPayForId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rows: SupplierRow[] = useMemo(() => {
    return suppliers.map((s): SupplierRow => {
      const stats = statsFor(s.id);
      let status: SupplierStatusKey;
      if (stats.outstanding <= 0 && stats.totalPurchased > 0) status = "Paid";
      else if (s.status === "overdue") status = "Overdue";
      else status = "Pending";
      return {
        supplier: s,
        totalPurchased: stats.totalPurchased,
        totalPaid: stats.totalPaid,
        outstanding: stats.outstanding,
        lastPurchaseDate: stats.lastPurchaseDate,
        status,
      };
    });
  }, [suppliers, statsFor]);

  const totalSupplierPaymentsRecorded = payments.reduce((s, p) => s + p.amount, 0);
  const pendingBalance = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdueRows = rows.filter(r => r.status === "Overdue");

  const filtered = rows.filter(r => {
    const matchStatus = statusFilter === "All Bill Status" || r.status === statusFilter;
    const matchSupplier = supplierFilter === "All Suppliers" || r.supplier.name === supplierFilter;
    const matchSearch = !search || r.supplier.name.toLowerCase().includes(search.toLowerCase());
    const matchDate = !r.lastPurchaseDate || r.lastPurchaseDate === "—" || matchesDateFilter(r.lastPurchaseDate, dateFilter);
    return matchStatus && matchSupplier && matchSearch && matchDate;
  });

  const payFor = payForId ? rows.find(r => r.supplier.id === payForId) ?? null : null;

  const handleSave = (payload: { amount: number; date: string; mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque"; reference: string }) => {
    if (!payFor) return;
    setSaving(true);
    addPayment({
      supplierId: payFor.supplier.id,
      date: payload.date,
      amount: payload.amount,
      mode: payload.mode,
      reference: payload.reference,
    });
    toast.success(`Payment of ${formatMoney(rupees(payload.amount))} recorded for ${payFor.supplier.name}`);
    setSaving(false);
    setPayForId(null);
  };

  const supplierTableColumns: ColumnDef<SupplierRow>[] = [
    {
      id: "supplier", header: "Supplier Name", accessor: r => r.supplier.name,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Store size={15} color={T.royalBurgundy} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.supplier.name}</span>
        </div>
      ),
    },
    {
      id: "totalPurchased", header: "Total Purchased", accessor: r => r.totalPurchased, type: "number",
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}><Money value={rupees(r.totalPurchased)} /></span>,
    },
    {
      id: "totalPaid", header: "Paid Amt", accessor: r => r.totalPaid, type: "number",
      cell: (_v, r) => <span style={{ fontFamily: F.mono, color: T.green, fontWeight: 600 }}><Money value={rupees(r.totalPaid)} /></span>,
    },
    {
      id: "outstanding", header: "Balance Due", accessor: r => r.outstanding, type: "number",
      cell: (_v, r) => (
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: r.outstanding === 0 ? T.green : r.status === "Overdue" ? T.crimson : T.antiqueGold }}>
          {r.outstanding === 0 && r.totalPurchased > 0 ? "Paid ✓" : <Money value={rupees(r.outstanding)} />}
        </span>
      ),
    },
    {
      id: "lastPurchaseDate", header: "Last Purchase", accessor: r => r.lastPurchaseDate,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.lastPurchaseDate}</span>,
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => <SupplierStatusBadge status={r.status} />,
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        r.outstanding === 0 ? (
          <Button variant="secondary" size="sm" disabled
            className="rounded-[7px] border-[rgba(30,102,64,0.20)] bg-[rgba(30,102,64,0.09)] text-[#1E6640] disabled:bg-[rgba(30,102,64,0.09)] disabled:text-[#1E6640] disabled:opacity-100">
            {r.totalPurchased > 0 ? "Paid" : "No Dues"}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setPayForId(r.supplier.id)}
            className="rounded-[7px] border-[#6E0F2D] text-[#6E0F2D]">
            Pay Now
          </Button>
        )
      ),
    },
  ];

  return (
    <div id="pay-supplier" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={Store}
        title="Supplier Payments"
        subtitle="Track payments made to saree suppliers. Record and monitor all supplier purchase settlements."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Supplier Payments",
              value: formatMoney(rupees(totalSupplierPaymentsRecorded)),
              sub: "All recorded supplier payments",
              crimson: false, green: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Pending Balance",
              value: formatMoney(rupees(pendingBalance)),
              sub: "Outstanding to suppliers",
              crimson: true, green: false,
            },
            {
              icon: <BadgeCheck size={22} color={T.green} />,
              iconBg: "rgba(30,102,64,0.08)",
              label: "Suppliers Settled",
              value: `${rows.filter(r => r.outstanding === 0 && r.totalPurchased > 0).length}`,
              sub: "Fully paid suppliers",
              crimson: false, green: true,
            },
            {
              icon: <Clock size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Overdue Suppliers",
              value: `${overdueRows.length}`,
              sub: "Suppliers flagged overdue",
              crimson: false, green: false,
            },
          ].map((s, i) => (
            <div key={i} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.crimson ? T.crimson : s.green ? T.green : T.luxuryBrown, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {([{ key: "card", Icon: LayoutGrid, label: "Card View" }, { key: "table", Icon: AlignJustify, label: "Table View" }] as const).map(({ key, Icon, label }) => (
              <Button key={key} variant={view === key ? "primary" : "tertiary"} size="sm" iconLeft={Icon}
                onClick={() => setView(key)}
                className={view === key ? "rounded-none bg-[#6E0F2D] text-[#FFFDF9]" : "rounded-none bg-white text-[var(--text-tertiary)]"}>
                {label}
              </Button>
            ))}
          </div>
          <DropBtn value={supplierFilter} options={["All Suppliers", ...suppliers.map(s => s.name)]} onChange={setSupplierFilter} />
          <Select value={statusFilter} onValueChange={setStatusFilter} size="sm">
            {["All Bill Status", "Paid", "Pending", "Overdue"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplier..." size="sm" />
          </div>
        </div>

        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((r, i) => (
              <motion.div key={r.supplier.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}
                style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: 20, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Store size={16} color={T.royalBurgundy} />
                    </div>
                    <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{r.supplier.name}</span>
                  </div>
                  <SupplierStatusBadge status={r.status} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 2 }}>Purchased</div>
                    <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(r.totalPurchased)} /></div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 2 }}>Paid</div>
                    <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(r.totalPaid)} /></div>
                  </div>
                  <div style={{ gridColumn: "1 / 3" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 2 }}>Balance Due</div>
                    <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: r.outstanding === 0 ? T.green : r.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                      {r.outstanding === 0 && r.totalPurchased > 0 ? "Paid ✓" : <Money value={rupees(r.outstanding)} />}
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled={r.outstanding === 0} onClick={() => setPayForId(r.supplier.id)}
                  className="rounded-[7px] border-[#6E0F2D] text-[#6E0F2D] disabled:opacity-50">
                  {r.outstanding === 0 ? (r.totalPurchased > 0 ? "Paid" : "No Dues") : "Pay Now"}
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
            <div style={{ overflowX: "auto" }}>
              <DataTable
                columns={supplierTableColumns}
                data={filtered}
                getRowId={r => r.supplier.id}
                emptyTitle="No suppliers match your filters"
              />
            </div>
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {filtered.length} of {rows.length} suppliers</span>
            </div>
          </div>
        )}
      </SectionCard>

      <AnimatePresence>
        {payFor && (
          <SupplierPayNowModal
            supplier={payFor.supplier}
            outstanding={payFor.outstanding}
            saving={saving}
            onClose={() => setPayForId(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
      </FadeUp>
    </div>
  );
}
