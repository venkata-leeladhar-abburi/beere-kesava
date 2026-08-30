import React from "react";
import { MapPin, ChevronLeft, UserRound, Boxes, ShoppingBag, CreditCard, Edit3, TrendingUp } from "lucide-react";
import { useBulkOrders, BulkOrder } from "@/features/bulk-orders";
import { DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { resolveOrderMoney } from "@/features/bulk-orders";
import { INVOICES } from "@/features/payments";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { OrderHistoryTab } from "./OrderHistoryTab";
import { OverviewTab } from "./OverviewTab";
import { PaymentHistoryTab } from "./PaymentHistoryTab";
import { ContactDetailsTab } from "./ContactDetailsTab";
import { EditProfileTab } from "./EditProfileTab";
import { Button } from "../../../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../../../shared/ui/nav/Breadcrumbs";
import { rupees, formatMoney } from "@/lib/domain/money";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { useScrollTopOnView } from "@/shared/ui/ScrollToTop";
import { SectionCard } from "@/shared/ui/SectionCard";

export interface WholesaleDetailSectionProps {
  customer: WholesaleCustomer;
  wholesaleTab: WholesaleTab;
  setWholesaleTab: (t: WholesaleTab) => void;
  onBack: () => void;
  onSave: (updated: WholesaleCustomer) => void;
  onViewBulkOrder: (order: BulkOrder, tab: "overview" | "sarees" | "payments" | "quotations") => void;
  onViewCard: (url: string) => void;
  wholesaleOrderDateFilter: DateFilterState;
  setWholesaleOrderDateFilter: (f: DateFilterState) => void;
  wholesalePaymentDateFilter: DateFilterState;
  setWholesalePaymentDateFilter: (f: DateFilterState) => void;
}

export function WholesaleDetailSection({
  customer, wholesaleTab, setWholesaleTab, onBack, onSave, onViewBulkOrder, onViewCard,
  wholesaleOrderDateFilter, setWholesaleOrderDateFilter, wholesalePaymentDateFilter, setWholesalePaymentDateFilter,
}: WholesaleDetailSectionProps) {
  const { bulkOrders } = useBulkOrders();

  useScrollTopOnView(customer.id);

  // ── Bulk orders belonging to the open wholesale customer ───────────────────
  // Matched on customerId where the order carries one, else on business name.
  const custOrders = React.useMemo(() => {
    return bulkOrders.filter(o =>
      (o.customerId && o.customerId === customer.id) ||
      o.customer.toLowerCase() === String(customer.name).toLowerCase()
    );
  }, [bulkOrders, customer]);

  const custOrderMoney = React.useMemo(
    () => new Map(custOrders.map(o => [o.ref, resolveOrderMoney(o, INVOICES)])),
    [custOrders]
  );
  const custBilled = custOrders.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountDue ?? 0), 0);
  const custPaid = custOrders.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountPaid ?? 0), 0);
  const custOutstanding = Math.max(0, custBilled - custPaid);
  const custSareesOrdered = custOrders.reduce((a, o) => a + o.total, 0);
  const custSareesDone = custOrders.reduce((a, o) => a + o.done, 0);
  const custActiveOrders = custOrders.filter(o => o.done < o.total);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={16} /> Back to Customers
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <UserRound size={14} className="text-[#6E0F2D]" />
            <span>Customer Profile</span>
          </div>

          <span className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-wider whitespace-nowrap shrink-0 ${customer.status === "clear" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {customer.status}
          </span>

          <span className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap shrink-0">
            {customer.displayCode || customer.id}
          </span>
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
                  {customer.code}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    WHOLESALE CUSTOMER
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                  {customer.name}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-white/70">
                  <MapPin size={15} color={T.antiqueGold} /> {customer.city}
                </div>
              </div>
            </div>

            {/* Luxury Metrics Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <CreditCard size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Spend</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 truncate">{formatMoney(rupees(Number(customer.spend) || 0))}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <TrendingUp size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Outstanding</div>
                  <div className={`text-sm sm:text-base font-bold mt-0.5 truncate ${customer.out === "0" ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatMoney(rupees(Number(customer.out) || 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab strip */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 mb-6 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between w-full min-w-max md:min-w-0 gap-1 sm:gap-2">
          {[
            { key: "Overview" as const, label: "Overview", icon: <Boxes size={18} /> },
            { key: "Order History" as const, label: "Order History", icon: <ShoppingBag size={18} /> },
            { key: "Payment History" as const, label: "Payment History", icon: <CreditCard size={18} /> },
            { key: "Contact Details" as const, label: "Contact Details", icon: <UserRound size={18} /> },
            { key: "Edit Profile" as const, label: "Edit Profile", icon: <Edit3 size={18} /> },
          ].map(t => {
            const isActive = wholesaleTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setWholesaleTab(t.key)}
                className={
                  "flex-1 justify-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-all duration-200 font-bold " +
                  (isActive
                    ? "bg-[#6E0F2D] text-[#FFFDF9] shadow-md shadow-[#6E0F2D]/20 scale-[1.01]"
                    : "bg-transparent text-[#7A6859] hover:text-[#6E0F2D]")
                }
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content inside SectionCard */}
      {wholesaleTab === "Overview" && (
        <SectionCard
          icon={Boxes}
          title="Customer Account Overview"
          subtitle={`Key metrics, saree orders, and live production status for ${customer.name}`}
        >
          <OverviewTab
            customer={customer}
            custOrders={custOrders}
            custOrderMoney={custOrderMoney}
            custOutstanding={custOutstanding}
            custSareesOrdered={custSareesOrdered}
            custSareesDone={custSareesDone}
            custActiveOrders={custActiveOrders}
            setWholesaleTab={setWholesaleTab}
            onViewBulkOrder={onViewBulkOrder}
          />
        </SectionCard>
      )}

      {wholesaleTab === "Order History" && (
        <SectionCard
          icon={ShoppingBag}
          title="Customer Orders History"
          subtitle={`Full breakdown of all wholesale saree orders placed by ${customer.name}`}
        >
          <OrderHistoryTab
            custOrders={custOrders}
            custOrderMoney={custOrderMoney}
            wholesaleOrderDateFilter={wholesaleOrderDateFilter}
            setWholesaleOrderDateFilter={setWholesaleOrderDateFilter}
            onViewBulkOrder={onViewBulkOrder}
          />
        </SectionCard>
      )}

      {wholesaleTab === "Payment History" && (
        <SectionCard
          icon={CreditCard}
          title="Customer Payments & Receipts"
          subtitle={`Financial transaction history and balance clearance records for ${customer.name}`}
        >
          <PaymentHistoryTab
            customerId={customer.id}
            wholesalePaymentDateFilter={wholesalePaymentDateFilter}
            setWholesalePaymentDateFilter={setWholesalePaymentDateFilter}
          />
        </SectionCard>
      )}

      {wholesaleTab === "Contact Details" && (
        <SectionCard
          icon={UserRound}
          title="Customer Contact & Business Details"
          subtitle={`Location, GST, phone numbers, and visiting cards for ${customer.name}`}
        >
          <ContactDetailsTab customer={customer} onViewCard={onViewCard} />
        </SectionCard>
      )}

      {wholesaleTab === "Edit Profile" && (
        <SectionCard
          icon={Edit3}
          title="Edit Customer Profile Details"
          subtitle={`Update business name, phone, address, and payment terms for ${customer.name}`}
        >
          <EditProfileTab customer={customer} setWholesaleTab={setWholesaleTab} onSave={onSave} />
        </SectionCard>
      )}
    </div>
  );
}
