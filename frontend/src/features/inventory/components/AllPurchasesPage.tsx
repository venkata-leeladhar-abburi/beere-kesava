import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Layers, Tag, Sparkles, ChevronLeft, IndianRupee, ShoppingBag, Building2,
} from "lucide-react";
import { ViewPurchaseModal, PrintPurchaseModal, Purchase, MatType } from "./PurchaseModals";
import { PurchaseCard } from "./PurchaseCard";
import { Pagination, usePagination } from "../../../shared/ui/DataPagination";
import { Button, SearchInput } from "../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";

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

const ALL_PURCHASES: Purchase[] = [
  { id: "PUR-001", po: "PO-SVT-2026-042", date: "01 May 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "50 kg",  totalPaid: "₹14,000",  status: "complete", grn: "GRN-WRP-SVT-20260501-001" },
  { id: "PUR-002", po: "PO-KNC-2026-118", date: "02 May 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", material: "Red + Blue",            type: "Resham", quantity: "58 kg",  totalPaid: "₹87,000",  status: "complete", grn: "GRN-RSM-KNC-20260430-001" },
  { id: "PUR-003", po: "PO-SZW-2026-033", date: "01 May 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", material: "Polyester 2G Gold",     type: "Jari",   quantity: "5 Buns", totalPaid: "₹64,000",  status: "complete", grn: "GRN-JRI-SZW-20260428-001" },
  { id: "PUR-004", po: "PO-MSC-2026-056", date: "28 Apr 2026", vendor: "Mysore Silk Co.",           vendorCity: "Mysore, KA",      firmName: "Beere Kesava & Brothers Silks", material: "Gold",                  type: "Resham", quantity: "25 kg",  totalPaid: "₹37,000",  status: "complete", grn: "GRN-RSM-MSC-20260426-001" },
  { id: "PUR-005", po: "PO-LTH-2026-029", date: "28 Apr 2026", vendor: "Lakshmi Thread House",      vendorCity: "Chennai, TN",     firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "40 kg",  totalPaid: "₹11,000",  status: "complete", grn: "GRN-WRP-LTH-20260428-001" },
  { id: "PUR-006", po: "PO-VZH-2026-021", date: "28 Apr 2026", vendor: "Varanasi Zari House",       vendorCity: "Varanasi, UP",    firmName: "Beere Kesava & Brothers Silks", material: "Silk Fast 2G Gold",     type: "Jari",   quantity: "2 Buns", totalPaid: "₹27,360",  status: "complete", grn: "GRN-JRI-VZH-20260428-001" },
  { id: "PUR-007", po: "PO-KNC-2026-109", date: "15 Apr 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", material: "Blue",                  type: "Resham", quantity: "28 kg",  totalPaid: "₹42,000",  status: "complete", grn: "GRN-RSM-KNC-20260415-001" },
  { id: "PUR-008", po: "PO-SVT-2026-038", date: "20 Apr 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "35 kg",  totalPaid: "₹9,800",   status: "complete", grn: "GRN-WRP-SVT-20260420-001" },
  { id: "PUR-009", po: "PO-SZW-2026-028", date: "20 Apr 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", material: "Polyester 3G Copper",   type: "Jari",   quantity: "1 Bun",  totalPaid: "₹12,800",  status: "complete", grn: "GRN-JRI-SZW-20260420-001" },
  { id: "PUR-010", po: "PO-VZH-2026-018", date: "20 Apr 2026", vendor: "Varanasi Zari House",       vendorCity: "Varanasi, UP",    firmName: "Beere Kesava & Brothers Silks", material: "Silk Fast 1G Blue",     type: "Jari",   quantity: "1 Bun",  totalPaid: "₹9,120",   status: "complete", grn: "GRN-JRI-VZH-20260420-001" },
  { id: "PUR-011", po: "PO-MSC-2026-048", date: "10 Apr 2026", vendor: "Mysore Silk Co.",           vendorCity: "Mysore, KA",      firmName: "Beere Kesava & Brothers Silks", material: "Gold + Red",            type: "Resham", quantity: "30 kg",  totalPaid: "₹44,400",  status: "complete", grn: "GRN-RSM-MSC-20260410-001" },
  { id: "PUR-012", po: "PO-LTH-2026-022", date: "05 Apr 2026", vendor: "Lakshmi Thread House",      vendorCity: "Chennai, TN",     firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "45 kg",  totalPaid: "₹12,375",  status: "complete", grn: "GRN-WRP-LTH-20260405-001" },
  { id: "PUR-013", po: "PO-KNC-2026-101", date: "01 Apr 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", material: "Green",                 type: "Resham", quantity: "22 kg",  totalPaid: "₹33,000",  status: "complete", grn: "GRN-RSM-KNC-20260401-001" },
  { id: "PUR-014", po: "PO-SZW-2026-019", date: "28 Mar 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", material: "Polyester 1G Silver",   type: "Jari",   quantity: "1 Bun",  totalPaid: "₹9,600",   status: "complete", grn: "GRN-JRI-SZW-20260328-001" },
  { id: "PUR-015", po: "PO-SVT-2026-031", date: "20 Mar 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "60 kg",  totalPaid: "₹16,800",  status: "complete", grn: "GRN-WRP-SVT-20260320-001" },
  { id: "PUR-016", po: "PO-VZH-2026-014", date: "15 Mar 2026", vendor: "Varanasi Zari House",       vendorCity: "Varanasi, UP",    firmName: "Beere Kesava & Brothers Silks", material: "Silk Fast 3G Pink",     type: "Jari",   quantity: "1 Bun",  totalPaid: "₹13,680",  status: "pending", grn: "GRN-JRI-VZH-20260315-001", notes: "Partial shipment, remaining stock expected by 25 Mar" },
];

export function AllPurchasesPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MatType>("all");
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [printPurchase, setPrintPurchase] = useState<Purchase | null>(null);

  const filtered = ALL_PURCHASES.filter(p => {
    const matchType   = typeFilter === "all" || p.type === typeFilter;
    const matchSearch = search === "" ||
      p.vendor.toLowerCase().includes(search.toLowerCase()) ||
      p.po.toLowerCase().includes(search.toLowerCase()) ||
      p.material.toLowerCase().includes(search.toLowerCase()) ||
      p.grn.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const pag = usePagination(filtered, 25);

  const totalSpend = ALL_PURCHASES.reduce((sum, p) => {
    const num = parseInt(p.totalPaid.replace(/[₹,]/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const warpCount   = ALL_PURCHASES.filter(p => p.type === "Warp").length;
  const reshamCount = ALL_PURCHASES.filter(p => p.type === "Resham").length;
  const jariCount   = ALL_PURCHASES.filter(p => p.type === "Jari").length;

  return (
    <div style={{ minHeight: "calc(100dvh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section style={{ background: G.card, padding: "48px 56px 0", position: "relative", overflow: "hidden" }}>
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
            <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Since 1999 · Purchase Records
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(30px, 3.5vw, 48px)", color: T.warmCream, margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            All Purchases{" "}
            <span style={{ fontStyle: "italic", color: T.antiqueGold }}>From All Vendors</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 20px", maxWidth: 520, lineHeight: 1.7 }}>
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
              { label: "Total Warp Purchased",   val: "2,840 kg",                   sub: "From 2 vendors",         Icon: Layers,      hi: false },
              { label: "Total Resham Purchased", val: "1,240 kg",                   sub: "All colors combined",    Icon: Tag,         hi: false },
              { label: "Total Jari Purchased",   val: "680 kg",                     sub: "All types and grades",   Icon: Sparkles,    hi: false },
              { label: "Total Amount Spent",     val: formatMoney(rupees(totalSpend), { compact: true }), sub: "All materials combined", Icon: IndianRupee, hi: true  },
              { label: "Active Vendors",         val: "6",                          sub: "Across 3 states",        Icon: Building2,   hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "18px 18px", borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={18} color={m.hi ? T.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase", color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1, ...NUM }}>{m.val}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(245,232,208,0.55)", marginTop: 2 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER + SEARCH BAR ── */}
      <div style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, padding: "0 56px", position: "sticky", top: 90, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60 }}>
          {([
            { key: "all",    label: "All Purchases",  count: ALL_PURCHASES.length },
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
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: typeFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: typeFilter === f.key ? T.royalBurgundy : T.taupe }}>{f.count}</span>
            </Button>
          ))}

          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor, PO number, material…"
            containerClassName="ml-auto w-[280px] h-[38px] bg-[var(--silkCream,#F7F2EA)]"
            className="text-[13px]"
          />
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{filtered.length} purchase{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      <div style={{ padding: "40px 56px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShoppingBag size={28} color={T.taupe} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 8 }}>No purchases found</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Try adjusting your search or filter.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
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
