import React, { useState, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
const imgFirmsHero = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Plus, Edit, Edit3, Eye, X, Building2, CreditCard, User, Phone,
  MapPin, Hash, IndianRupee, Check, Trash2,
  TrendingUp, TrendingDown, Minus, Upload, ChevronDown, ChevronUp, ChevronRight,
  PlusCircle, FileSpreadsheet, ArrowRight, AlertTriangle,
} from "lucide-react";
import {
  useFirms, Firm,
  FinancialEntry, MiscEntry,
  IncomeCategory, ExpenseCategory, MiscType,
} from "../contexts/FirmsContext";

import { T, F, EASE } from "./theme";
import { SectionCard } from "./primitives";
import { fmtAmt, fmtFull, initials, cardColor } from "./utils";
import { Button, IconButton, SearchInput } from "../../../shared/ui/primitives";
import { Money } from "../../../shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { useConfirm } from "../../../shared/ui/overlay";




type OverviewRow = { firm: Firm; inc: number; exp: number; net: number; entryCount: number; color: string };

function overviewColumns(onGoToFirm?: (firmId: string) => void): ColumnDef<OverviewRow>[] {
  return [
    {
      id: "firm", header: "Firm", accessor: r => r.firm.firmName,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderLeft: `4px solid ${r.color}`, marginLeft: -4, paddingLeft: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: r.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px ${r.color}40` }}>
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials(r.firm.firmName)}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{r.firm.firmName}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{r.firm.id}{r.firm.gstNumber ? ` · ${r.firm.gstNumber}` : ""}</div>
          </div>
        </div>
      ),
    },
    {
      id: "income", header: "Income", type: "currency", align: "end", accessor: r => r.inc,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>{fmtFull(r.inc)}</div>
          {r.inc > 0 && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>↑ earned</div>}
        </div>
      ),
    },
    {
      id: "expenses", header: "Expenses", type: "currency", align: "end", accessor: r => r.exp,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>{fmtFull(r.exp)}</div>
          {r.exp > 0 && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>↓ spent</div>}
        </div>
      ),
    },
    {
      id: "net", header: "Net Balance", type: "currency", align: "end", accessor: r => r.net,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <span style={{ display: "inline-block", fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: r.net >= 0 ? T.green : T.crimson, background: r.net >= 0 ? T.greenBg : T.crimsonBg, border: `1px solid ${r.net >= 0 ? "rgba(30,102,64,0.18)" : "rgba(192,57,43,0.18)"}`, borderRadius: 8, padding: "4px 10px" }}>
            {r.net >= 0 ? "+" : ""}{fmtFull(r.net)}
          </span>
        </div>
      ),
    },
    {
      id: "entries", header: "Entries", align: "end", accessor: r => r.entryCount,
      cell: (_v, r) => (
        <div style={{ textAlign: "right" as const }}>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "rgba(139,112,96,0.09)", border: `1px solid ${T.borderDef}`, borderRadius: 6, padding: "3px 8px" }}>
            {r.entryCount} entries
          </span>
        </div>
      ),
    },
    {
      id: "actions", header: "", type: "actions", accessor: () => null,
      cell: (_v, r) => (
        <div style={{ display: "flex", justifyContent: "flex-end" as const }}>
          <IconButton
            icon={ArrowRight}
            label={`Go to ${r.firm.firmName}`}
            variant="tertiary"
            size="sm"
            onClick={() => onGoToFirm?.(r.firm.id)}
            className="size-7"
          />
        </div>
      ),
    },
  ];
}

// ─── Business Overview section (redesigned premium table) ─────────────────────
function BusinessOverview({ onGoToFirm }: { onGoToFirm?: (firmId: string) => void }) {
  const { firms, getFirmFinancials } = useFirms();
  const [open, setOpen] = useState(true);

  const FIRM_COLORS = ["#6E0F2D","#1E6640","#C89B47","#4A061B","#1565C0"];

  const rows = useMemo(() => firms.map(firm => {
    const fin = getFirmFinancials(firm.id);
    const inc = fin.income.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
    const exp = fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
    const entryCount = fin.income.length + fin.expenses.length + fin.misc.length;
    return { firm, inc, exp, net: inc - exp, entryCount };
  }), [firms, getFirmFinancials]);

  const totInc = rows.reduce((s, r) => s + r.inc, 0);
  const totExp = rows.reduce((s, r) => s + r.exp, 0);
  const totNet = totInc - totExp;

  return (
    <div style={{ margin: "28px 56px 0", borderRadius: 22, overflow: "hidden", background: "#FFF", boxShadow: "0 4px 28px rgba(44,24,16,0.10)", border: `1px solid ${T.borderDef}` }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`, padding: "18px 28px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setOpen(o => !o)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setOpen(o => !o))?.(); } }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TrendingUp size={20} color={T.antiqueGold} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Business Overview</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Live P&amp;L across all {firms.length} firms · entries manually tracked</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Total Income",   val: totInc, color: "#4CAF82", bg: "rgba(76,175,130,0.15)" },
            { label: "Total Expenses", val: totExp, color: "#E57373", bg: "rgba(229,115,115,0.15)" },
            { label: "Net Balance",    val: totNet, color: totNet >= 0 ? "#4CAF82" : "#E57373", bg: totNet >= 0 ? "rgba(76,175,130,0.15)" : "rgba(229,115,115,0.15)" },
          ].map((c, i) => (
            <div key={i} style={{ textAlign: "right", background: c.bg, border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "10px 16px" }}>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: c.color, letterSpacing: "-0.5px" }}>{fmtAmt(c.val)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2, letterSpacing: "0.3px" }}>{c.label}</div>
            </div>
          ))}
        </div>
        {open ? <ChevronUp size={18} color="rgba(255,255,255,0.60)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.60)" />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} style={{ overflow: "hidden" }}>
            <DataTable<OverviewRow>
              columns={overviewColumns(onGoToFirm)}
              data={rows.map(r => ({ ...r, color: FIRM_COLORS[parseInt(r.firm.id.replace("FIRM-",""), 10) % FIRM_COLORS.length] }))}
              getRowId={r => r.firm.id}
            />
            {/* Totals row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 130px 130px 150px 80px 36px", gap: 0, padding: "16px 28px", background: T.bgGold, borderTop: `1.5px solid ${T.borderGold}`, borderLeft: `4px solid ${T.antiqueGold}` }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>All Firms Total</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{rows.length} firms · manual entries</div>
              </div>
              <div style={{ textAlign: "right" as const, fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>{fmtFull(totInc)}</div>
              <div style={{ textAlign: "right" as const, fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.crimson }}>{fmtFull(totExp)}</div>
              <div style={{ textAlign: "right" as const }}>
                <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: totNet >= 0 ? T.green : T.crimson }}>
                  {totNet >= 0 ? "+" : ""}{fmtFull(totNet)}
                </span>
              </div>
              <div /><div />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Firm card ────────────────────────────────────────────────────────────────
// Restyled after the Weaver card (features/weavers/.../WeaverCardAndListViews.tsx):
// gradient photo-banner header with floating id badge + status pill, a
// content area with meta rows + a bordered "stat tile" panel, and a
// three-button footer — same visual language, adapted for a firm (no photo,
// so the banner is always the gradient-initials fallback; "status" reads
// net balance instead of a weaving state).
const FirmCard = React.forwardRef<HTMLDivElement, { firm: Firm; onEdit: () => void; onView: () => void; onDelete: () => void }>(({ firm, onEdit, onView, onDelete }, ref) => {
  const { getFirmFinancials } = useFirms();
  const color = cardColor(firm.id);

  const fin = getFirmFinancials(firm.id);
  const inc = fin.income.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const exp = fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  const net = inc - exp;
  const isPositive = net >= 0;

  return (
    <motion.div ref={ref} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -6, boxShadow: "0 30px 70px rgba(74,6,27,0.12)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header banner — gradient-initials fallback (firms have no photo) */}
      <div style={{ height: 128, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${color} 0%, ${T.luxuryBrown} 100%)`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: F.display, fontSize: 40, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{initials(firm.firmName)}</span>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", maxWidth: "calc(100% - 24px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
          {firm.id}
        </div>

        <div style={{ position: "absolute", bottom: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
          {isPositive ? <TrendingUp size={13} color="#2ECC71" style={{ flexShrink: 0 }} /> : <TrendingDown size={13} color="#F47B72" style={{ flexShrink: 0 }} />}
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" as const, letterSpacing: "0.5px", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {net === 0 ? "No Activity Yet" : isPositive ? "Net Positive" : "Net Outstanding"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
          {firm.firmName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {firm.gstNumber && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              <Hash size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: F.mono, letterSpacing: "0.4px" }}>{firm.gstNumber}</span>
            </div>
          )}
          {firm.address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ lineHeight: 1.4 }}>{firm.address}</span>
            </div>
          )}
          {(firm.contactPersonName || firm.contactPersonPhone) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
              <span>{firm.contactPersonName}{firm.contactPersonName && firm.contactPersonPhone ? " · " : ""}{firm.contactPersonPhone}</span>
            </div>
          )}
          {(firm.bankName || firm.accountNumber) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              <CreditCard size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
              <span>{firm.bankName}{firm.bankName && firm.accountNumber ? " · " : ""}{firm.accountNumber ? `···${firm.accountNumber.slice(-4)}` : ""}</span>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

        {/* Financials stat tile */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Income", val: inc, color: T.green },
              { label: "Expenses", val: exp, color: T.crimson },
              { label: "Net", val: net, color: isPositive ? T.green : T.crimson },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{s.label}</span>
                <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: s.color }}>{fmtAmt(s.val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
          <Button onClick={onView} variant="secondary" size="sm" className="flex-1 rounded-xl bg-[rgba(110,15,45,0.04)] text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.15)]">
            <Eye size={14} /> Details
          </Button>
          <Button onClick={onEdit} variant="secondary" size="sm" className="flex-1 rounded-xl bg-transparent text-[#6E0F2D] border border-[#6E0F2D]">
            <Edit3 size={13} /> Edit
          </Button>
          <IconButton icon={Trash2} label={`Delete ${firm.firmName}`} onClick={onDelete} variant="secondary" size="sm"
            className="rounded-xl border-[1.5px] border-[rgba(192,57,43,0.20)] bg-[rgba(192,57,43,0.05)] text-[var(--text-danger)] hover:bg-[rgba(192,57,43,0.12)]" />
        </div>
      </div>
    </motion.div>
  );
});
FirmCard.displayName = "FirmCard";

import { FirmFormModal, FirmDetailModal } from "./FirmModals";
const BLANK = { firmName: "", gstNumber: "", address: "", accountNumber: "", ifscCode: "", bankName: "", contactPersonName: "", contactPersonPhone: "", purchaseAmount: undefined };


// ─── Main page ────────────────────────────────────────────────────────────────
export function FirmsPage() {
  const { firms, addFirm, updateFirm, deleteFirm, getFirmFinancials } = useFirms();
  const confirm = useConfirm();
  const location = useLocation();
  const [search, setSearch] = useState("");
  // Command palette "New Firm" action deep-links here with ?new=1 to open
  // the create-firm form straight away.
  const [modal, setModal] = useState<
    | { type: "create" }
    | { type: "edit"; firm: Firm }
    | { type: "view"; firm: Firm }
    | null
  >(() => (new URLSearchParams(location.search).get("new") === "1" ? { type: "create" } : null));

  const filtered = firms.filter(f =>
    f.firmName.toLowerCase().includes(search.toLowerCase()) ||
    (f.gstNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (f.contactPersonName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Real per-firm expense totals (money actually spent — vendor/supplier/
  // weaver payments recorded against the firm), the same source
  // BusinessOverview below already uses. Previously this summed
  // `firm.purchaseAmount`, a free-text field typed once when a firm is
  // created/edited that's never kept in sync with real payments — showing
  // whatever placeholder number was entered instead of the real total.
  const firmExpenseTotals = firms.map(f => {
    const fin = getFirmFinancials(f.id);
    return fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  });
  const totalPurchase = firmExpenseTotals.reduce((s, v) => s + v, 0);
  const firmsWithBalanceCount = firmExpenseTotals.filter(v => v > 0).length;

  function openFirmView(firmId: string) {
    const firm = firms.find(f => f.id === firmId);
    if (firm) setModal({ type: "view", firm });
  }

  async function handleDeleteFirm(firm: Firm) {
    const confirmed = await confirm({
      title: `Delete ${firm.firmName}?`,
      description: "This permanently removes the firm and cannot be undone. Firms with financial entries or payments recorded against them can't be deleted — clear those first. Type the firm name to confirm.",
      typeToConfirm: firm.firmName,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    await deleteFirm(firm.id);
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 100%", maxWidth: "100%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · FIRMS &amp; VENDORS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Firms</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Vendor Management</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 400, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
            Manage all firms used for material purchases, weaver payments, and customer invoicing. Track income, expenses, and net balance per firm.
          </p>
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { label: "REGISTERED FIRMS",   val: String(firms.length),    sub: "Active vendor accounts",         hi: false, Icon: Building2 },
            { label: "TOTAL PURCHASES",    val: fmtAmt(totalPurchase),   sub: "Across all registered firms",    hi: true,  Icon: IndianRupee },
            { label: "FIRMS WITH BALANCE", val: String(firmsWithBalanceCount), sub: "Active purchase records", hi: false, Icon: CreditCard },
            { label: "AVG PURCHASE",       val: firms.length ? fmtAmt(totalPurchase / firms.length) : <Money value={rupees(0)} />, sub: "Per registered firm", hi: false, Icon: TrendingUp },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                backgroundColor: "rgba(0,0,0,0)",
                borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative",
                cursor: "pointer",
              }}
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ duration: 0.25 }}
                style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <m.Icon size={22} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </motion.div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 48, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                    {m.sub}
                  </span>
                  {m.hi && (
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(200,155,71,0.10)" }}
                    >
                      <ChevronRight size={10} color={T.goldLight} />
                    </motion.div>
                  )}
                </div>
              </div>
              {m.hi && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Business Overview */}
      <BusinessOverview onGoToFirm={openFirmView} />

      {/* Firms directory */}
      <div style={{ padding: "40px 56px 80px" }}>
      <SectionCard
        icon={Building2}
        title="Firms Directory"
        subtitle="Every registered firm, its financials, and its contacts."
        actions={
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button variant="secondary" iconLeft={Plus} onClick={() => setModal({ type: "create" })} className="bg-white/10 text-[#FFFDF9] border-white/20">
              Add New Firm
            </Button>
          </motion.div>
        }
      >
        <div style={{ marginBottom: 20, maxWidth: 380 }}>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by firm name, GST, or contact..." />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: T.taupe }}>
            <Building2 size={40} color={T.borderDef} style={{ margin: "0 auto 16px" }} />
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.taupe }}>No firms found</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, marginTop: 6 }}>{search ? "Try a different search term" : "Add your first firm using the button above"}</div>
          </div>
        ) : (
          <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map(firm => (
                <FirmCard key={firm.id} firm={firm}
                  onEdit={() => setModal({ type: "edit", firm })}
                  onView={() => setModal({ type: "view", firm })}
                  onDelete={() => void handleDeleteFirm(firm)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </SectionCard>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === "create" && (
          <FirmFormModal key="create-modal" title="Add New Firm" initial={BLANK}
            onSave={data => addFirm(data)} onClose={() => setModal(null)} />
        )}
        {modal?.type === "edit" && (
          <FirmFormModal key="edit-modal" title="Save Changes"
            initial={{ firmName: modal.firm.firmName, gstNumber: modal.firm.gstNumber ?? "", address: modal.firm.address ?? "", accountNumber: modal.firm.accountNumber ?? "", ifscCode: modal.firm.ifscCode ?? "", bankName: modal.firm.bankName ?? "", contactPersonName: modal.firm.contactPersonName ?? "", contactPersonPhone: modal.firm.contactPersonPhone ?? "", purchaseAmount: modal.firm.purchaseAmount }}
            onSave={data => updateFirm(modal.firm.id, data)} onClose={() => setModal(null)} />
        )}
        {modal?.type === "view" && (
          <FirmDetailModal key="view-modal" firm={modal.firm}
            onClose={() => setModal(null)}
            onEdit={() => setModal({ type: "edit", firm: modal.firm })} />
        )}
      </AnimatePresence>
    </div>
  );
}
