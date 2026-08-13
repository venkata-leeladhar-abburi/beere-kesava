import React, { useState, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
const imgFirmsHero = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Plus, Edit, Eye, X, Building2, CreditCard, User, Phone,
  MapPin, Hash, IndianRupee, Check,
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




type OverviewRow = { firm: Firm; inc: number; exp: number; net: number; entryCount: number; color: string };

function overviewColumns(onGoToFirm?: (firmId: string) => void): ColumnDef<OverviewRow>[] {
  return [
    {
      id: "firm", header: "Firm", accessor: r => r.firm.firmName, priority: 1,
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
      id: "entries", header: "Entries", align: "end", accessor: r => r.entryCount, priority: 3,
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
              responsive
              columns={overviewColumns(onGoToFirm)}
              data={rows.map(r => ({ ...r, color: FIRM_COLORS[parseInt(r.firm.id.replace("FIRM-",""), 10) % FIRM_COLORS.length] }))}
              getRowId={r => r.firm.id}
            />
            {/* Totals row */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_130px_130px_150px_80px_36px]" style={{ gap: 0, padding: "16px 28px", background: T.bgGold, borderTop: `1.5px solid ${T.borderGold}`, borderLeft: `4px solid ${T.antiqueGold}` }}>
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
const FirmCard = React.forwardRef<HTMLDivElement, { firm: Firm; onEdit: () => void; onView: () => void }>(({ firm, onEdit, onView }, ref) => {
  const { getFirmFinancials } = useFirms();
  const [hov, setHov] = useState(false);
  const color = cardColor(firm.id);

  const fin = getFirmFinancials(firm.id);
  const inc = fin.income.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
  const exp = fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
  const net = inc - exp;

  return (
    <motion.div ref={ref} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{ background: "#FFF", borderRadius: 18, border: `1.5px solid ${hov ? T.royalBurgundy : T.borderDef}`, boxShadow: hov ? "0 8px 32px rgba(110,15,45,0.12)" : "0 2px 12px rgba(44,24,16,0.06)", overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column" }}>

      {/* Color band header */}
      <div style={{ background: color, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{initials(firm.firmName)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: "#FFF", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{firm.firmName}</div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.65)", letterSpacing: "1px", marginTop: 2 }}>{firm.id}</div>
        </div>
        {firm.purchaseAmount && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: "#FFF" }}>{fmtAmt(firm.purchaseAmount)}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>Total Purchase</div>
          </div>
        )}
      </div>

      {/* Financial mini-strip */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderBottom: `1px solid ${T.borderDef}` }}>
        {[
          { label: "Income",   val: inc, color: T.green   },
          { label: "Expenses", val: exp, color: T.crimson  },
          { label: "Net",      val: net, color: net >= 0 ? T.green : T.crimson },
        ].map((s, i) => (
          <div key={i} style={{ padding: "9px 14px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", textAlign: i === 2 ? "right" : "left" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: s.color }}>{fmtFull(s.val)}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {firm.gstNumber && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Hash size={13} color={T.taupe} />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, letterSpacing: "0.5px" }}>{firm.gstNumber}</span>
          </div>
        )}
        {firm.address && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <MapPin size={13} color={T.taupe} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.5 }}>{firm.address}</span>
          </div>
        )}
        {(firm.bankName || firm.accountNumber) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={13} color={T.taupe} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
              {firm.bankName}{firm.bankName && firm.accountNumber ? " · " : ""}{firm.accountNumber ? `···${firm.accountNumber.slice(-4)}` : ""}
            </span>
          </div>
        )}
        {firm.ifscCode && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "rgba(139,112,96,0.10)", border: "1px solid rgba(139,112,96,0.18)", borderRadius: 4, padding: "2px 8px" }}>IFSC</span>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{firm.ifscCode}</span>
          </div>
        )}
        {(firm.contactPersonName || firm.contactPersonPhone) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4, borderTop: `1px solid ${T.borderDef}`, marginTop: 4 }}>
            <User size={13} color={T.taupe} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{firm.contactPersonName}</span>
            {firm.contactPersonPhone && (<>
              <span style={{ color: T.borderDef, fontSize: 12 }}>·</span>
              <Phone size={11} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{firm.contactPersonPhone}</span>
            </>)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 8 }}>
        <Button onClick={onView} variant="tertiary" size="sm" iconLeft={Eye} fullWidth>
          View Details
        </Button>
        <Button onClick={onEdit} variant="secondary" size="sm" iconLeft={Edit} fullWidth>
          Edit
        </Button>
      </div>
    </motion.div>
  );
});
FirmCard.displayName = "FirmCard";

import { FirmFormModal, FirmDetailModal } from "./FirmModals";
const BLANK = { firmName: "", gstNumber: "", address: "", accountNumber: "", ifscCode: "", bankName: "", contactPersonName: "", contactPersonPhone: "", purchaseAmount: undefined };


// ─── Main page ────────────────────────────────────────────────────────────────
export function FirmsPage() {
  const { firms, addFirm, updateFirm, getFirmFinancials } = useFirms();
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

  const totalPurchase = firms.reduce((s, f) => s + (f.purchaseAmount ?? 0), 0);

  function openFirmView(firmId: string) {
    const firm = firms.find(f => f.id === firmId);
    if (firm) setModal({ type: "view", firm });
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
            { label: "FIRMS WITH BALANCE", val: String(firms.filter(f => (f.purchaseAmount ?? 0) > 0).length), sub: "Active purchase records", hi: false, Icon: CreditCard },
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
                  onView={() => setModal({ type: "view", firm })} />
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
