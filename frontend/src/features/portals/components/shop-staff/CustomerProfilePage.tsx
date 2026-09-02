import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Search, ShoppingBag, Star, Users, IndianRupee, CalendarDays,
  Phone, MapPin, CreditCard, RotateCcw, Receipt, User as UserIcon, X, FileText,
} from "lucide-react";

import { C, F, PageHero, PortalStatsStrip, SectionCard, useCanSeePrices, type PortalStat } from "./theme";
import { Button, Input, IconButton } from "@/shared/ui/primitives";
import { Modal } from "@/shared/ui/overlay";
import { LoadingState, ErrorState, EmptyState } from "@/shared/ui/state";
import { DateFilterBar, matchesDateFilter, DEFAULT_DATE_FILTER, type DateFilterState } from "@/shared/ui/DateFilterBar";
import { Pagination, usePagination } from "@/shared/ui/DataPagination";
import { customersApi, type BackendCustomer } from "@/shared/api/customers";
import { salesApi, type BackendSaleRecord } from "@/shared/api/sales";
import { DocumentViewer, RetailBillDocument, DEFAULT_LETTERHEAD_FIRM } from "@/shared/ui/document";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toInitials } from "@/shared/lib/initials";
import { useResponsive } from "@/hooks/useResponsive";

/**
 * One customer's full record, as its own page rather than the cramped modal it
 * replaced. Every sale line carries the detail the counter actually needs —
 * bill ref, saree id, design, type, channel, who rang it up — while the money
 * and payment columns stay behind `useCanSeePrices`, so a real shop-staff login
 * sees the history without seeing a single rupee.
 */

type ChannelFilter = "all" | "RETAIL" | "WHOLESALE";

function money(v: number) { return formatMoney(rupees(v)); }

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function actorName(actor: BackendSaleRecord["soldBy"]) {
  if (!actor) return null;
  return [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() || null;
}

function paymentLabel(sale: BackendSaleRecord) {
  const method = (sale.paymentMethod ?? "").trim();
  if (!method) return "Counter";
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}

export function CustomerProfilePage({ customerId, onBack, onRecordSale }: {
  customerId: string;
  onBack: () => void;
  onRecordSale: (customerId: string) => void;
}) {
  const canSeePrices = useCanSeePrices();
  const { isMobile, isTablet } = useResponsive();
  const gutter = isMobile ? 20 : isTablet ? 28 : 48;

  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [billSale, setBillSale] = useState<BackendSaleRecord | null>(null);

  const customerQ = useQuery({
    queryKey: ["shop-customer-profile", customerId],
    queryFn: () => customersApi.findOne(customerId),
  });

  // Server-filtered to this customer, so the history is complete instead of
  // whatever happened to fall inside the global first page.
  const salesQ = useQuery({
    queryKey: ["shop-customer-sales", customerId],
    queryFn: () => salesApi.list(500, { customerId }),
  });

  const returnsQ = useQuery({
    queryKey: ["shop-customer-returns"],
    queryFn: () => salesApi.listReturns(500),
  });

  const customer = customerQ.data;
  const sales = useMemo(() => salesQ.data?.items ?? [], [salesQ.data]);

  // ReturnRecord has no customer of its own — a return belongs to this customer
  // when the piece coming back is one they bought.
  const returns = useMemo(() => {
    const mine = new Set(sales.map(s => s.sareeId));
    return (returnsQ.data?.items ?? []).filter(r => mine.has(r.sareeId));
  }, [returnsQ.data, sales]);

  const lifetimeSpend = useMemo(() => sales.reduce((sum, s) => sum + Number(s.amount), 0), [sales]);
  const refunded = useMemo(() => returns.reduce((sum, r) => sum + Number(r.refundAmount ?? 0), 0), [returns]);
  const lastVisit = useMemo(() => {
    if (sales.length === 0) return "—";
    const newest = sales.reduce((a, b) => (new Date(a.saleDate) > new Date(b.saleDate) ? a : b));
    return fullDate(newest.saleDate);
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales
      .filter(s => channel === "all" || s.channel === channel)
      .filter(s => matchesDateFilter(s.saleDate, dateFilter))
      .filter(s => !q || [s.saleRef, s.sareeId, s.saree?.designCode, s.saree?.sareeType?.type, actorName(s.soldBy)]
        .some(v => (v ?? "").toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales, channel, dateFilter, search]);

  const pag = usePagination(filtered, 10);
  const filteredValue = useMemo(() => filtered.reduce((sum, s) => sum + Number(s.amount), 0), [filtered]);

  const initials = customer ? toInitials(customer.name) : "";
  const isRegular = customer?.type === "WHOLESALE";

  const stats: PortalStat[] = [
    { label: "Total purchases", value: sales.length, sub: "sarees bought", icon: ShoppingBag, highlight: true },
    ...(canSeePrices
      ? [{ label: "Lifetime spend", value: money(lifetimeSpend), sub: "across all sales", icon: IndianRupee } as PortalStat]
      : []),
    { label: "Last visit", value: lastVisit, sub: "most recent sale", icon: CalendarDays },
    {
      label: "Returns", value: returns.length,
      sub: canSeePrices && refunded > 0 ? `${money(refunded)} refunded` : "pieces sent back",
      icon: RotateCcw, alert: returns.length > 0,
    },
  ];

  const isLoading = customerQ.isLoading || salesQ.isLoading;
  const isError = customerQ.isError || salesQ.isError;

  if (isError) {
    return (
      <div style={{ padding: gutter }}>
        <ErrorState error={undefined} onRetry={() => { void customerQ.refetch(); void salesQ.refetch(); }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: isMobile ? 110 : 0 }}>
      <PageHero
        eyebrow="Shop Staff Portal · Customer Record"
        title={customer?.name ?? "Customer"}
        titleAccent={isRegular ? "Wholesale" : "Retail"}
        description={
          customer
            ? `Complete purchase history for ${customer.name}. Filter by period or channel, search any bill or saree id, and page through every sale on record.`
            : "Loading this customer's record…"
        }
        actions={
          <Button
            onClick={onBack}
            className="h-11 gap-2 rounded-full border border-white/25 bg-white/10 px-5 font-semibold text-[#FFFDF9] hover:bg-white/20 hover:text-[#FFFDF9]"
          >
            <ArrowLeft size={16} /> Back to customers
          </Button>
        }
      />
      <PortalStatsStrip stats={stats} />

      <div style={{ padding: `${isMobile ? 24 : 40}px ${gutter}px ${isMobile ? 32 : 56}px`, display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Identity card ── */}
        <SectionCard icon={UserIcon} title="Customer Details" subtitle="Contact and account information on file">
          {isLoading || !customer ? (
            <LoadingState variant="skeleton" rows={2} />
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.burg, border: "3px solid rgba(200,155,71,0.45)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: "#FFF" }}>{initials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 220, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Field icon={UserIcon} label="Name" value={customer.name} />
                <Field icon={Phone} label="Phone" value={customer.phone ?? "—"} />
                <Field icon={MapPin} label="City" value={customer.city ?? "—"} />
                <Field icon={Receipt} label="Customer code" value={customer.code ?? "—"} />
                <Field icon={Users} label="Account type" value={customer.type === "WHOLESALE" ? "Wholesale" : "Retail"} />
                <Field icon={CalendarDays} label="Registered" value={fullDate(customer.createdAt)} />
                {canSeePrices && <Field icon={CreditCard} label="Payment terms" value={customer.paymentTerms ?? "—"} />}
                {canSeePrices && <Field icon={IndianRupee} label="GST" value={customer.gstCode ?? "—"} />}
              </div>
              {isRegular && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.40)", borderRadius: 999, padding: "5px 14px", alignSelf: "flex-start" }}>
                  <Star size={12} fill={C.gold} color={C.gold} />
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04" }}>Regular Customer</span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Purchase history ── */}
        <SectionCard
          icon={ShoppingBag}
          title="Purchase History"
          subtitle={
            canSeePrices
              ? `${filtered.length} of ${sales.length} sales · ${money(filteredValue)} in view`
              : `${filtered.length} of ${sales.length} sales in view`
          }
          actions={
            <Button
              onClick={() => onRecordSale(customerId)}
              className="h-11 gap-2 rounded-full border-none bg-white px-5 font-bold text-[#6E0F2D] hover:bg-white/90 hover:text-[#4A061B]"
            >
              <ShoppingBag size={16} /> Record New Sale
            </Button>
          }
        >
          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: "1 1 240px", minWidth: 200 }}>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bill ref, saree id, design…"
                iconLeft={Search}
                size="lg"
                containerClassName="h-11 rounded-xl"
                aria-label="Search this customer's purchases"
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {([["all", "All Sales"], ["RETAIL", "Retail"], ["WHOLESALE", "Wholesale"]] as const).map(([key, label]) => (
                <Button
                  key={key}
                  onClick={() => setChannel(key)}
                  size="sm"
                  className={
                    "shrink-0 rounded-full px-4 py-2 h-auto whitespace-nowrap border font-semibold " +
                    (channel === key
                      ? "border-[#6E0F2D] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9]"
                      : "border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[#6E0F2D]/10 text-[#69635E] hover:text-[#6E0F2D]")
                  }
                >{label}</Button>
              ))}
            </div>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>

          {isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : sales.length === 0 ? (
            <EmptyState title="No purchases yet" description="Sales rung up for this customer will appear here." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No sales match these filters"
              description="Try a different period, channel, or search term."
            />
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pag.pageItems.map(s => (
                  <SaleRow
                    key={s.saleRef}
                    sale={s}
                    canSeePrices={canSeePrices}
                    isMobile={isMobile}
                    onViewBill={s.channel === "RETAIL" ? () => setBillSale(s) : undefined}
                  />
                ))}
              </div>
              <Pagination
                page={pag.page}
                pageCount={pag.pageCount}
                total={pag.total}
                pageSize={pag.pageSize}
                start={pag.start}
                onPageChange={pag.setPage}
                onPageSizeChange={pag.setPageSize}
                itemLabel="sales"
              />
            </>
          )}
        </SectionCard>

        {/* ── Returns ── */}
        {returns.length > 0 && (
          <SectionCard icon={RotateCcw} title="Returns" subtitle={`${returns.length} piece${returns.length === 1 ? "" : "s"} sent back by this customer`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {returns.map(r => (
                <div key={r.returnRef} style={rowStyle}>
                  <div style={{ ...iconBox, background: "rgba(192,57,43,0.08)" }}>
                    <RotateCcw size={18} color="#C0392B" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 3 }}>{r.returnRef}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{r.sareeId}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {fullDate(r.returnDate)} · {r.reason ?? "No reason recorded"} · {r.restocked ? "Restocked" : "Held"}
                    </div>
                  </div>
                  {canSeePrices && r.refundAmount != null && (
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16, color: "#C0392B", flexShrink: 0 }}>
                      −{money(Number(r.refundAmount))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {billSale && customer && (
        <BillViewModal sale={billSale} customer={customer} onClose={() => setBillSale(null)} />
      )}
    </div>
  );
}

/**
 * The exact RetailBillDocument sent to the customer on WhatsApp — a single
 * saved sale carries everything it needs (saree, price, payment, who rang it
 * up), so re-printing it later from the customer's history looks identical
 * to what they walked out with.
 */
function BillViewModal({ sale, customer, onClose }: {
  sale: BackendSaleRecord;
  customer: BackendCustomer;
  onClose: () => void;
}) {
  const design = sale.saree?.designCode ?? undefined;
  const type = sale.saree?.sareeType?.type ?? sale.saree?.sareeTypeCode ?? undefined;

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0", flexShrink: 0 }}>
          <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} />
        </div>
        <DocumentViewer fileName={sale.saleRef} documentTitle={`Retail Bill ${sale.saleRef}`} className="flex-1">
          <RetailBillDocument
            billRef={sale.saleRef}
            billDate={fullDate(sale.saleDate)}
            firm={DEFAULT_LETTERHEAD_FIRM}
            customerName={customer.name}
            customerPhone={customer.phone ?? undefined}
            customerAddress={customer.address ?? undefined}
            lines={[{ sareeId: sale.sareeId, type, design, soldPrice: Number(sale.amount) }]}
            total={Number(sale.amount)}
            paymentMethod={sale.paymentMethod ?? undefined}
            paymentRef={sale.paymentRef ?? undefined}
            soldBy={actorName(sale.soldBy) ?? undefined}
          />
        </DocumentViewer>
      </div>
    </Modal>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
  border: "1px solid rgba(110,15,45,0.10)", borderRadius: 14, background: "#FFFDFB",
};

const iconBox: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.07)",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

function Field({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Icon size={13} color={C.muted} />
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: C.muted }}>{label}</span>
      </div>
      <div style={{ fontFamily: F.u, fontSize: 15, color: C.text, fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function SaleRow({ sale, canSeePrices, isMobile, onViewBill }: {
  sale: BackendSaleRecord; canSeePrices: boolean; isMobile: boolean; onViewBill?: () => void;
}) {
  const design = sale.saree?.designCode ?? "—";
  const type = sale.saree?.sareeType?.type ?? sale.saree?.sareeTypeCode ?? "—";
  return (
    <div style={{ ...rowStyle, alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, width: isMobile ? "100%" : undefined }}>
        <div style={iconBox}><ShoppingBag size={18} color={C.burg} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{sale.saleRef}</span>
            <span style={{
              fontFamily: F.u, fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "1px 9px",
              background: sale.channel === "WHOLESALE" ? "rgba(15,118,110,0.10)" : "rgba(110,15,45,0.08)",
              color: sale.channel === "WHOLESALE" ? "#0F766E" : C.burg,
            }}>{sale.channel === "WHOLESALE" ? "Wholesale" : "Retail"}</span>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, fontWeight: 600 }}>
            {sale.sareeId}{design !== "—" ? ` · ${design}` : ""}
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
            <span>{fullDate(sale.saleDate)}</span>
            <span>Type: {type}</span>
            {actorName(sale.soldBy) && <span>Sold by: {actorName(sale.soldBy)}</span>}
            {canSeePrices && (
              <span>
                {paymentLabel(sale)}
                {sale.paymentRef ? ` · ${sale.paymentRef}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
        marginTop: isMobile ? 10 : 0, alignSelf: isMobile ? "flex-end" : "center",
      }}>
        {onViewBill && (
          <Button
            onClick={onViewBill}
            size="sm"
            className="h-9 gap-1.5 rounded-full border border-[rgba(110,15,45,0.18)] bg-transparent px-3.5 font-semibold text-[#6E0F2D] hover:bg-[#6E0F2D]/10"
          >
            <FileText size={14} /> View Bill
          </Button>
        )}
        {canSeePrices && (
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>
            {money(Number(sale.amount))}
          </div>
        )}
      </div>
    </div>
  );
}
