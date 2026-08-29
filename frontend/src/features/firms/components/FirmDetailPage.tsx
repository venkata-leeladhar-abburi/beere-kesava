import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Edit, TrendingUp, TrendingDown, Building2, CreditCard,
  User, FileText, Package, Receipt, Truck, Wallet, Link2,
  AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { useFirms, Firm, FinancialEntry, MiscEntry } from "../contexts/FirmsContext";
import { useFirmActivity } from "../hooks/useFirmActivity";
import { findDuplicateEntries } from "./duplicateEntries";
import type {
  FirmDocument, FirmPayment, FirmDocumentType, FirmActivityStatus,
} from "../../../shared/api/firms";
import { T, F } from "./theme";
import { fmtFull, initials } from "./utils";
import { FinSection, MiscSection } from "./FirmFinanceSections";
import { Button, Select, SelectItem, StatusPill, type StatusTone } from "../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState } from "../../../shared/ui/state";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import {
  DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter,
} from "../../../shared/ui/DateFilterBar";
import { useConfirm } from "../../../shared/ui/overlay";

// ── Document/payment presentation config ──────────────────────────────────────
const DOC_CFG: Record<FirmDocumentType, { label: string; icon: React.ElementType }> = {
  PURCHASE_ORDER:   { label: "Purchase Order", icon: Package },
  GOODS_RECEIPT:    { label: "Goods Receipt",  icon: Receipt },
  QUOTATION:        { label: "Quotation",      icon: FileText },
  DISPATCH_INVOICE: { label: "Dispatch / Invoice", icon: Truck },
};

const STATUS_TONE: Record<FirmActivityStatus, StatusTone> = {
  PENDING: "warning",
  PARTIAL: "info",
  PAID:    "success",
};

const PAYMENT_LABEL: Record<FirmPayment["type"], string> = {
  WEAVER: "Weaver Payment",
  VENDOR: "Vendor Payment",
  SUPPLIER: "Supplier Payment",
  INVOICE: "Customer Receipt",
};

type DirectionFilter = "all" | "INCOME" | "EXPENSE";

function SectionShell({ title, subtitle, icon: Icon, right, children }: {
  title: string; subtitle?: string; icon: React.ElementType;
  right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-[#E8DCC4] overflow-hidden bg-white shadow-sm">
      <div className="bg-[#6E0F2D] p-5 sm:px-6 sm:py-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-[#F5E8D0]" />
          </div>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] leading-snug">{title}</h3>
            {subtitle && <p className="text-xs sm:text-sm text-white/70 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="text-xs text-white/80">{right}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Summary: realized vs committed ────────────────────────────────────────────
function SummaryStrip({ income, expense, net, pendingIncome, pendingExpense, quoted }: {
  income: number; expense: number; net: number;
  pendingIncome: number; pendingExpense: number; quoted: number;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 0, border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
        {[
          { label: "Income Received", val: income, color: T.green, bg: T.greenBg, icon: <TrendingUp size={16} color={T.green} /> },
          { label: "Expenses Paid", val: expense, color: T.crimson, bg: T.crimsonBg, icon: <TrendingDown size={16} color={T.crimson} /> },
          { label: "Net Balance", val: net, color: net >= 0 ? T.green : T.crimson, bg: net >= 0 ? T.greenBg : T.crimsonBg, icon: net >= 0 ? <TrendingUp size={16} color={T.green} /> : <TrendingDown size={16} color={T.crimson} /> },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "14px 18px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", background: s.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              {s.icon}
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: s.color }}>{fmtFull(s.val)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2.5 px-4 py-3" style={{ border: `1px solid ${T.borderGold}`, background: T.bgGold, borderRadius: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.antiqueGold, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          <Link2 size={14} /> Committed — not yet settled
        </span>
        {[
          { label: "Receivable", val: pendingIncome, color: T.green },
          { label: "Payable", val: pendingExpense, color: T.crimson },
          { label: "Quoted pipeline", val: quoted, color: T.taupe },
        ].map(s => (
          <span key={s.label} style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            {s.label}{" "}
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: s.color }}>{fmtFull(s.val)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function FirmDetailPage({ firm, onBack, onEdit, onGoToPayments }: {
  firm: Firm;
  onBack: () => void;
  onEdit: () => void;
  /** Jumps to the Payments page — payment entry stays owned by that one screen. */
  onGoToPayments?: () => void;
}) {
  const {
    getFirmFinancials, addIncomeEntry, addExpenseEntry, addMiscEntry,
    bulkAddIncome, bulkAddExpenses, updateEntry, deleteEntry,
  } = useFirms();
  const confirm = useConfirm();
  const { documents, payments, isLoading, isError, error, refetch } = useFirmActivity(firm.id);
  const fin = getFirmFinancials(firm.id);

  const [tab, setTab] = useState<"finance" | "info">("finance");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [status, setStatus] = useState<"all" | FirmActivityStatus>("all");

  const matches = (row: { date: string; direction: string }) =>
    matchesDateFilter(row.date, dateFilter) && (direction === "all" || row.direction === direction);

  const visibleDocs = useMemo(
    () => documents.filter(d => matches(d) && (status === "all" || d.status === status)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents, dateFilter, direction, status],
  );
  const visiblePayments = useMemo(
    () => payments.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [payments, dateFilter, direction],
  );

  const manualIncome = useMemo(
    () => fin.income.filter(e => matchesDateFilter(e.date, dateFilter) && direction !== "EXPENSE"),
    [fin.income, dateFilter, direction],
  );
  const manualExpenses = useMemo(
    () => fin.expenses.filter(e => matchesDateFilter(e.date, dateFilter) && direction !== "INCOME"),
    [fin.expenses, dateFilter, direction],
  );
  const manualMisc = useMemo(
    () => fin.misc.filter(m => matchesDateFilter(m.date, dateFilter)
      && (direction === "all" || (direction === "INCOME" ? m.type === "income" : m.type === "expense"))),
    [fin.misc, dateFilter, direction],
  );

  const filtered = useMemo(() => {
    const inc = visiblePayments.filter(p => p.direction === "INCOME").reduce((s, p) => s + p.amount, 0)
      + manualIncome.reduce((s, e) => s + e.amount, 0)
      + manualMisc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
    const exp = visiblePayments.filter(p => p.direction === "EXPENSE").reduce((s, p) => s + p.amount, 0)
      + manualExpenses.reduce((s, e) => s + e.amount, 0)
      + manualMisc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      pendingIncome: visibleDocs.filter(d => d.direction === "INCOME" && d.type !== "QUOTATION").reduce((s, d) => s + d.outstanding, 0),
      pendingExpense: visibleDocs.filter(d => d.direction === "EXPENSE").reduce((s, d) => s + d.outstanding, 0),
      quoted: visibleDocs.filter(d => d.type === "QUOTATION").reduce((s, d) => s + d.amount, 0),
    };
  }, [visiblePayments, visibleDocs, manualIncome, manualExpenses, manualMisc]);

  const filtersActive = dateFilter.mode !== "all" || direction !== "all" || status !== "all";

  const incomeDuplicates = useMemo(
    () => findDuplicateEntries(fin.income, payments, "INCOME"),
    [fin.income, payments],
  );
  const expenseDuplicates = useMemo(
    () => findDuplicateEntries(fin.expenses, payments, "EXPENSE"),
    [fin.expenses, payments],
  );

  async function handleDeleteEntry(entry: { id: string; description: string; amount: number }) {
    const ok = await confirm({
      title: "Delete this entry?",
      description: `"${entry.description}" (${fmtFull(entry.amount)}) will be removed from this firm's ledger. This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    await deleteEntry(firm.id, entry.id);
  }

  const docColumns: ColumnDef<FirmDocument>[] = [
    {
      id: "reference", header: "Document", accessor: d => d.reference, priority: 1,
      cell: (_v, d) => {
        const cfg = DOC_CFG[d.type];
        const Icon = cfg.icon;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon size={15} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{d.reference}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{cfg.label}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "party", header: "Party", accessor: d => d.party,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{d.party}</span>,
    },
    {
      id: "date", header: "Date", accessor: d => d.date, priority: 3,
      cell: (_v, d) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{d.date}</span>,
    },
    {
      id: "category", header: "Category", accessor: d => d.category, priority: 3,
      cell: (_v, d) => (
        <span style={{ display: "inline-block", background: d.direction === "INCOME" ? T.greenBg : T.crimsonBg, border: `1px solid ${d.direction === "INCOME" ? T.green : T.crimson}22`, borderRadius: 999, padding: "3px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: d.direction === "INCOME" ? T.green : T.crimson, whiteSpace: "nowrap" as const }}>
          {d.category}
        </span>
      ),
    },
    {
      id: "amount", header: "Amount", type: "currency", align: "end", accessor: d => d.amount,
      cell: (_v, d) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{fmtFull(d.amount)}</span>,
    },
    {
      id: "paid", header: "Settled", type: "currency", align: "end", accessor: d => d.paidAmount,
      cell: (_v, d) => (
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: d.paidAmount > 0 ? T.green : T.taupe }}>{fmtFull(d.paidAmount)}</div>
          {d.outstanding > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, marginTop: 2 }}>{fmtFull(d.outstanding)} due</div>
          )}
        </div>
      ),
    },
    {
      id: "status", header: "Status", type: "status", accessor: d => d.status,
      cell: (_v, d) => <StatusPill tone={STATUS_TONE[d.status]} label={d.status === "PAID" ? "Settled" : d.status === "PARTIAL" ? "Part paid" : "Pending"} size="sm" />,
    },
    ...(onGoToPayments ? [{
      id: "action", header: "", type: "actions" as const, accessor: () => null,
      cell: (_v: unknown, d: FirmDocument) => d.outstanding > 0 && d.type !== "QUOTATION" ? (
        <Button variant="tertiary" size="sm" iconRight={ArrowUpRight} onClick={onGoToPayments} className="whitespace-nowrap">
          Record payment
        </Button>
      ) : null,
    } as ColumnDef<FirmDocument>] : []),
  ];

  const paymentColumns: ColumnDef<FirmPayment>[] = [
    {
      id: "reference", header: "Reference", accessor: p => p.reference, priority: 1,
      cell: (_v, p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Wallet size={15} color={p.direction === "INCOME" ? T.green : T.crimson} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.royalBurgundy, wordBreak: "break-all" as const }}>{p.reference}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{PAYMENT_LABEL[p.type]}</div>
          </div>
        </div>
      ),
    },
    {
      id: "party", header: "Party", accessor: p => p.party,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{p.party}</span>,
    },
    {
      id: "date", header: "Date", accessor: p => p.date, priority: 3,
      cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{p.date}</span>,
    },
    {
      id: "category", header: "Category", accessor: p => p.category, priority: 3,
      cell: (_v, p) => (
        <span style={{ display: "inline-block", background: p.direction === "INCOME" ? T.greenBg : T.crimsonBg, border: `1px solid ${p.direction === "INCOME" ? T.green : T.crimson}22`, borderRadius: 999, padding: "3px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: p.direction === "INCOME" ? T.green : T.crimson, whiteSpace: "nowrap" as const }}>
          {p.category}
        </span>
      ),
    },
    {
      id: "amount", header: "Amount", type: "currency", align: "end", accessor: p => p.amount,
      cell: (_v, p) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: p.direction === "INCOME" ? T.green : T.crimson }}>
          {p.direction === "INCOME" ? "+" : "−"}{fmtFull(p.amount)}
        </span>
      ),
    },
  ];

  function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    if (!value) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "11px 0", borderBottom: `1px solid ${T.borderDef}`, gap: 16 }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, flexShrink: 0 }}>{label}</span>
        <span style={{ fontFamily: mono ? "var(--font-mono)" : F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "right" as const, wordBreak: "break-word" as const }}>{value}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] font-sans pb-16">
      <div className="px-4 md:px-7 xl:px-14 pt-5 sm:pt-7">
        {/* Top Back & Meta Card */}
        <div className="bg-white rounded-2xl border border-[#E8DCC4] p-3.5 sm:p-4 mb-5 flex items-center justify-between gap-3 flex-wrap shadow-xs">
          <Button
            variant="ghost"
            onClick={onBack}
            iconLeft={ArrowLeft}
            className="rounded-full border border-[#E8DCC4] px-4 py-2 text-[13px] font-bold text-[#6E0F2D] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
          >
            Back to Firms
          </Button>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="h-9 px-3.5 rounded-full bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Building2 size={14} className="text-[#6E0F2D]" />
              <span>Registered Firm</span>
            </span>
            <span className="h-9 px-3.5 rounded-full bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap">
              {firm.id}
            </span>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="mb-6">
          <div className="relative bg-[#6E0F2D] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.25)]">
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(110,15,45,0.95) 0%, rgba(74,6,27,0.98) 100%)", pointerEvents: "none" }} />

            <div className="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row gap-5 lg:gap-7 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
                <div className="relative shrink-0">
                  <div style={{
                    width: 76, height: 76, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`,
                    color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: F.display, fontSize: 24, fontWeight: 700, border: "2px solid rgba(200,155,71,0.45)"
                  }}>
                    {initials(firm.firmName)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                      REGISTERED FIRM
                    </span>
                    {firm.gstNumber && (
                      <span
                        // eslint-disable-next-line no-restricted-syntax -- GSTIN is a government tax id, not one of lib/domain/codes' entity types, so <EntityCode> cannot model it
                        style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99, padding: "2px 10px" }}>
                        GST: {firm.gstNumber}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                    {firm.firmName}
                  </h1>
                  {firm.createdAt && (
                    <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-white/70">
                      Added {firm.createdAt.includes("T") ? firm.createdAt.split("T")[0] : firm.createdAt}
                    </div>
                  )}
                </div>
              </div>

              {/* Luxury Metrics & Edit */}
              <div className="flex items-center gap-3.5 w-full lg:w-auto justify-start lg:justify-end flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 min-w-[160px]">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                    <TrendingUp size={20} color={T.antiqueGold} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Net Balance</div>
                    <div className={`text-sm sm:text-base font-bold mt-0.5 truncate ${filtered.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {fmtFull(filtered.net)}
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  iconLeft={Edit}
                  onClick={onEdit}
                  className="bg-white/12 text-white border-white/25 hover:bg-white/22 shrink-0 h-12 px-5 font-bold"
                >
                  Edit Firm
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation Strip Card */}
        <div className="bg-white rounded-[10px] border border-[#E8DCC4] px-3 sm:px-5 pt-2 pb-0 mb-6 shadow-sm overflow-x-auto section-nav-scroll">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { key: "finance" as const, label: "Financial Tracking", icon: <CreditCard size={18} /> },
              { key: "info" as const, label: "Firm Info", icon: <Building2 size={18} /> },
            ].map(t => {
              const isActive = tab === t.key;
              return (
                <Button
                  key={t.key}
                  variant="tertiary"
                  onClick={() => setTab(t.key)}
                  className={
                    "rounded-none px-4 sm:px-6 py-3 shrink-0 text-sm sm:text-base cursor-pointer flex items-center gap-2.5 transition-all " +
                    (isActive
                      ? "border-b-[3px] border-[#6E0F2D] text-[#6E0F2D] font-bold"
                      : "border-b-[3px] border-transparent text-[#9C8672] hover:text-[#6E0F2D] font-medium")
                  }
                >
                  {t.icon}
                  <span>{t.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full"
        style={{ paddingTop: 24, paddingBottom: 72 }}
      >
        {tab === "info" ? (
          <div className="w-full mb-6 rounded-2xl border border-[#E8DCC4] overflow-hidden bg-white shadow-sm">
            <div className="bg-[#6E0F2D] p-5 sm:px-6 sm:py-5 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-[#F5E8D0]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] leading-snug">Firm Details & Contact Information</h3>
                  <p className="text-xs sm:text-sm text-white/70 mt-0.5">Registration, banking, and primary contact details</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                {/* Firm Details Card */}
                <div className="bg-[#FFFDF9] border border-[#E8DCC4] rounded-xl p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6E0F2D] uppercase tracking-wider border-b border-[#E8DCC4] pb-2.5">
                    <Building2 size={14} /> Firm Overview
                  </div>
                  <InfoRow label="Firm Name" value={firm.firmName} />
                  <InfoRow label="GST Number" value={firm.gstNumber} mono />
                  <InfoRow label="Address" value={firm.address} />
                </div>

                {/* Bank Details Card */}
                <div className="bg-[#FFFDF9] border border-[#E8DCC4] rounded-xl p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6E0F2D] uppercase tracking-wider border-b border-[#E8DCC4] pb-2.5">
                    <CreditCard size={14} /> Bank Account
                  </div>
                  <InfoRow label="Bank Name" value={firm.bankName} />
                  <InfoRow label="Account Number" value={firm.accountNumber} mono />
                  <InfoRow label="IFSC Code" value={firm.ifscCode} mono />
                </div>

                {/* Contact Person Card */}
                <div className="bg-[#FFFDF9] border border-[#E8DCC4] rounded-xl p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6E0F2D] uppercase tracking-wider border-b border-[#E8DCC4] pb-2.5">
                    <User size={14} /> Contact Person
                  </div>
                  <InfoRow label="Name" value={firm.contactPersonName} />
                  <InfoRow label="Phone" value={firm.contactPersonPhone} mono />
                </div>
              </div>

              {!firm.gstNumber && !firm.address && !firm.bankName && !firm.contactPersonName && (
                <div className="mb-6 p-4 rounded-xl bg-[rgba(110,15,45,0.04)] border border-[rgba(110,15,45,0.12)] text-xs sm:text-sm text-[#3B2314]">
                  Only a firm name is on record. Use <strong>Edit Firm</strong> to add GST, address, bank and contact details.
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap border-t border-[#E8DCC4] pt-5">
                <Button variant="primary" iconLeft={Edit} onClick={onEdit}>Edit Firm</Button>
                <Button variant="secondary" onClick={() => setTab("finance")}>View Financial Tracking</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Unified Financial Overview Card */}
            <div className="mb-6 rounded-2xl border border-[#E8DCC4] overflow-hidden bg-white shadow-sm">
              <div className="bg-[#6E0F2D] p-5 sm:px-6 sm:py-5 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <CreditCard size={20} className="text-[#F5E8D0]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] leading-snug">Firm Financial Overview</h3>
                    <p className="text-xs sm:text-sm text-white/70 mt-0.5">Live ledger position, filters, and financial metrics</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col gap-5">
                {/* How it works callout */}
                <div style={{ background: "linear-gradient(135deg, rgba(30,102,64,0.06), rgba(200,155,71,0.06))", border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "13px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <AlertTriangle size={15} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.65 }}>
                    <strong style={{ color: T.antiqueGold }}>How this firm&rsquo;s ledger works:</strong>{" "}
                    Purchase orders, goods receipts, quotations and dispatch invoices that name this firm appear automatically under{" "}
                    <strong style={{ color: T.luxuryBrown }}>Linked Documents</strong> as soon as they&rsquo;re raised — as <em>committed</em>, not yet spent or earned.
                    When a payment is recorded against one, it moves into <strong style={{ color: T.luxuryBrown }}>Recorded Payments</strong> under its category and counts toward the net balance.
                    Anything outside that flow can still be captured by hand below.
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-[#FFFDF9] border border-[#E8DCC4] rounded-xl p-3.5 flex flex-wrap items-center gap-3">
                  <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
                  <Select value={direction} onValueChange={v => setDirection(v as DirectionFilter)} size="sm" containerClassName="w-auto shrink-0" className="w-[155px] font-semibold text-[13px]">
                    <SelectItem value="all">All money flow</SelectItem>
                    <SelectItem value="INCOME">Income only</SelectItem>
                    <SelectItem value="EXPENSE">Expenses only</SelectItem>
                  </Select>
                  <Select value={status} onValueChange={v => setStatus(v as "all" | FirmActivityStatus)} size="sm" containerClassName="w-auto shrink-0" className="w-[170px] font-semibold text-[13px]">
                    <SelectItem value="all">Any document status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PARTIAL">Part paid</SelectItem>
                    <SelectItem value="PAID">Settled</SelectItem>
                  </Select>
                  {filtersActive && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      className="ml-auto"
                      onClick={() => { setDateFilter(DEFAULT_DATE_FILTER); setDirection("all"); setStatus("all"); }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>

                {/* Summary Strip */}
                <SummaryStrip
                  income={filtered.income}
                  expense={filtered.expense}
                  net={filtered.net}
                  pendingIncome={filtered.pendingIncome}
                  pendingExpense={filtered.pendingExpense}
                  quoted={filtered.quoted}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 12, background: T.crimsonBg, border: `1px solid ${T.crimson}33`, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
                Could not load linked documents for this firm. {error.message}
              </div>
            )}

            {/* Auto-tracked: linked documents */}
            <SectionShell
              icon={Link2}
              title="Linked Documents"
              subtitle="Raised against this firm — automatically tracked, no manual entry needed"
              right={<span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{visibleDocs.length} document{visibleDocs.length === 1 ? "" : "s"}</span>}
            >
              {isLoading ? (
                <LoadingState variant="skeleton" rows={3} />
              ) : isError ? (
                <ErrorState error={error} onRetry={refetch} />
              ) : visibleDocs.length === 0 ? (
                documents.length === 0 ? (
                  <EmptyState
                    title="No linked documents yet"
                    description="Select this firm on a purchase order, quotation, or dispatch invoice and it will appear here automatically."
                  />
                ) : (
                  <div style={{ padding: "26px 18px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                    No documents match the current filters.
                  </div>
                )
              ) : (
                <DataTable responsive columns={docColumns} data={visibleDocs} getRowId={d => `${d.type}-${d.id}`} pagination />
              )}
            </SectionShell>

            {/* Auto-tracked: real payments */}
            <SectionShell
              icon={Wallet}
              title="Recorded Payments"
              subtitle="Money that actually moved — counts toward the net balance above"
              right={<span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{visiblePayments.length} payment{visiblePayments.length === 1 ? "" : "s"}</span>}
            >
              {isLoading ? (
                <LoadingState variant="skeleton" rows={3} />
              ) : isError ? (
                <ErrorState error={error} onRetry={refetch} />
              ) : visiblePayments.length === 0 ? (
                payments.length === 0 ? (
                  <EmptyState title="No payments recorded yet" description="Payments recorded against this firm will show up here." />
                ) : (
                  <div style={{ padding: "26px 18px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                    No payments match the current filters.
                  </div>
                )
              ) : (
                <DataTable responsive columns={paymentColumns} data={visiblePayments} getRowId={p => `${p.type}-${p.id}`} pagination />
              )}
            </SectionShell>

            {/* Manual entries */}
            <div style={{ marginTop: 26 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase" as const, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ height: 1, width: 24, background: T.borderDef }} />
                Manual Entries
                <div style={{ flex: 1, height: 1, background: T.borderDef }} />
              </div>

              <FinSection
                title="Income" type="income" icon={<TrendingUp size={16} color={T.green} />}
                entries={manualIncome} color={T.green} bg={T.greenBg}
                onAdd={e => addIncomeEntry(firm.id, e as Omit<FinancialEntry, "id">)}
                onBulkImport={rows => bulkAddIncome(firm.id, rows)}
                duplicates={incomeDuplicates}
                onUpdate={(entryId, e) => updateEntry(firm.id, entryId, e)}
                onDelete={e => void handleDeleteEntry(e)}
              />
              <FinSection
                title="Expenses" type="expense" icon={<TrendingDown size={16} color={T.crimson} />}
                entries={manualExpenses} color={T.crimson} bg={T.crimsonBg}
                onAdd={e => addExpenseEntry(firm.id, e as Omit<FinancialEntry, "id">)}
                onBulkImport={rows => bulkAddExpenses(firm.id, rows)}
                duplicates={expenseDuplicates}
                onUpdate={(entryId, e) => updateEntry(firm.id, entryId, e)}
                onDelete={e => void handleDeleteEntry(e)}
              />
              <MiscSection
                entries={manualMisc}
                onAdd={e => addMiscEntry(firm.id, e)}
                onUpdate={(entryId, e) => updateEntry(firm.id, entryId, e as Omit<MiscEntry, "id">)}
                onDelete={e => void handleDeleteEntry(e)}
              />
            </div>
          </>
        )}
      </motion.div>
      </div>
    </div>
  );
}
