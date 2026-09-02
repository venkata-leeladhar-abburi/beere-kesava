import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, UserRound, ShoppingBag, MapPin, CreditCard, FileText, X } from "lucide-react";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { RetailCustomer } from "../types";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { salesApi, type BackendSaleRecord } from "../../../../shared/api/sales";
import { useRatesPricing } from "@/features/pricing";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { SectionCard } from "@/shared/ui/SectionCard";
import { Modal } from "@/shared/ui/overlay";
import { DocumentViewer, RetailBillDocument, DEFAULT_LETTERHEAD_FIRM } from "@/shared/ui/document";

interface RetailPurchaseRow {
  saleRef: string;
  date: string;
  items: { id: string; type: string }[];
  price: number;
  returned: boolean;
  refundAmount: number;
  sale: BackendSaleRecord;
}

export interface RetailDetailSectionProps {
  customer: RetailCustomer;
  retailModalTab: "history" | "profile";
  setRetailModalTab: (t: "history" | "profile") => void;
  onBack: () => void;
  retailPurchaseDateFilter: DateFilterState;
  setRetailPurchaseDateFilter: (f: DateFilterState) => void;
}

// ── Retail customer detail (Purchase History / Profile) ─────────────────────
export function RetailDetailSection({
  customer, retailModalTab, setRetailModalTab, onBack, retailPurchaseDateFilter, setRetailPurchaseDateFilter,
}: RetailDetailSectionProps) {
  const [billSale, setBillSale] = useState<BackendSaleRecord | null>(null);

  const purchaseColumns: ColumnDef<RetailPurchaseRow>[] = [
    {
      id: "date", header: "Sale Date", accessor: r => r.date,
      cell: (_v, r) => (
        <div>
          <div style={{ color: T.taupe }}>{r.date}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.royalBurgundy, marginTop: 2 }}>{r.saleRef}</div>
        </div>
      ),
    },
    {
      id: "items", header: "Sarees (ID & Type)", accessor: r => r.items, priority: 1,
      cell: (_v, r) => (
        <>
          {r.items.map((item) => (
            <div key={item.id} style={{ marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{item.id}</span>
              <span style={{ color: T.luxuryBrown, fontSize: 12 }}>{item.type}</span>
            </div>
          ))}
        </>
      ),
    },
    {
      id: "price", header: "Price Paid", accessor: r => r.price,
      cell: (_v, r) => <span style={{ color: T.antiqueGold, fontWeight: 600 }}><Money value={rupees(r.price)} /></span>,
    },
    {
      id: "return", header: "Return", accessor: r => r.returned, priority: 3,
      cell: (_v, r) => r.returned
        ? <span style={{ color: T.crimson, fontWeight: 600 }}>Returned{r.refundAmount > 0 ? ` (−${formatMoney(rupees(r.refundAmount))})` : ""}</span>
        : <span style={{ color: T.taupe }}>—</span>,
    },
    {
      id: "bill", header: "Bill", accessor: r => r.saleRef, priority: 3,
      cell: (_v, r) => (
        <Button
          onClick={() => setBillSale(r.sale)}
          size="sm"
          className="h-8 gap-1.5 rounded-full border border-[rgba(110,15,45,0.18)] bg-transparent px-3 font-semibold text-[#6E0F2D] hover:bg-[#6E0F2D]/10"
        >
          <FileText size={13} /> View Bill
        </Button>
      ),
    },
  ];

  const { getSareeTypeByCode } = useRatesPricing();

  // Server-filtered to this customer (same approach as the shop-staff portal's
  // customer profile page), so the history is complete instead of whatever
  // happened to fall inside the global first page.
  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-retail-detail", customer.id],
    queryFn: () => salesApi.list(500, { customerId: customer.id }),
  });
  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-retail-detail"],
    queryFn: () => salesApi.listReturns(500),
  });

  // ReturnRecord has no saleRef FK — a saree only has one active sale at a
  // time, so sareeId is the closest usable link back to "was this returned".
  const refundBySareeId = useMemo(
    () => new Map((returnsRes?.items ?? []).map(r => [r.sareeId, Number(r.refundAmount ?? 0)])),
    [returnsRes],
  );

  const customerSales = useMemo(
    () => (salesRes?.items ?? []).filter(s => s.channel === "RETAIL"),
    [salesRes],
  );

  const retailPurchaseRows: RetailPurchaseRow[] = useMemo(() => customerSales
    .map(s => {
      const typeCode = s.saree?.sareeTypeCode;
      const typeLabel = typeCode ? (getSareeTypeByCode(typeCode)?.type ?? typeCode) : (s.saree?.designCode ?? "—");
      return {
        saleRef: s.saleRef,
        date: new Date(s.saleDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        items: [{ id: s.sareeId, type: typeLabel }],
        price: Number(s.amount),
        returned: refundBySareeId.has(s.sareeId),
        refundAmount: refundBySareeId.get(s.sareeId) ?? 0,
        sale: s,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(row => matchesDateFilter(row.date, retailPurchaseDateFilter)),
  [customerSales, refundBySareeId, getSareeTypeByCode, retailPurchaseDateFilter]);

  const totalPurchases = retailPurchaseRows.length;
  // "Total Spent" nets out refunds on returned sales, matching what the
  // customer actually paid rather than the gross amount rung up.
  const totalSpent = retailPurchaseRows.reduce((sum, r) => sum + (r.price - r.refundAmount), 0);
  const avgPerVisit = totalPurchases > 0 ? Math.round(totalSpent / totalPurchases) : 0;
  const totalReturns = retailPurchaseRows.filter(r => r.returned).length;

  return (
    <div className="px-3 sm:px-7 xl:px-14 py-4 sm:py-8" style={{ background: T.silkCream, minHeight: "100dvh" }}>
      <div className="hidden sm:block mb-4">
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "customers", label: "Customers", onClick: onBack },
            { key: "customer", label: customer.name },
          ]}
        />
      </div>

      {/* Header row with Back button */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <Button
          onClick={onBack}
          variant="secondary"
          className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer"
        >
          <ChevronLeft size={16} /> Back to Customers
        </Button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider">
            <UserRound size={14} className="text-[#6E0F2D]" />
            <span>Retail Customer</span>
          </div>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="mb-6">
        <div className="relative bg-[#0D0207] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.25)]">
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${BG_IMAGE})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.24, pointerEvents: "none"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(74,6,27,0.92) 0%, rgba(13,2,7,0.95) 100%)", pointerEvents: "none" }} />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row gap-5 lg:gap-7 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
              <div className="relative shrink-0">
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 700, border: "2px solid rgba(200,155,71,0.45)" }}>
                  {customer.initials}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    RETAIL CUSTOMER
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                  {customer.name}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-white/70">
                  <MapPin size={15} color={T.antiqueGold} /> {customer.city || "Walk-in Store Customer"}
                </div>
              </div>
            </div>

            {/* Luxury Metrics Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <ShoppingBag size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Purchases</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 truncate">{totalPurchases} Visits</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <CreditCard size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Spent</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5 truncate">
                    {formatMoney(rupees(totalSpent))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab strip */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 mb-6 border-b-2 border-[var(--border-default)]">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { key: "history" as const, label: "Purchase History", icon: <ShoppingBag size={18} /> },
            { key: "profile" as const, label: "Profile Details", icon: <UserRound size={18} /> },
          ].map(t => {
            const isActive = retailModalTab === t.key;
            return (
              <Button
                key={t.key}
                variant="tertiary"
                onClick={() => setRetailModalTab(t.key)}
                className={
                  "rounded-none px-4 sm:px-6 py-3 mb-[-6px] shrink-0 text-sm sm:text-base cursor-pointer flex items-center gap-2.5 transition-all " +
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

      {retailModalTab === "history" ? (
        <SectionCard
          icon={ShoppingBag}
          title="Store Purchase History"
          subtitle={`All retail saree purchases and visit transactions for ${customer.name}`}
        >
          {/* 4-stat summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-6 bg-[#FFFDF9] rounded-2xl p-4 sm:p-5 border border-[#E8DCC4]">
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Purchases</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{totalPurchases}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Spent</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{formatMoney(rupees(totalSpent))}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Avg per Visit</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.taupe, marginTop: 4 }}>
                {formatMoney(rupees(avgPerVisit))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Total Returns</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.crimson, marginTop: 4 }}>{totalReturns}</div>
            </div>
          </div>

          <div className="mb-4">
            <DateFilterBar filter={retailPurchaseDateFilter} onChange={setRetailPurchaseDateFilter} />
          </div>
          <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", fontFamily: F.ui, fontSize: 13 }}>
            <DataTable
              responsive
              columns={purchaseColumns}
              data={retailPurchaseRows}
              getRowId={r => r.saleRef}
              emptyTitle="No purchases in this period"
            />
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          icon={UserRound}
          title="Customer Profile & Contact Details"
          subtitle={`Personal contact information and relationship notes for ${customer.name}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ background: T.warmIvory, padding: 20, borderRadius: 14, border: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Phone Number</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{customer.phone && customer.phone !== "—" ? `+91 ${customer.phone}` : "—"}</div>
              </div>
              <div style={{ background: T.warmIvory, padding: 20, borderRadius: 14, border: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>City / Location</div>
                <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{customer.city || "—"}</div>
              </div>
            </div>
            <div style={{ background: T.warmIvory, padding: 20, borderRadius: 14, border: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                <span>Relationship Manager Notes</span>
                <Button variant="link" size="sm">Save</Button>
              </div>
              <textarea
                aria-label="Relationship Manager Notes"
                placeholder="Add notes about this customer's preferences..."
                style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#FFF", resize: "vertical", outline: "none" }}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {billSale && (
        <Modal open onOpenChange={o => !o && setBillSale(null)} size="xl">
          <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0", flexShrink: 0 }}>
              <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={() => setBillSale(null)} />
            </div>
            <DocumentViewer fileName={billSale.saleRef} documentTitle={`Retail Bill ${billSale.saleRef}`} className="flex-1">
              <RetailBillDocument
                billRef={billSale.saleRef}
                billDate={new Date(billSale.saleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                firm={DEFAULT_LETTERHEAD_FIRM}
                customerName={customer.name}
                customerPhone={customer.phone && customer.phone !== "—" ? customer.phone : undefined}
                lines={[{
                  sareeId: billSale.sareeId,
                  type: billSale.saree?.sareeType?.type ?? billSale.saree?.sareeTypeCode ?? undefined,
                  design: billSale.saree?.designCode ?? undefined,
                  soldPrice: Number(billSale.amount),
                }]}
                total={Number(billSale.amount)}
                paymentMethod={billSale.paymentMethod ?? undefined}
                paymentRef={billSale.paymentRef ?? undefined}
                soldBy={[billSale.soldBy?.firstName, billSale.soldBy?.lastName].filter(Boolean).join(" ").trim() || undefined}
              />
            </DocumentViewer>
          </div>
        </Modal>
      )}
    </div>
  );
}
