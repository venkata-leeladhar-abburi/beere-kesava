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
import { fmtFull, initials, cardColor } from "./utils";
import { FinSection, MiscSection } from "./FirmFinanceSections";
import { Button, Select, SelectItem, StatusPill, type StatusTone } from "../../../shared/ui/primitives";
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
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 16, overflow: "hidden", marginBottom: 20, background: "#FFF" }}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5" style={{ background: T.bgGold, borderBottom: `1px solid ${T.borderGold}` }}>
        <Icon size={17} color={T.antiqueGold} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{title}</div>
          {subtitle && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ── Summary: realized vs committed ────────────────────────────────────────────
// Realized (money that actually moved) drives the net balance; committed
// (documents naming this firm that aren't settled) is reported separately so
// an unpaid purchase order can never quietly distort the firm's real position.
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
  // `totals` from the API is deliberately unused — the summary strip is
  // recomputed from the filtered rows below so it always agrees with what's
  // on screen; the server's unfiltered figures would contradict it.
  const { documents, payments, isLoading, error } = useFirmActivity(firm.id);
  const fin = getFirmFinancials(firm.id);
  const color = cardColor(firm.id);

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

  // Manual entries respect the same date + direction filters, so every number
  // on the page answers to one filter bar rather than each section having its
  // own idea of the period.
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

  // Totals are recomputed from the filtered rows so the summary always matches
  // what's on screen — the backend's unfiltered totals are only the default.
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

  // Manual rows that look like they restate a now-auto-tracked payment. Matched
  // against the FULL payment list, not the filtered one — a duplicate doesn't
  // stop being a duplicate because the date filter hid its counterpart.
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
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${color} 100%)`, position: "relative", overflow: "hidden" }}>
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 24, paddingBottom: 28 }}>
          <Button variant="ghost" size="sm" iconLeft={ArrowLeft} onClick={onBack} className="text-white/85 hover:bg-white/10 hover:text-white -ml-2 mb-4">
            Back to Firms
          </Button>

          <div className="flex flex-wrap items-start gap-4">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.16)", border: "1.5px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{initials(firm.firmName)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(22px, 4vw, 30px)", color: "#FFFDF9", margin: 0, lineHeight: 1.15 }}>
                {firm.firmName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.75)", wordBreak: "break-all" as const }}>{firm.id}</span>
                {firm.gstNumber && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.goldLight }}>GST {firm.gstNumber}</span>
                )}
                {firm.createdAt && (
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    Added {firm.createdAt.includes("T") ? firm.createdAt.split("T")[0] : firm.createdAt}
                  </span>
                )}
              </div>
            </div>
            <Button variant="secondary" iconLeft={Edit} onClick={onEdit} className="bg-white/12 text-white border-white/25 hover:bg-white/22 shrink-0">
              Edit Firm
            </Button>
          </div>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ background: "#FFF", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 4 }}>
        {([{ key: "finance", label: "Financial Tracking" }, { key: "info", label: "Firm Info" }] as const).map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            style={{
              padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent",
              fontFamily: F.ui, fontSize: 13.5, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? T.royalBurgundy : T.taupe,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-4 md:px-7 xl:px-14"
        style={{ paddingTop: 24, paddingBottom: 72 }}
      >
        {tab === "info" ? (
          <div className="max-w-[720px]" style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase" as const, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={14} color={T.royalBurgundy} /> Firm Details
            </div>
            <InfoRow label="Firm Name" value={firm.firmName} />
            <InfoRow label="GST Number" value={firm.gstNumber} mono />
            <InfoRow label="Address" value={firm.address} />

            {(firm.bankName || firm.accountNumber || firm.ifscCode) && (
              <>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase" as const, marginBottom: 6, marginTop: 22, display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={14} color={T.royalBurgundy} /> Bank Details
                </div>
                <InfoRow label="Bank Name" value={firm.bankName} />
                <InfoRow label="Account Number" value={firm.accountNumber} mono />
                <InfoRow label="IFSC Code" value={firm.ifscCode} mono />
              </>
            )}

            {(firm.contactPersonName || firm.contactPersonPhone) && (
              <>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase" as const, marginBottom: 6, marginTop: 22, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={14} color={T.royalBurgundy} /> Contact Person
                </div>
                <InfoRow label="Name" value={firm.contactPersonName} />
                <InfoRow label="Phone" value={firm.contactPersonPhone} mono />
              </>
            )}

            {!firm.gstNumber && !firm.address && !firm.bankName && !firm.contactPersonName && (
              <div style={{ padding: "22px 0 4px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                Only a firm name is on record. Use <strong>Edit Firm</strong> to add GST, address, bank and contact details.
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" as const }}>
              <Button variant="primary" iconLeft={Edit} onClick={onEdit}>Edit Firm</Button>
              <Button variant="secondary" onClick={() => setTab("finance")}>View Financial Tracking</Button>
            </div>
          </div>
        ) : (
          <>
            {/* How it works */}
            <div style={{ background: "linear-gradient(135deg, rgba(30,102,64,0.06), rgba(200,155,71,0.06))", border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "13px 16px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <AlertTriangle size={15} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.65 }}>
                <strong style={{ color: T.antiqueGold }}>How this firm&rsquo;s ledger works:</strong>{" "}
                Purchase orders, goods receipts, quotations and dispatch invoices that name this firm appear automatically under{" "}
                <strong style={{ color: T.luxuryBrown }}>Linked Documents</strong> as soon as they&rsquo;re raised — as <em>committed</em>, not yet spent or earned.
                When a payment is recorded against one, it moves into <strong style={{ color: T.luxuryBrown }}>Recorded Payments</strong> under its category and counts toward the net balance.
                Anything outside that flow can still be captured by hand below.
              </div>
            </div>

            {/* Filters */}
            <div style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "12px 18px", marginBottom: 18 }}>
              <div className="flex flex-wrap items-center gap-3">
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
            </div>

            <SummaryStrip
              income={filtered.income}
              expense={filtered.expense}
              net={filtered.net}
              pendingIncome={filtered.pendingIncome}
              pendingExpense={filtered.pendingExpense}
              quoted={filtered.quoted}
            />

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
                <div style={{ padding: "26px 18px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading linked documents…</div>
              ) : visibleDocs.length === 0 ? (
                <div style={{ padding: "26px 18px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  {documents.length === 0
                    ? "No documents name this firm yet. Select this firm on a purchase order, quotation or dispatch invoice and it will appear here automatically."
                    : "No documents match the current filters."}
                </div>
              ) : (
                <DataTable responsive columns={docColumns} data={visibleDocs} getRowId={d => `${d.type}-${d.id}`} />
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
                <div style={{ padding: "26px 18px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading payments…</div>
              ) : visiblePayments.length === 0 ? (
                <div style={{ padding: "26px 18px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  {payments.length === 0
                    ? "No payments recorded against this firm yet."
                    : "No payments match the current filters."}
                </div>
              ) : (
                <DataTable responsive columns={paymentColumns} data={visiblePayments} getRowId={p => `${p.type}-${p.id}`} />
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
  );
}
