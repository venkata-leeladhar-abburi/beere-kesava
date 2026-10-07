import React, { useState, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Edit3,
  Eye,
  Building2,
  CreditCard,
  Phone,
  MapPin,
  Hash,
  IndianRupee,
  Trash2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useFirms, Firm } from "../contexts/FirmsContext";
import { useFirmActivity, firmActivityKey } from "../hooks/useFirmActivity";
import { findDuplicateEntries } from "./duplicateEntries";
import { firmsApi } from "../../../shared/api/firms";

import { T, F, EASE } from "./theme";
import { SectionCard } from "./primitives";
import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";
import { fmtAmt, fmtFull, initials } from "./utils";
import { Button, SearchInput } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { useConfirm } from "../../../shared/ui/overlay";
import { LoadingState, ErrorState, EmptyState } from "../../../shared/ui/state";

type OverviewRow = {
  firm: Firm;
  inc: number;
  exp: number;
  net: number;
  /** Committed, not settled — owed to the firm / owed by the firm. */
  receivable: number;
  payable: number;
  entryCount: number;
  /** Manual rows that look like they restate an auto-tracked payment. */
  dupCount: number;
  color: string;
};

function overviewColumns(onGoToFirm?: (firmId: string) => void): ColumnDef<OverviewRow>[] {
  return [
    {
      id: "firm",
      header: "Firm",
      accessor: (r) => r.firm.firmName,
      priority: 1,
      cell: (_v, r) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 0",
            borderLeft: `4px solid ${r.color}`,
            marginLeft: -4,
            paddingLeft: 16,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: r.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 3px 10px ${r.color}40`,
            }}
          >
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFF" }}>
              {initials(r.firm.firmName)}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: F.ui,
                fontSize: 14,
                fontWeight: 700,
                color: T.luxuryBrown,
                whiteSpace: "nowrap" as const,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.firm.firmName}
            </div>
            <div
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 2 }}
            >
              {r.firm.id}
              {r.firm.gstNumber ? ` · ${r.firm.gstNumber}` : ""}
            </div>
            {r.dupCount > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 5,
                  fontFamily: F.ui,
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.antiqueGold,
                  background: T.bgGold,
                  border: `1px solid ${T.borderGold}`,
                  borderRadius: 6,
                  padding: "2px 7px",
                }}
              >
                <AlertTriangle size={12} color={T.antiqueGold} />
                {r.dupCount} possible duplicate{r.dupCount === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "income",
      header: "Income",
      type: "currency",
      align: "end",
      accessor: (r) => r.inc,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: T.green,
            }}
          >
            {fmtFull(r.inc)}
          </div>
          {r.inc > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              ↑ earned
            </div>
          )}
        </div>
      ),
    },
    {
      id: "expenses",
      header: "Expenses",
      type: "currency",
      align: "end",
      accessor: (r) => r.exp,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: T.crimson,
            }}
          >
            {fmtFull(r.exp)}
          </div>
          {r.exp > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              ↓ spent
            </div>
          )}
        </div>
      ),
    },
    {
      id: "net",
      header: "Net Balance",
      type: "currency",
      align: "end",
      accessor: (r) => r.net,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: r.net >= 0 ? T.green : T.crimson,
              background: r.net >= 0 ? T.greenBg : T.crimsonBg,
              border: `1px solid ${r.net >= 0 ? "rgba(30,102,64,0.18)" : "rgba(192,57,43,0.18)"}`,
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            {r.net >= 0 ? "+" : ""}
            {fmtFull(r.net)}
          </span>
        </div>
      ),
    },
    {
      id: "receivable",
      header: "Receivable",
      type: "currency",
      align: "end",
      accessor: (r) => r.receivable,
      priority: 3,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: r.receivable > 0 ? T.green : T.taupe,
            }}
          >
            {fmtFull(r.receivable)}
          </div>
          {r.receivable > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              owed to firm
            </div>
          )}
        </div>
      ),
    },
    {
      id: "payable",
      header: "Payable",
      type: "currency",
      align: "end",
      accessor: (r) => r.payable,
      priority: 3,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: r.payable > 0 ? T.crimson : T.taupe,
            }}
          >
            {fmtFull(r.payable)}
          </div>
          {r.payable > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              firm owes
            </div>
          )}
        </div>
      ),
    },
    {
      id: "entries",
      header: "Entries",
      align: "end",
      accessor: (r) => r.entryCount,
      priority: 3,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: T.taupe,
              background: "rgba(139,112,96,0.09)",
              border: `1px solid ${T.borderDef}`,
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            {r.entryCount} entries
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      type: "actions",
      accessor: () => null,
      cell: (_v, r) => (
        <div style={{ display: "flex", justifyContent: "flex-end" as const }}>
          <Button
            variant="secondary"
            size="sm"
            iconRight={ChevronRight}
            onClick={() => onGoToFirm?.(r.firm.id)}
            className="whitespace-nowrap"
          >
            View Details
          </Button>
        </div>
      ),
    },
  ];
}

// ─── Business Overview section (redesigned premium table) ─────────────────────
function BusinessOverview({ onGoToFirm }: { onGoToFirm?: (firmId: string) => void }) {
  const { firms, getFirmFinancials, isLoading: firmsLoading, error, refetch } = useFirms();
  const [open, setOpen] = useState(true);

  const FIRM_COLORS = ["#6E0F2D", "#1E6640", "#C89B47", "#4A061B", "#1565C0"];

  // Real money moved (vendor/weaver/supplier payments, customer receipts)
  // lives on each firm's activity endpoint, not in the manual FirmFinancialEntry
  // rows below — without it, this aggregate silently excludes every payment
  // recorded against a firm's linked documents, same as FirmDetailPage's
  // per-firm total already accounts for (see useFirmActivity).
  const activityQueries = useQueries({
    queries: firms.map((firm) => ({
      queryKey: firmActivityKey(firm.id),
      queryFn: () => firmsApi.activity(firm.id),
    })),
  });
  const activityLoading = activityQueries.some((q) => q.isLoading);
  const isLoading = firmsLoading || activityLoading;

  const rows = useMemo(
    () =>
      firms.map((firm, i) => {
        const fin = getFirmFinancials(firm.id);
        const manualInc =
          fin.income.reduce((s, e) => s + e.amount, 0) +
          fin.misc.filter((m) => m.type === "income").reduce((s, m) => s + m.amount, 0);
        const manualExp =
          fin.expenses.reduce((s, e) => s + e.amount, 0) +
          fin.misc.filter((m) => m.type === "expense").reduce((s, m) => s + m.amount, 0);
        const activity = activityQueries[i]?.data;
        const totals = activity?.totals;
        const payments = activity?.payments ?? [];
        const inc = manualInc + (totals?.realizedIncome ?? 0);
        const exp = manualExp + (totals?.realizedExpense ?? 0);
        // Every row behind these figures, not just the hand-typed ones — a firm
        // whose whole ledger is auto-tracked used to read "0 entries".
        const entryCount =
          fin.income.length +
          fin.expenses.length +
          fin.misc.length +
          payments.length +
          (activity?.documents.length ?? 0);
        // Flagged, never subtracted: a manual row that restates a real payment is
        // a suspicion only a person can settle (see duplicateEntries.ts).
        const dupCount =
          findDuplicateEntries(fin.income, payments, "INCOME").size +
          findDuplicateEntries(fin.expenses, payments, "EXPENSE").size;
        return {
          firm,
          inc,
          exp,
          net: inc - exp,
          receivable: totals?.pendingIncome ?? 0,
          payable: totals?.pendingExpense ?? 0,
          entryCount,
          dupCount,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firms, getFirmFinancials, activityQueries.map((q) => q.dataUpdatedAt).join(",")]
  );

  const totInc = rows.reduce((s, r) => s + r.inc, 0);
  const totExp = rows.reduce((s, r) => s + r.exp, 0);
  const totNet = totInc - totExp;
  const totReceivable = rows.reduce((s, r) => s + r.receivable, 0);
  const totPayable = rows.reduce((s, r) => s + r.payable, 0);

  return (
    <div
      id="firm-overview"
      className="mx-4 md:mx-7 xl:mx-14"
      style={{
        marginTop: 28,
        borderRadius: 22,
        overflow: "hidden",
        background: "#FFF",
        boxShadow: "0 4px 28px rgba(44,24,16,0.10)",
        border: `1px solid ${T.borderDef}`,
      }}
    >
      {/* Header */}
      <div
        className="p-4 sm:p-6 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`,
        }}
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        aria-label={open ? "Collapse Business Overview" : "Expand Business Overview"}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (() => setOpen((o) => !o))?.();
          }
        }}
      >
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(200,155,71,0.18)",
              border: "1px solid rgba(200,155,71,0.30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <TrendingUp size={22} color={T.antiqueGold} />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 w-full">
              <div>
                <div
                  style={{
                    fontFamily: F.display,
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#FFF",
                    lineHeight: 1.2,
                  }}
                >
                  Business Overview
                </div>
                <div
                  style={{
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  Live P&amp;L across all {firms.length} firms · settled money, plus what is still
                  owed either way
                </div>
              </div>
              <div className="shrink-0 p-1">
                {open ? (
                  <ChevronUp size={20} color="rgba(255,255,255,0.70)" />
                ) : (
                  <ChevronDown size={20} color="rgba(255,255,255,0.70)" />
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full pt-1">
              {[
                {
                  label: "Total Income",
                  val: totInc,
                  color: "#4CAF82",
                  bg: "rgba(76,175,130,0.15)",
                },
                {
                  label: "Total Expenses",
                  val: totExp,
                  color: "#E57373",
                  bg: "rgba(229,115,115,0.15)",
                },
                {
                  label: "Net Balance",
                  val: totNet,
                  color: totNet >= 0 ? "#4CAF82" : "#E57373",
                  bg: totNet >= 0 ? "rgba(76,175,130,0.15)" : "rgba(229,115,115,0.15)",
                },
                {
                  label: "Receivable",
                  val: totReceivable,
                  color: "#E7C983",
                  bg: "rgba(231,201,131,0.15)",
                },
                {
                  label: "Payable",
                  val: totPayable,
                  color: "#E7C983",
                  bg: "rgba(231,201,131,0.15)",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="flex-1 min-w-[110px] text-right bg-[rgba(255,255,255,0.06)] border border-white/10 rounded-xl p-2.5 sm:px-3.5 sm:py-2.5"
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: c.color,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {fmtAmt(c.val)}
                  </div>
                  <div
                    style={{
                      fontFamily: F.ui,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.65)",
                      marginTop: 2,
                      letterSpacing: "0.2px",
                    }}
                  >
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            {isLoading ? (
              <div style={{ padding: 20 }}>
                <LoadingState variant="skeleton" rows={4} />
              </div>
            ) : error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No firms yet"
                description="Firms added here appear across income, expenses, and reporting."
              />
            ) : (
              <DataTable<OverviewRow>
                responsive
                pagination
                columns={overviewColumns(onGoToFirm)}
                data={rows.map((r) => ({
                  ...r,
                  color:
                    FIRM_COLORS[parseInt(r.firm.id.replace("FIRM-", ""), 10) % FIRM_COLORS.length],
                }))}
                getRowId={(r) => r.firm.id}
              />
            )}
            {/* Totals row */}
            <div
              className="grid grid-cols-1 md:grid-cols-[2fr_130px_130px_150px_130px_130px_80px_130px]"
              style={{
                gap: 0,
                padding: "16px 28px",
                background: T.bgGold,
                borderTop: `1.5px solid ${T.borderGold}`,
                borderLeft: `4px solid ${T.antiqueGold}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: F.display,
                    fontWeight: 700,
                    fontSize: 14,
                    color: T.luxuryBrown,
                  }}
                >
                  All Firms Total
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                  {rows.length} firms · settled and committed
                </div>
              </div>
              <div
                style={{
                  textAlign: "right" as const,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.green,
                }}
              >
                {fmtFull(totInc)}
              </div>
              <div
                style={{
                  textAlign: "right" as const,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.crimson,
                }}
              >
                {fmtFull(totExp)}
              </div>
              <div style={{ textAlign: "right" as const }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: totNet >= 0 ? T.green : T.crimson,
                  }}
                >
                  {totNet >= 0 ? "+" : ""}
                  {fmtFull(totNet)}
                </span>
              </div>
              <div
                style={{
                  textAlign: "right" as const,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: totReceivable > 0 ? T.green : T.taupe,
                }}
              >
                {fmtFull(totReceivable)}
              </div>
              <div
                style={{
                  textAlign: "right" as const,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: totPayable > 0 ? T.crimson : T.taupe,
                }}
              >
                {fmtFull(totPayable)}
              </div>
              <div />
              <div />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wreath emblem encircling the firm initials — same ornament as the weaver card.
function FirmWreath({ text, color }: { text: string; color: string }) {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center mb-1">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      >
        <circle cx="50" cy="50" r="41" strokeDasharray="3 2" opacity="0.75" />
        <circle cx="50" cy="50" r="35" strokeWidth="1.6" />
        <path d="M 50 4 C 53 12, 47 12, 50 14" strokeWidth="1.5" />
        <path d="M 50 96 C 53 88, 47 88, 50 86" strokeWidth="1.5" />
        <path d="M 4 50 C 12 53, 12 47, 14 50" strokeWidth="1.5" />
        <path d="M 96 50 C 88 53, 88 47, 86 50" strokeWidth="1.5" />
        <path d="M 23 23 C 18 31 22 36 28 35" strokeWidth="1.3" />
        <path d="M 77 23 C 82 31 78 36 72 35" strokeWidth="1.3" />
        <path d="M 23 77 C 18 69 22 64 28 65" strokeWidth="1.3" />
        <path d="M 77 77 C 82 69 78 64 72 65" strokeWidth="1.3" />
      </svg>
      <span className="text-[20px] font-bold tracking-widest z-10 font-serif" style={{ color }}>
        {text}
      </span>
    </div>
  );
}

function FirmLotus({ color }: { color: string }) {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center mb-1">
      <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" stroke={color} strokeWidth="1.4">
        <path d="M 50 20 C 40 38, 32 48, 50 72 C 68 48, 60 38, 50 20 Z" strokeWidth="1.6" />
        <path d="M 50 35 C 36 45, 22 58, 44 72 Z" strokeWidth="1.3" />
        <path d="M 50 35 C 64 45, 78 58, 56 72 Z" strokeWidth="1.3" />
        <path d="M 50 48 C 30 52, 18 65, 40 73 Z" strokeWidth="1.1" />
        <path d="M 50 48 C 70 52, 82 65, 60 73 Z" strokeWidth="1.1" />
        <circle cx="50" cy="50" r="2.5" fill={color} />
      </svg>
    </div>
  );
}

// ─── Firm card ────────────────────────────────────────────────────────────────
// Same visual language as the weaver card (WeaverCardMockupStyle): ornamental
// header cycling burgundy / purple / ivory-lotus / ivory-wreath, ❖ dividers,
// a cream stat panel and a row of pill buttons.
const FirmCard = React.forwardRef<
  HTMLDivElement,
  { firm: Firm; index?: number; onEdit: () => void; onView: () => void; onDelete: () => void }
>(({ firm, index = 0, onEdit, onView, onDelete }, ref) => {
  const { getFirmFinancials } = useFirms();
  const { totals } = useFirmActivity(firm.id);

  const fin = getFirmFinancials(firm.id);
  const inc =
    fin.income.reduce((s, e) => s + e.amount, 0) +
    fin.misc.filter((m) => m.type === "income").reduce((s, m) => s + m.amount, 0) +
    totals.realizedIncome;
  const exp =
    fin.expenses.reduce((s, e) => s + e.amount, 0) +
    fin.misc.filter((m) => m.type === "expense").reduce((s, m) => s + m.amount, 0) +
    totals.realizedExpense;
  const net = inc - exp;
  const isPositive = net >= 0;

  const isDark = index % 4 === 0 || index % 4 === 1;
  const isPurple = index % 4 === 1;
  const isLotus = index % 4 === 2;
  const headerBg = isDark
    ? isPurple
      ? "bg-gradient-to-br from-[#270E32] via-[#481859] to-[#1E0927]"
      : "bg-gradient-to-br from-[#3D0616] via-[#5D1027] to-[#25030D]"
    : "bg-gradient-to-b from-[#FBF8F1] via-[#F6F0E4] to-[#EFE7D7]";
  const headerText = isDark ? "#FFFDF9" : "#4A061B";
  const emblem = isDark ? "#C89B47" : "#8D5802";
  const statusColor = isDark ? "#E7C983" : "#8D5802";
  const badgeClass = isDark
    ? "bg-black/35 border border-white/20 text-[#E7C983]"
    : "bg-[#FEF6EC] border border-[#E7C983]/60 text-[#8D5802]";
  const pill =
    "flex-1 py-2.5 px-1 rounded-[8px] bg-[#FFFDFB] border border-[#F0E5D8] text-[#6E0F2D] font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-[#FEF4F5] hover:border-[#FEE8EB] transition-all cursor-pointer shadow-2xs";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative flex flex-col justify-between rounded-[12px] bg-[#FFFDFB] border border-[#F0E5D8] overflow-hidden text-left shadow-[0_4px_20px_rgba(74,6,27,0.05)] h-full"
    >
      {/* Ornamental header */}
      <div
        className={`h-[235px] relative overflow-hidden flex-shrink-0 flex flex-col items-center justify-center p-4 text-center ${headerBg}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(231,201,131,0.14)_0,transparent_70%)] pointer-events-none" />
        <div
          className={`absolute top-3.5 left-3.5 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg shadow-2xs z-20 ${badgeClass}`}
        >
          {firm.id}
        </div>
        {isLotus ? (
          <FirmLotus color={emblem} />
        ) : (
          <FirmWreath text={initials(firm.firmName)} color={emblem} />
        )}
        <div
          className={`text-[21px] font-bold tracking-wider mb-1 z-10 truncate max-w-[90%] uppercase ${isDark ? "drop-shadow-sm" : ""}`}
          style={{ fontFamily: "'Fraunces', serif", color: headerText }}
        >
          {firm.firmName}
        </div>
        <div
          className="z-10 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase"
          style={{ color: statusColor }}
        >
          {isPositive ? (
            <TrendingUp size={12} className="text-[#2ECC71]" />
          ) : (
            <TrendingDown size={12} className="text-[#F47B72]" />
          )}
          <span>
            {net === 0 ? "No Activity Yet" : isPositive ? "Net Positive" : "Net Outstanding"}
          </span>
        </div>
      </div>

      {/* Header / body divider ❖ */}
      <div className="relative flex items-center justify-center w-full bg-[#FFFDFB]">
        <div className="w-full h-[1px] bg-[#F0E5D8]" />
        <div className="absolute bg-[#FFFDFB] px-2 text-[#C89B47] text-[11px] font-bold leading-none select-none">
          ❖
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3.5 bg-[#FFFDFB]">
        <div>
          <div
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-[19px] font-bold text-[#4A061B] leading-tight mb-2 truncate"
          >
            {firm.firmName}
          </div>

          <div className="flex flex-col gap-1.5 mb-3.5 text-[13px] text-[#69635E]">
            {firm.gstNumber && (
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-[#C89B47] flex-shrink-0" />
                <span className="font-mono">{firm.gstNumber}</span>
              </div>
            )}
            {firm.address && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#C89B47] flex-shrink-0 mt-[2px]" />
                <span className="leading-snug">{firm.address}</span>
              </div>
            )}
            {(firm.contactPersonName || firm.contactPersonPhone) && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#C89B47] flex-shrink-0" />
                <span>
                  {firm.contactPersonName}
                  {firm.contactPersonName && firm.contactPersonPhone ? " · " : ""}
                  <span className="font-mono">{firm.contactPersonPhone}</span>
                </span>
              </div>
            )}
            {(firm.bankName || firm.accountNumber) && (
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-[#C89B47] flex-shrink-0" />
                <span>
                  {firm.bankName}
                  {firm.bankName && firm.accountNumber ? " · " : ""}
                  {firm.accountNumber ? `···${firm.accountNumber.slice(-4)}` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Financials panel */}
          <div className="bg-[#FEF6EC] border border-[#F6D9BA] rounded-[8px] p-3 grid grid-cols-3 gap-2">
            {[
              { label: "Income", val: inc, color: T.green },
              { label: "Expenses", val: exp, color: T.crimson },
              { label: "Net", val: net, color: isPositive ? T.green : T.crimson },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-[10.5px] font-bold text-[#8D5802] tracking-wider uppercase">
                  {s.label}
                </span>
                <span
                  style={{ fontFamily: "'Fraunces', serif", color: s.color }}
                  className="text-[14px] font-bold"
                >
                  {fmtAmt(s.val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pill actions */}
        <div className="flex items-center gap-2 pt-1">
          <button type="button" onClick={onView} className={pill}>
            <Eye size={13} />
            <span>Details</span>
          </button>
          <button type="button" onClick={onEdit} className={pill}>
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${firm.firmName}`}
            className={`${pill} !text-[var(--text-danger)]`}
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Bottom flourish ❖ */}
      <div className="relative flex items-center justify-center w-full pb-3 bg-[#FFFDFB]">
        <div className="w-[80%] h-[1px] bg-[#F0E5D8]/80" />
        <div className="absolute bg-[#FFFDFB] px-2 text-[#C89B47] text-[10px] leading-none select-none">
          ❖
        </div>
      </div>
    </motion.div>
  );
});
FirmCard.displayName = "FirmCard";

import { FirmFormModal } from "./FirmModals";
import { ConnectRetailSalesSection } from "./retailSales/ConnectRetailSalesSection";
import { FirmDetailPage } from "./FirmDetailPage";
const BLANK = {
  firmName: "",
  gstNumber: "",
  address: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  contactPersonName: "",
  contactPersonPhone: "",
  purchaseAmount: undefined,
};

// ─── Main page ────────────────────────────────────────────────────────────────
export function FirmsPage() {
  const { firms, addFirm, updateFirm, deleteFirm, getFirmFinancials } = useFirms();
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  // A firm's details are a PAGE, not a modal — the id lives in the URL so the
  // view is linkable, survives a refresh, and gets a real Back button. The
  // role dashboards route on `/:role/:tab`, so a query param is the one place
  // a sub-view can live without every role's route table having to know
  // about it.
  const [searchParams, setSearchParams] = useSearchParams();
  const openFirmId = searchParams.get("firm");
  // Which sub-tab the firm page opens on. Lives in the URL beside ?firm= so a
  // link into a firm's retail sales is shareable and survives a refresh —
  // without it every route into the firm landed on Financial Tracking.
  const openFirmTab = searchParams.get("tab");
  const openFirm = openFirmId ? (firms.find((f) => f.id === openFirmId) ?? null) : null;

  const [search, setSearch] = useState("");
  // Command palette "New Firm" action deep-links here with ?new=1 to open
  // the create-firm form straight away.
  const [modal, setModal] = useState<{ type: "create" } | { type: "edit"; firm: Firm } | null>(
    () => (new URLSearchParams(location.search).get("new") === "1" ? { type: "create" } : null)
  );

  const filtered = firms.filter(
    (f) =>
      f.firmName.toLowerCase().includes(search.toLowerCase()) ||
      (f.gstNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (f.contactPersonName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Real per-firm expense totals (manual entries plus vendor/supplier/weaver
  // payments actually recorded against the firm), the same source
  // BusinessOverview below already uses. Previously this summed
  // `firm.purchaseAmount`, a free-text field typed once when a firm is
  // created/edited that's never kept in sync with real payments — showing
  // whatever placeholder number was entered instead of the real total.
  const activityQueries = useQueries({
    queries: firms.map((firm) => ({
      queryKey: firmActivityKey(firm.id),
      queryFn: () => firmsApi.activity(firm.id),
    })),
  });
  const firmExpenseTotals = firms.map((f, i) => {
    const fin = getFirmFinancials(f.id);
    const manualExp =
      fin.expenses.reduce((s, e) => s + e.amount, 0) +
      fin.misc.filter((m) => m.type === "expense").reduce((s, m) => s + m.amount, 0);
    return manualExp + (activityQueries[i]?.data?.totals.realizedExpense ?? 0);
  });
  // Money that has actually left the firms — vendor, supplier and weaver
  // payments plus hand-entered expenses. It was previously labelled "Total
  // Purchases", which it never was: weaver wages and misc expenses are in here
  // too, and a raised-but-unpaid purchase order is not.
  const totalSpent = firmExpenseTotals.reduce((s, v) => s + v, 0);
  // Committed money across every firm — what the hero used to spend two tiles
  // on ("firms with balance", "avg purchase") told nobody anything actionable.
  const totalReceivable = firms.reduce(
    (sum, _f, i) => sum + (activityQueries[i]?.data?.totals.pendingIncome ?? 0),
    0
  );
  const totalPayable = firms.reduce(
    (sum, _f, i) => sum + (activityQueries[i]?.data?.totals.pendingExpense ?? 0),
    0
  );

  function openFirmView(firmId: string, tab?: string) {
    setSearchParams(tab ? { firm: firmId, tab } : { firm: firmId });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  function closeFirmView() {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  // Payment entry stays owned by the Payments page — the firm view links out
  // rather than growing a second, divergent payment form. The role segment is
  // taken from the live path so this works for every dashboard that mounts
  // FirmsPage (superadmin, admin, accountant).
  function goToPayments() {
    const role = location.pathname.split("/").filter(Boolean)[0];
    navigate(role ? `/${role}/payments` : "/superadmin/payments");
  }

  async function handleDeleteFirm(firm: Firm) {
    const confirmed = await confirm({
      title: `Delete ${firm.firmName}?`,
      description:
        "This permanently removes the firm and cannot be undone. Firms with financial entries or payments recorded against them can't be deleted — clear those first. Type the firm name to confirm.",
      typeToConfirm: firm.firmName,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    await deleteFirm(firm.id);
  }

  // ── Firm detail view ────────────────────────────────────────────────────
  // Rendered in place of the directory (not over it) — a real page with its
  // own header and Back button. The edit modal stays available on top.
  if (openFirm) {
    return (
      <>
        <FirmDetailPage
          firm={openFirm}
          initialTab={openFirmTab === "retail" || openFirmTab === "info" ? openFirmTab : "finance"}
          onBack={closeFirmView}
          onEdit={() => setModal({ type: "edit", firm: openFirm })}
          onGoToPayments={goToPayments}
        />
        <AnimatePresence>
          {modal?.type === "edit" && (
            <FirmFormModal
              key="edit-modal"
              title="Save Changes"
              initial={{
                firmName: modal.firm.firmName,
                gstNumber: modal.firm.gstNumber ?? "",
                address: modal.firm.address ?? "",
                accountNumber: modal.firm.accountNumber ?? "",
                ifscCode: modal.firm.ifscCode ?? "",
                bankName: modal.firm.bankName ?? "",
                contactPersonName: modal.firm.contactPersonName ?? "",
                contactPersonPhone: modal.firm.contactPersonPhone ?? "",
                purchaseAmount: modal.firm.purchaseAmount,
              }}
              onSave={(data) => updateFirm(modal.firm.id, data)}
              onClose={() => setModal(null)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // A stale ?firm= id (deleted firm, hand-edited URL) must not strand the
  // user on a blank screen — fall through to the directory below.

  return (
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header
        style={{
          background: "#0D0207",
          position: "relative",
          overflow: "hidden",
          minHeight: 340,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="px-4 md:px-7 xl:px-12 w-full"
          style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}
        >
          <div
            style={{
              fontFamily: F.ui,
              fontSize: "clamp(11px, 1.4vw, 13px)",
              color: "rgba(255,253,249,0.50)",
              letterSpacing: "1.8px",
              textTransform: "uppercase" as const,
              marginBottom: 10,
            }}
          >
            SINCE 1999 · FIRMS &amp; VENDORS
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap" as const,
              marginBottom: 8,
            }}
          >
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(32px, 6vw, 56px)",
                fontWeight: 400,
                color: "#FFFDF9",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Firms
            </h1>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(22px, 5vw, 36px)",
                fontStyle: "italic",
                color: T.antiqueGold,
                fontWeight: 400,
              }}
            >
              &amp; Vendor Management
            </span>
          </div>
          <p
            className="max-w-[600px]"
            style={{
              fontFamily: F.ui,
              fontSize: "clamp(14px, 2.2vw, 16px)",
              fontWeight: 400,
              color: "rgba(255,253,249,0.70)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Manage all firms used for material purchases, weaver payments, and customer invoicing.
            Track income, expenses, and net balance per firm.
          </p>
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        className="px-4 md:px-7 xl:px-14 -mt-8 md:-mt-12 xl:-mt-[72px]"
        style={{ position: "relative", zIndex: 20 }}
      >
        <LuxuryStatsCard
          stats={[
            {
              label: "REGISTERED FIRMS",
              value: String(firms.length),
              sub: "Active vendor accounts",
              icon: <Building2 size={20} color="rgba(245,232,208,0.90)" />,
              highlight: false,
            },
            {
              label: "TOTAL SPENT",
              value: fmtAmt(totalSpent),
              sub: "Payments actually made, all firms",
              icon: <IndianRupee size={20} color="rgba(231,201,131,0.95)" />,
              highlight: true,
            },
            {
              label: "RECEIVABLE",
              value: fmtAmt(totalReceivable),
              sub: "Owed to these firms, unsettled",
              icon: <TrendingUp size={20} color="rgba(245,232,208,0.90)" />,
              highlight: false,
            },
            {
              label: "PAYABLE",
              value: fmtAmt(totalPayable),
              sub: "These firms owe, unsettled",
              icon: <CreditCard size={20} color="rgba(245,232,208,0.90)" />,
              highlight: false,
            },
          ]}
        />
      </motion.div>

      {/* Business Overview */}
      <BusinessOverview onGoToFirm={openFirmView} />

      {/* Connect retail sales to a firm */}
      <ConnectRetailSalesSection
        firms={firms}
        onGoToRetailSales={(id) => openFirmView(id, "retail")}
      />

      {/* Firms directory */}
      <div
        id="firm-directory"
        className="px-4 md:px-7 xl:px-14"
        style={{ paddingTop: 40, paddingBottom: 80 }}
      >
        <SectionCard
          icon={Building2}
          title="Firms Directory"
          subtitle="Every registered firm, its financials, and its contacts."
          actions={
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="secondary"
                iconLeft={Plus}
                onClick={() => setModal({ type: "create" })}
                className="bg-white/10 text-[#FFFDF9] border-white/20"
              >
                Add New Firm
              </Button>
            </motion.div>
          }
        >
          <div className="max-w-[380px]" style={{ marginBottom: 20 }}>
            <SearchInput
              aria-label="Search by firm name, GST, or contact"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by firm name, GST, or contact..."
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: T.taupe }}>
              <Building2 size={40} color={T.borderDef} style={{ margin: "0 auto 16px" }} />
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.taupe }}>
                No firms found
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, marginTop: 6 }}>
                {search
                  ? "Try a different search term"
                  : "Add your first firm using the button above"}
              </div>
            </div>
          ) : (
            <motion.div
              layout
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 20,
              }}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((firm, i) => (
                  <FirmCard
                    key={firm.id}
                    firm={firm}
                    index={i}
                    onEdit={() => setModal({ type: "edit", firm })}
                    onView={() => openFirmView(firm.id)}
                    onDelete={() => void handleDeleteFirm(firm)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </SectionCard>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === "create" && (
          <FirmFormModal
            key="create-modal"
            title="Add New Firm"
            initial={BLANK}
            onSave={(data) => addFirm(data)}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "edit" && (
          <FirmFormModal
            key="edit-modal"
            title="Save Changes"
            initial={{
              firmName: modal.firm.firmName,
              gstNumber: modal.firm.gstNumber ?? "",
              address: modal.firm.address ?? "",
              accountNumber: modal.firm.accountNumber ?? "",
              ifscCode: modal.firm.ifscCode ?? "",
              bankName: modal.firm.bankName ?? "",
              contactPersonName: modal.firm.contactPersonName ?? "",
              contactPersonPhone: modal.firm.contactPersonPhone ?? "",
              purchaseAmount: modal.firm.purchaseAmount,
            }}
            onSave={(data) => updateFirm(modal.firm.id, data)}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
