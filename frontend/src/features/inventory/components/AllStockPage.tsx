import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { Package } from "lucide-react";
import { StockCard, StockSaree, StockStatus, StockSource } from "./StockCard";
import { ViewStockDialog } from "./ViewStockDialog";
import { Pagination, usePagination } from "../../../shared/ui/DataPagination";
import { Button, SearchInput } from "../../../shared/ui/primitives";

const T = {
  silkCream:     "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
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

function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}>
      {children}
    </motion.div>
  );
}

const ALL_STOCK: StockSaree[] = [
  { id: "RAVI-L2-001",   source: "outsourced", weaver: "Ravi Kumar",   weaverCode: "WV-001", loom: 2, weight: "842g", qcDate: "08 Jun 2026", design: "BKB-045", sareeType: "HZ-003 · Heavy Zari",   status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "RK", avatarBg: "#5A3E6B" },
  { id: "PADMA-L1-001",  source: "outsourced", weaver: "Padma Veni",   weaverCode: "WV-002", loom: 1, weight: "786g", qcDate: "07 Jun 2026", design: "BKB-022", sareeType: "PS-002 · Plain Silk",   status: "sold",       saleRef: "SAL-2026-041", customer: "Mrs. Kamala Reddy", assignedBy: "shop",  assignedAt: "Today · 11:42 AM",    initials: "PV", avatarBg: T.royalBurgundy },
  { id: "BKB-L3-001",    source: "factory",    weaver: null,           weaverCode: null,     loom: 3, weight: "910g", qcDate: "09 Jun 2026", design: "BKB-038", sareeType: "SB-001 · Self Brocade", status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "BK", avatarBg: "#3D0E1A" },
  { id: "SURESH-L2-001", source: "outsourced", weaver: "Suresh Murti", weaverCode: "WV-003", loom: 2, weight: "798g", qcDate: "06 Jun 2026", design: "BKB-019", sareeType: "BS-004 · Bridal",       status: "sold",       saleRef: "SAL-2026-038", customer: "Mrs. Anita Sharma", assignedBy: "admin", assignedAt: "Today · 10:15 AM",    initials: "SM", avatarBg: "#2D6B6B" },
  { id: "BKB-L1-001",    source: "factory",    weaver: null,           weaverCode: null,     loom: 1, weight: "864g", qcDate: "05 Jun 2026", design: "BKB-031", sareeType: "HZ-003 · Heavy Zari",   status: "wholesale",  saleRef: "ORD-2026-041", customer: "Lakshmi Silks",     assignedBy: "admin", assignedAt: "Yesterday · 3:20 PM", initials: "BK", avatarBg: "#4A061B" },
  { id: "ANAND-L1-001",  source: "outsourced", weaver: "Anand K.",     weaverCode: "WV-005", loom: 1, weight: "752g", qcDate: "10 Jun 2026", design: "BKB-045", sareeType: "HZ-003 · Heavy Zari",   status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "AK", avatarBg: "#4A6B4A" },
  { id: "KAMALA-L2-001", source: "outsourced", weaver: "Kamala B.",    weaverCode: "WV-031", loom: 2, weight: "876g", qcDate: "04 Jun 2026", design: "BKB-045", sareeType: "HZ-003 · Heavy Zari",   status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "KB", avatarBg: "#7A2040" },
  { id: "MEENA-L1-001",  source: "outsourced", weaver: "Meena R.",     weaverCode: "WV-012", loom: 1, weight: "820g", qcDate: "03 Jun 2026", design: "BKB-038", sareeType: "SB-001 · Self Brocade", status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "MR", avatarBg: "#9B6B8A" },
  { id: "BKB-L2-002",    source: "factory",    weaver: null,           weaverCode: null,     loom: 2, weight: "934g", qcDate: "02 Jun 2026", design: "BKB-019", sareeType: "BS-004 · Bridal",       status: "wholesale",  saleRef: "ORD-2026-038", customer: "Padmavathi Textiles",assignedBy: "admin", assignedAt: "Yesterday · 1:10 PM", initials: "BK", avatarBg: "#3D0E1A" },

  { id: "RAVI-001-INV-RS-2026-118", source: "external", weaver: null, weaverCode: null, loom: 0, weight: "717g", qcDate: "01 Jun 2026", design: "BKB-022", sareeType: "Plain Silk",   status: "available", saleRef: null,           customer: null,                assignedBy: null,   assignedAt: null,               initials: "RS", avatarBg: "#6B4A2D", supplier: "Ravi Silks",              supplierLocation: "Dharmavaram, AP", purchaseId: "EXT-2026-0001", invoiceNumber: "INV-RS-2026-118" },
  { id: "MYSO-003-INV-MS-2026-552", source: "external", weaver: null, weaverCode: null, loom: 0, weight: "726g", qcDate: "05 Jun 2026", design: "BKB-038", sareeType: "Mysore Silk",  status: "available", saleRef: null,           customer: null,                assignedBy: null,   assignedAt: null,               initials: "MS", avatarBg: "#4A5A7B", supplier: "Mysore Sarees",           supplierLocation: "Mysore, KA",      purchaseId: "EXT-2026-0002", invoiceNumber: "INV-MS-2026-552" },
  { id: "MYSO-007-INV-MS-2026-552", source: "external", weaver: null, weaverCode: null, loom: 0, weight: "800g", qcDate: "05 Jun 2026", design: "BKB-045", sareeType: "Mysore Silk",  status: "sold",      saleRef: "SAL-2026-052", customer: "Mrs. Sujatha Rao",  assignedBy: "shop", assignedAt: "Today · 12:05 PM", initials: "MS", avatarBg: "#4A5A7B", supplier: "Mysore Sarees",           supplierLocation: "Mysore, KA",      purchaseId: "EXT-2026-0002", invoiceNumber: "INV-MS-2026-552" },
  { id: "CHEN-002-INV-CS-2026-073", source: "external", weaver: null, weaverCode: null, loom: 0, weight: "754g", qcDate: "08 Jun 2026", design: "BKB-019", sareeType: "Kanjivaram",   status: "available", saleRef: null,           customer: null,                assignedBy: null,   assignedAt: null,               initials: "CS", avatarBg: "#7B4A5A", supplier: "Chennai Silks",           supplierLocation: "Chennai, TN",     purchaseId: "EXT-2026-0003", invoiceNumber: "INV-CS-2026-073" },
  { id: "KANC-005-INV-KH-2026-209", source: "external", weaver: null, weaverCode: null, loom: 0, weight: "868g", qcDate: "10 Jun 2026", design: "BKB-052", sareeType: "Kanjivaram",   status: "wholesale", saleRef: "ORD-2026-044", customer: "Vijaya Silk House", assignedBy: "admin",assignedAt: "Yesterday · 4:40 PM", initials: "KH", avatarBg: "#3D6B5A", supplier: "Kanchipuram House",       supplierLocation: "Kanchipuram, TN", purchaseId: "EXT-2026-0004", invoiceNumber: "INV-KH-2026-209" },
  { id: "POCH-004-INV-PC-2026-301", source: "external", weaver: null, weaverCode: null, loom: 0, weight: "791g", qcDate: "11 Jun 2026", design: "BKB-031", sareeType: "Patola",       status: "available", saleRef: null,           customer: null,                assignedBy: null,   assignedAt: null,               initials: "PC", avatarBg: "#6B3D6B", supplier: "Pochampally Coop",        supplierLocation: "Pochampally, TG", purchaseId: "EXT-2026-0006", invoiceNumber: "INV-PC-2026-301" },
];

export function AllStockPage({ onBack }: { onBack?: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | StockSource>("all");
  const [viewSaree, setViewSaree] = useState<StockSaree | null>(null);

  const filtered = ALL_STOCK.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = search === "" || s.id.toLowerCase().includes(q) || (s.weaver || "").toLowerCase().includes(q) || s.design.toLowerCase().includes(q) || (s.supplier || "").toLowerCase().includes(q) || (s.invoiceNumber || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchSource = sourceFilter === "all" || s.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  const pag = usePagination(filtered, 25);

  const availableCount  = ALL_STOCK.filter(s => s.status === "available").length;
  const soldCount       = ALL_STOCK.filter(s => s.status === "sold").length;
  const wholesaleCount  = ALL_STOCK.filter(s => s.status === "wholesale").length;
  const externalCount   = ALL_STOCK.filter(s => s.source === "external").length;

  return (
    <div style={{ minHeight: "calc(100dvh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section style={{ background: G.card, padding: "52px 56px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(200,155,71,0.04) 0px, rgba(200,155,71,0.04) 1px, transparent 1px, transparent 60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(247,242,234,0.08), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              iconLeft="back"
              className="mb-6 -ml-3 text-[rgba(255,253,249,0.60)] hover:bg-white/10 hover:text-[rgba(255,253,249,0.85)]"
            >
              Back to Production
            </Button>
          )}

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>
                PRODUCTION · INVENTORY
              </div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 48, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
                Sarees In Stock
              </h1>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 560 }}>
                All sarees ready for sale or assignment to finishing staff — produced on our factory looms,
                woven by our weavers, or bought in from external suppliers.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingBottom: 36 }}>
            {[
              { label: "Total In Stock",    value: String(ALL_STOCK.length), gold: false, greenAccent: false },
              { label: "Available for Sale", value: String(availableCount),   gold: false, greenAccent: true  },
              { label: "Sold — Pending Finishing", value: String(soldCount), gold: true,  greenAccent: false },
              { label: "Assigned Wholesale", value: String(wholesaleCount),  gold: false, greenAccent: false },
              { label: "External Purchases", value: String(externalCount),  gold: true,  greenAccent: false },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, background: c.gold ? "rgba(200,155,71,0.20)" : c.greenAccent ? "rgba(30,102,64,0.18)" : "rgba(255,253,249,0.10)", border: `1px solid ${c.gold ? "rgba(200,155,71,0.40)" : c.greenAccent ? "rgba(30,102,64,0.35)" : "rgba(255,253,249,0.15)"}`, borderRadius: 99, padding: "9px 18px" }}>
                <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: c.gold ? T.antiqueGold : c.greenAccent ? "#6DCE9A" : "#FFFDF9" }}>{c.value}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: c.gold ? T.antiqueGold : c.greenAccent ? "rgba(109,206,154,0.85)" : "rgba(255,253,249,0.68)" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEARCH + FILTER BAR ── */}
      <section style={{ padding: "28px 56px 0" }}>
        <FadeUp>
          <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "18px 22px", boxShadow: "0 4px 20px rgba(74,6,27,0.07)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px" }}>
              <SearchInput
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by saree ID, weaver, supplier, invoice, or design code..."
                size="lg"
                containerClassName="w-full bg-[#F7F2EA]"
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "all",       label: "All Stock"       },
                { key: "available", label: "Available"       },
                { key: "sold",      label: "Sold"            },
                { key: "wholesale", label: "Wholesale"       },
              ].map(f => (
                <Button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key as "all" | StockStatus)}
                  size="sm"
                  className={`rounded-full font-semibold shadow-none ${
                    statusFilter === f.key
                      ? "bg-[#6E0F2D] text-[#FFFDF9] border-none hover:bg-[#6E0F2D]/90"
                      : "bg-transparent text-[#69635E] border border-[rgba(110,15,45,0.18)] hover:bg-transparent"
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Source</span>
              {[
                { key: "all",        label: "All Sources"   },
                { key: "factory",    label: "🏭 Factory"     },
                { key: "outsourced", label: "🪡 Weavers"     },
                { key: "external",   label: "🚚 External"    },
              ].map(f => (
                <Button
                  key={f.key}
                  onClick={() => setSourceFilter(f.key as "all" | StockSource)}
                  size="sm"
                  className={`rounded-full font-semibold shadow-none ${
                    sourceFilter === f.key
                      ? "bg-[#C89B47] text-[#3D0E1A] border-none hover:bg-[#C89B47]/90"
                      : "bg-transparent text-[#69635E] border border-[rgba(200,155,71,0.32)] hover:bg-transparent"
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
              <Package size={15} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{filtered.length} saree{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── CARDS GRID ── */}
      <section style={{ padding: "24px 56px 56px" }}>
        {filtered.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
              {pag.pageItems.map((s, i) => (
                <FadeUp key={s.id} delay={i * 0.05} style={{ height: "100%" }}>
                  <StockCard s={s} onView={setViewSaree} />
                </FadeUp>
              ))}
            </div>
            <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
              onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
          </>
        ) : (
          <FadeUp>
            <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "64px 32px", textAlign: "center" }}>
              <Package size={48} color={T.taupe} style={{ marginBottom: 16, opacity: 0.5 }} />
              <div style={{ fontFamily: F.display, fontSize: 20, color: T.taupe }}>No sarees match your search or filter.</div>
            </div>
          </FadeUp>
        )}
      </section>

      {/* ── DIALOG ── */}
      <AnimatePresence>
        {viewSaree && <ViewStockDialog saree={viewSaree} onClose={() => setViewSaree(null)} />}
      </AnimatePresence>
    </div>
  );
}
