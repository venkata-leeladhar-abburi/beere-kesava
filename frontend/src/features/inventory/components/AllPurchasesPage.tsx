import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Layers, Tag, Sparkles, ChevronLeft, IndianRupee, Building2,
} from "lucide-react";
import { ViewPurchaseModal, PrintPurchaseModal, Purchase, MatType } from "./PurchaseModals";
import { PurchaseCard } from "./PurchaseCard";
import { Pagination, usePagination } from "../../../shared/ui/DataPagination";
import { Button, SearchInput } from "../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../shared/ui/state";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { rawMaterialsApi, type GrnReceiptItem } from "../../../shared/api/rawMaterials";
import { vendorsApi } from "../../../shared/api/vendors";
import { rupees, formatMoney, sumMoney } from "@/lib/domain/money";
import { jariToReels, formatBunsReels } from "../../../shared/lib/weightUnits";

const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  warmCream:     "#F5E8D0",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

/** Backend RawMaterialType → the label the cards and modals are keyed on.
 *  A line whose type isn't one of the three is dropped rather than defaulted:
 *  MAT_CFG has no entry for it, and rendering one would throw. */
const MAT_TYPE: Record<string, MatType | undefined> = {
  WARP: "Warp", RESHAM: "Resham", JARI: "Jari",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Jari is always shown in Reels regardless of the unit it was received in
 *  (see shared/lib/weightUnits) — everything else keeps its own unit. */
function fmtQuantity(quantity: number, unit: string, type: MatType): string {
  if (type === "Jari") return formatBunsReels(jariToReels(quantity, unit || "Reels"));
  return `${quantity} ${unit || ""}`.trim();
}

/** A purchase card plus the receipt's raw timestamp.
 *
 *  `Purchase.date` is already formatted for display ("01 May 2026"), which is
 *  not something to hand a date filter — parsing it back would depend on the
 *  locale it was written in. The ISO value the receipt actually carries rides
 *  along here instead, and the shared `Purchase` shape stays untouched. */
type PurchaseRow = Purchase & { receivedIso: string | null };

/**
 * One card per material line on a goods receipt.
 *
 * A purchase here is a *material* actually received, not a whole order: the
 * card, the detail modal and the printed GRN are all single-material, and the
 * Warp / Resham / Jari tabs can only count a line if each line stands alone.
 * A receipt covering warp and jari therefore produces two cards, one under
 * each tab, which is also how the vendor's own bill itemises it.
 */
function receiptRows(g: GrnReceiptItem, cityOf: (vendorId: string | null | undefined, name: string) => string): PurchaseRow[] {
  return g.items.flatMap(item => {
    const type = MAT_TYPE[item.materialType];
    if (!type) return [];
    const quantity = Number(item.quantity) || 0;
    const rejected = Number(item.rejectedQuantity) || 0;
    // totalPrice is what the receiving desk recorded; recompute from the unit
    // price only when it was left at zero, so a card never shows ₹0 for goods
    // that do have a price behind them.
    const total = Number(item.totalPrice) || quantity * (Number(item.unitPrice) || 0);
    const notes = [
      g.notes || null,
      rejected > 0 ? `${fmtQuantity(rejected, item.unit || "", type)} of this line was rejected at receipt.` : null,
      g.invoiceNo ? `Vendor invoice ${g.invoiceNo}${g.invoiceDate ? ` dated ${fmtDate(g.invoiceDate)}` : ""}.` : null,
    ].filter(Boolean).join(" ");

    return [{
      id: item.id,
      receivedIso: g.receivedDate ?? null,
      // A GRN can be recorded ad hoc, with no order behind it at all.
      po: g.purchaseOrders[0]?.poNumber ?? "Direct purchase",
      date: fmtDate(g.receivedDate),
      vendor: g.supplierName || "—",
      vendorCity: cityOf(g.vendorId, g.supplierName),
      firmName: g.firm?.firmName ?? "—",
      material: [item.name, item.description].filter(Boolean).join(" · ") || item.name,
      type,
      quantity: fmtQuantity(quantity, item.unit || "", type),
      totalPaid: rupees(total),
      // "received" is the whole point of a GRN; a line with a rejected
      // portion is the one case where the entry isn't cleanly complete.
      status: rejected > 0 ? "pending" : "received",
      // The line's own barcode id where it has one, else the parent receipt's.
      grn: item.itemCode ?? g.id,
      notes: notes || undefined,
    }];
  });
}

export function AllPurchasesPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MatType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [printPurchase, setPrintPurchase] = useState<Purchase | null>(null);

  // Same query keys the Materials page's Purchase History section uses, so the
  // two views share one cache rather than each refetching the same receipts.
  const { data: grnRes, isLoading, isError, refetch } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });
  // Vendor city is the one field a receipt doesn't carry — it lives on the
  // vendor record. A failure here only costs the "City, State" line, so the
  // page renders without it rather than erroring out.
  const { data: vendorRes } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => vendorsApi.list(100),
  });

  const cityOf = useMemo(() => {
    const byId = new Map((vendorRes?.items ?? []).map(v => [v.id, v]));
    const byName = new Map((vendorRes?.items ?? []).map(v => [v.name.trim().toLowerCase(), v]));
    return (vendorId: string | null | undefined, name: string) => {
      // Ad-hoc receipts record only a free-text supplier name, so fall back to
      // matching on that before giving up on a location.
      const v = (vendorId && byId.get(vendorId)) || byName.get((name || "").trim().toLowerCase());
      return [v?.city, v?.state].filter(Boolean).join(", ") || "—";
    };
  }, [vendorRes]);

  // Newest receipt first. Sorting the receipts rather than the mapped cards
  // keeps the real timestamp — Purchase.date is already a display string, and
  // the GRN code sorts by vendor sequence, not by when the goods arrived.
  const ALL_PURCHASES: PurchaseRow[] = useMemo(
    () => [...(grnRes?.items ?? [])]
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
      .flatMap(g => receiptRows(g, cityOf)),
    [grnRes, cityOf],
  );

  // Everything except the material tabs, so the tab counts below can be taken
  // from this set: a tab then promises exactly what clicking it will show,
  // rather than a total the date range or the search has already ruled out.
  const matchesExceptType = (p: PurchaseRow) => {
    const q = search.trim().toLowerCase();
    const matchSearch = q === "" ||
      p.vendor.toLowerCase().includes(q) ||
      p.po.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q) ||
      p.grn.toLowerCase().includes(q) ||
      p.firmName.toLowerCase().includes(q);
    return matchSearch && matchesDateFilter(p.receivedIso, dateFilter);
  };

  const baseRows = ALL_PURCHASES.filter(matchesExceptType);
  const filtered = baseRows.filter(p => typeFilter === "all" || p.type === typeFilter);

  const pag = usePagination(filtered, 10);
  // Narrowing the list while on a later page would otherwise leave the user
  // on a page whose contents have nothing to do with what they just typed.
  // Only setPage is stable across renders, so `pag` itself can't be a dep.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { pag.setPage(1); }, [search, typeFilter, dateFilter]);

  const totalSpend = sumMoney(ALL_PURCHASES.map(p => p.totalPaid));

  const warpCount   = baseRows.filter(p => p.type === "Warp").length;
  const reshamCount = baseRows.filter(p => p.type === "Resham").length;
  const jariCount   = baseRows.filter(p => p.type === "Jari").length;

  // Hero totals, over the receipts themselves rather than the tab counts:
  // Warp and Resham are weighed in kg, Jari always in reels.
  const totals = useMemo(() => {
    let warpKg = 0, reshamKg = 0, jariReels = 0;
    const vendors = new Set<string>();
    const states = new Set<string>();
    (grnRes?.items ?? []).forEach(g => {
      vendors.add((g.supplierName || "").trim().toLowerCase() || g.id);
      const loc = cityOf(g.vendorId, g.supplierName);
      const state = loc.split(",").pop()?.trim();
      if (state && state !== "—") states.add(state);
      g.items.forEach(i => {
        const qty = Number(i.quantity) || 0;
        if (i.materialType === "WARP") warpKg += qty;
        else if (i.materialType === "RESHAM") reshamKg += qty;
        else if (i.materialType === "JARI") jariReels += jariToReels(qty, i.unit || "Reels");
      });
    });
    return { warpKg, reshamKg, jariReels, vendorCount: vendors.size, stateCount: states.size };
  }, [grnRes, cityOf]);

  const filtersActive = search.trim() !== "" || typeFilter !== "all" || dateFilter.mode !== "all";
  const clearFilters = () => { setSearch(""); setTypeFilter("all"); setDateFilter(DEFAULT_DATE_FILTER); };

  return (
    <div style={{ minHeight: "calc(100dvh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section className="px-4 md:px-7 xl:px-14" style={{ background: G.card, paddingTop: 48, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            iconLeft={ChevronLeft}
            className="mb-6 inline-flex bg-white/8 border border-white/15 text-[rgba(255,253,249,0.80)] hover:bg-white/12 shadow-none"
          >
            Back to Materials
          </Button>

          <div style={{ marginBottom: 14 }}>
            <Breadcrumbs
              items={[
                { key: "materials", label: "Materials", onClick: onBack },
                { key: "purchases", label: "Purchases", onClick: onBack },
                { key: "all-purchases", label: "All Purchases" },
              ]}
            />
          </div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 20, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Since 1999 · Purchase Records
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(30px, 3.5vw, 48px)", color: T.warmCream, margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            All Purchases{" "}
            <span style={{ fontStyle: "italic", color: T.antiqueGold }}>From All Vendors</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="max-w-[520px]"
            style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 20px", lineHeight: 1.7 }}>
            Complete purchase history for all raw materials — Warp, Resham, and Jari — from every vendor since the system started.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: `${ALL_PURCHASES.length} Total Purchases`, color: T.antiqueGold, bg: "rgba(200,155,71,0.15)", border: "rgba(200,155,71,0.30)" },
              { label: `${warpCount} Warp Orders`,   color: T.warmCream, bg: "rgba(110,15,45,0.18)",  border: "rgba(110,15,45,0.35)" },
              { label: `${reshamCount} Resham Orders`, color: T.warmCream, bg: "rgba(122,94,28,0.18)", border: "rgba(200,155,71,0.28)" },
              { label: `${jariCount} Jari Orders`,   color: T.warmCream, bg: "rgba(59,35,20,0.22)",  border: "rgba(59,35,20,0.35)" },
            ].map(p => (
              <span key={p.label} style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: p.color, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 999, padding: "6px 16px" }}>
                {p.label}
              </span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            style={{ display: "flex", gap: 0, marginTop: 36, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total Warp Purchased",   val: `${totals.warpKg.toLocaleString("en-IN")} kg`,   sub: `From ${totals.vendorCount} vendor${totals.vendorCount === 1 ? "" : "s"}`, Icon: Layers,      hi: false },
              { label: "Total Resham Purchased", val: `${totals.reshamKg.toLocaleString("en-IN")} kg`, sub: "All colors combined",    Icon: Tag,         hi: false },
              { label: "Total Jari Purchased",   val: formatBunsReels(totals.jariReels), sub: "All types and grades",   Icon: Sparkles,    hi: false },
              { label: "Total Amount Spent",     val: formatMoney(totalSpend, { compact: true }), sub: "All materials combined", Icon: IndianRupee, hi: true  },
              { label: "Active Vendors",         val: String(totals.vendorCount),   sub: `Across ${totals.stateCount} state${totals.stateCount === 1 ? "" : "s"}`, Icon: Building2,   hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "18px 18px", borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={18} color={m.hi ? T.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase", color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1, ...NUM }}>{m.val}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(245,232,208,0.55)", marginTop: 2 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER + SEARCH BAR ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, position: "relative", zIndex: 10, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60, minWidth: "max-content" }}>
          {([
            { key: "all",    label: "All Purchases",  count: baseRows.length },
            { key: "Warp",   label: "Warp",           count: warpCount },
            { key: "Resham", label: "Resham",         count: reshamCount },
            { key: "Jari",   label: "Jari",           count: jariCount },
          ] as const).map(f => (
            <Button
              key={f.key}
              onClick={() => setTypeFilter(f.key as "all" | MatType)}
              variant="ghost"
              size="md"
              className={`h-full rounded-none px-[18px] gap-[7px] border-b-2 ${typeFilter === f.key ? "border-[#6E0F2D]" : "border-transparent"}`}
            >
              <span style={{ fontFamily: F.ui, fontWeight: typeFilter === f.key ? 600 : 400, fontSize: 13, color: typeFilter === f.key ? T.royalBurgundy : T.taupe, whiteSpace: "nowrap" }}>{f.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: typeFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: typeFilter === f.key ? T.royalBurgundy : T.taupe }}>{f.count}</span>
            </Button>
          ))}

          <SearchInput
            aria-label="Search vendor, PO number, material"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor, PO number, material…"
            containerClassName="ml-auto w-[280px] h-[38px] bg-[var(--silkCream,#F7F2EA)]"
            className="text-[13px]"
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{filtered.length} purchase{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── DATE RANGE ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, position: "relative", zIndex: 9, paddingTop: 14, paddingBottom: 14 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      {/* ── CARDS GRID ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {isLoading ? (
          <LoadingState label="Loading purchase history…" />
        ) : isError ? (
          // A failed fetch and a genuinely empty history look identical
          // otherwise — say which it is instead of showing "No purchases".
          <ErrorState error={undefined} onRetry={() => void refetch()} />
        ) : filtered.length === 0 ? (
          filtersActive
            ? <FilteredEmptyState onClearFilters={clearFilters} />
            : <EmptyState
                title="No purchases recorded yet"
                description="Raw materials received against a purchase order — or entered as a direct purchase — will appear here."
              />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 22 }}>
              {pag.pageItems.map((p, i) => (
                <PurchaseCard key={p.id} p={p} index={i} onView={setViewPurchase} onPrint={setPrintPurchase} />
              ))}
            </div>
            <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
              onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="purchases" />
          </>
        )}
      </div>

      <ViewPurchaseModal purchase={viewPurchase} onClose={() => setViewPurchase(null)} />
      <PrintPurchaseModal purchase={printPurchase} onClose={() => setPrintPurchase(null)} />
    </div>
  );
}
