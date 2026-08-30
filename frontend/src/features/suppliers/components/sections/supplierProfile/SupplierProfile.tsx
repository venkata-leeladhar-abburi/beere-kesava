// Full supplier profile page (Overview / Order History / Payment History /
// Contact Details / Edit Profile tabs). Split into one file per tab under
// this supplierProfile/ subfolder, composed here.

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Package, Send, Trash2, Wallet, ChevronLeft, UserRound, Boxes, ShoppingBag, CreditCard, UserCheck, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { useScrollTopOnView } from "@/shared/ui/ScrollToTop";
import { SectionCard } from "@/shared/ui/SectionCard";
import { RoyalSubTabStrip } from "@/shared/ui/RoyalSubTabStrip";
import { SupplierPayNowModal } from "@/features/payments";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import {
  useSuppliers, Supplier, parseINR,
} from "../../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { SupplierFormValues } from "../../types";
import { StarRating } from "../../common/primitives";
import { Button } from "../../../../../shared/ui/primitives";
import { Breadcrumbs } from "../../../../../shared/ui/nav/Breadcrumbs";
import { recordView, useConfirm } from "../../../../../shared/ui/overlay";
import { EntityCode } from "../../../../../shared/ui/domain";
import { OverviewTab } from "./OverviewTab";
import { OrdersTab } from "./OrdersTab";
import { PaymentsTab } from "./PaymentsTab";
import { ContactTab } from "./ContactTab";
import { EditTab } from "./EditTab";

export function SupplierProfile({ supplier, onBack, onRaiseRequest }: {
  supplier: Supplier;
  onBack: () => void;
  onRaiseRequest: (supplierId: string) => void;
}) {
  const { statsFor, purchases, payments, requests, updateSupplier, deleteSupplier, addPayment } = useSuppliers();
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
  const confirm = useConfirm();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Command palette RECENT group (design-system/05-OVERLAYS.md Part H) —
  // record this profile as viewed once per mount.
  useEffect(() => {
    recordView({ key: `supplier:${supplier.id}`, label: supplier.name, path: "/admin/suppliers", kind: "Supplier" });
  }, [supplier.id, supplier.name]);

  useScrollTopOnView(supplier.id);
  const tabs = [
    { key: "overview", label: "Overview", icon: <Boxes size={18} /> },
    { key: "orders",   label: "Order History", icon: <ShoppingBag size={18} /> },
    { key: "payments", label: "Payment History", icon: <CreditCard size={18} /> },
    { key: "contact",  label: "Contact Details", icon: <UserCheck size={18} /> },
    { key: "edit",     label: "Edit Profile", icon: <Edit3 size={18} /> },
  ] as const;

  // Independent date filters — the overview inventory and the order history each
  // carry their own time range so one doesn't disturb the other.
  const [invFilter, setInvFilter]     = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [orderFilter, setOrderFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payFilter, setPayFilter]     = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [typeFilter, setTypeFilter]       = useState("All Types");
  const [colorFilter, setColorFilter]     = useState("All Colours");
  const [purchaseFilter, setPurchaseFilter] = useState("All Purchases");
  const [sareeSearch, setSareeSearch] = useState("");

  const stats = statsFor(supplier.id);

  // Every saree ever bought from this supplier, flattened for the inventory view.
  const allSarees = useMemo(
    () => stats.purchases.flatMap(p => p.sarees.map(s => ({ ...s, purchaseId: p.id, invoiceNumber: p.invoiceNumber, supplier: p.supplier }))),
    [stats.purchases]
  );

  const sareeTypes  = useMemo(() => ["All Types", ...Array.from(new Set(allSarees.map(s => s.sareeType).filter(Boolean)))], [allSarees]);
  const sareeColors = useMemo(() => ["All Colours", ...Array.from(new Set(allSarees.map(s => s.color).filter(Boolean)))], [allSarees]);
  // Purchase orders this supplier's sarees came from, newest first, for the PO filter dropdown.
  const purchaseOptions = useMemo(
    () => [...stats.purchases].sort((a, b) => (b.date > a.date ? 1 : -1)),
    [stats.purchases]
  );

  const filteredSarees = useMemo(() => allSarees.filter(s => {
    const q = sareeSearch.toLowerCase();
    const mSearch = !q || s.id.toLowerCase().includes(q) || s.sareeType.toLowerCase().includes(q) || s.color.toLowerCase().includes(q);
    const mType     = typeFilter === "All Types" || s.sareeType === typeFilter;
    const mColor    = colorFilter === "All Colours" || s.color === colorFilter;
    const mPurchase = purchaseFilter === "All Purchases" || s.purchaseId === purchaseFilter;
    return mSearch && mType && mColor && mPurchase && matchesDateFilter(s.date, invFilter);
  }), [allSarees, sareeSearch, typeFilter, colorFilter, purchaseFilter, invFilter]);

  // Money spent + paid within the overview's selected time range.
  const rangePurchases = useMemo(
    () => stats.purchases.filter(p => matchesDateFilter(p.date, invFilter)),
    [stats.purchases, invFilter]
  );
  const rangeBilled = rangePurchases.reduce((sum, p) => sum + parseINR(p.billAmount), 0);
  const myPayments  = useMemo(() => payments.filter(p => p.supplierId === supplier.id), [payments, supplier.id]);
  const rangePaid   = myPayments.filter(p => matchesDateFilter(p.date, invFilter)).reduce((sum, p) => sum + p.amount, 0);

  const filteredOrders   = useMemo(() => stats.purchases.filter(p => matchesDateFilter(p.date, orderFilter)), [stats.purchases, orderFilter]);
  const filteredPayments = useMemo(() => myPayments.filter(p => matchesDateFilter(p.date, payFilter)), [myPayments, payFilter]);
  const filteredPaidSum  = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const myRequests = requests.filter(r => r.supplierId === supplier.id);

  // Spend trend by month, derived from this supplier's actual purchases.
  const spendByMonth = useMemo(() => {
    const buckets = new Map<string, number>();
    stats.purchases.forEach(p => {
      const month = (p.date || "").split(" ").slice(1).join(" ") || "—";
      buckets.set(month, (buckets.get(month) || 0) + parseINR(p.billAmount));
    });
    return Array.from(buckets, ([month, spend]) => ({ month, spend })).reverse();
  }, [stats.purchases]);

  // Billed amount grouped by payment status.
  const paymentStatusBreakdown = useMemo(() => {
    const colors: Record<string, string> = { Paid: T.green, Pending: T.antiqueGold, Partial: T.crimson };
    const buckets = new Map<string, number>();
    stats.purchases.forEach(p => {
      buckets.set(p.status, (buckets.get(p.status) || 0) + parseINR(p.billAmount));
    });
    return Array.from(buckets, ([name, value]) => ({ name, value, fill: colors[name] || T.taupe }))
      .filter(b => b.value > 0);
  }, [stats.purchases]);

  // Edit-profile form state, reset whenever a different supplier is opened.
  const [form, setForm] = useState<SupplierFormValues>({
    name: supplier.name, contactName: supplier.contactName, phone: supplier.phone,
    whatsapp: supplier.whatsapp || "", city: supplier.city, state: supplier.state,
    address: supplier.address, terms: supplier.terms, bankName: supplier.bankName || "",
    accountNo: supplier.accountNo || "", ifscCode: supplier.ifscCode || "", gstCode: supplier.gstCode,
    rating: supplier.rating || 3, notes: supplier.notes || "",
  });
  const [cardPreview, setCardPreview] = useState<string | null>(supplier.visitingCard || null);
  const [savedFlash, setSavedFlash] = useState(false);

  React.useEffect(() => {
    setForm({
      name: supplier.name, contactName: supplier.contactName, phone: supplier.phone,
      whatsapp: supplier.whatsapp || "", city: supplier.city, state: supplier.state,
      address: supplier.address, terms: supplier.terms, bankName: supplier.bankName || "",
      accountNo: supplier.accountNo || "", ifscCode: supplier.ifscCode || "", gstCode: supplier.gstCode,
      rating: supplier.rating || 3, notes: supplier.notes || "",
    });
    setCardPreview(supplier.visitingCard || null);
  }, [supplier]);

  const saveProfile = (values: SupplierFormValues = form) => {
    updateSupplier(supplier.id, { ...values, visitingCard: cardPreview ?? "" });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const card: React.CSSProperties = { background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" };

  return (
    <div className="px-3 sm:px-7 xl:px-14 py-4 sm:py-8">
      <div className="mb-3 sm:mb-4">
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "suppliers", label: "Suppliers", onClick: onBack },
            { key: "supplier", label: supplier.name },
          ]}
        />
      </div>

      {/* Header row with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-[10px] border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white active:bg-[#4A061B] active:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={16} /> Back to Suppliers
          </Button>

          <Button
            variant="secondary"
            className="sm:hidden h-9 px-3 rounded-[10px] border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white active:bg-red-700 active:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
            onClick={async () => {
              const ok = await confirm({
                title: `Delete supplier "${supplier.name}"?`,
                description: "This can't be undone. Suppliers with existing purchases or payments can't be deleted — deactivate them instead.",
                confirmLabel: "Delete Supplier",
                tone: "danger",
              });
              if (ok) deleteSupplier(supplier.id).then(onBack);
            }}
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <Button
            variant="primary"
            size="md"
            iconLeft={Wallet}
            disabled={stats.outstanding <= 0}
            onClick={() => setPayModalOpen(true)}
            className="h-9 sm:h-10 px-4 rounded-[10px] border-none shadow-[0_4px_16px_rgba(110,15,45,0.3)] bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#580C24] font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            Pay Supplier
          </Button>

          <Button
            variant="primary"
            size="md"
            iconLeft={Send}
            onClick={() => onRaiseRequest(supplier.id)}
            className="h-9 sm:h-10 px-4 rounded-[10px] border-none shadow-[0_4px_16px_rgba(200,155,71,0.3)] bg-[linear-gradient(135deg,#C89B47,#E7C983)] text-[#2C0913] hover:brightness-105 font-bold text-xs sm:text-sm cursor-pointer"
          >
            Raise Purchase Request
          </Button>

          <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <UserRound size={14} className="text-[#6E0F2D]" />
            <span>Supplier Profile</span>
          </div>

          <span className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] flex items-center justify-center font-bold text-xs uppercase tracking-wider whitespace-nowrap shrink-0 ${supplier.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {supplier.status}
          </span>

          <EntityCode type="supplier" value={supplier.code || supplier.id} size="md" className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap shrink-0" />

          <Button
            variant="secondary"
            className="hidden sm:flex h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white active:bg-red-700 active:text-white font-bold text-xs gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
            onClick={async () => {
              const ok = await confirm({
                title: `Delete supplier "${supplier.name}"?`,
                description: "This can't be undone. Suppliers with existing purchases or payments can't be deleted — deactivate them instead.",
                confirmLabel: "Delete Supplier",
                tone: "danger",
              });
              if (ok) deleteSupplier(supplier.id).then(onBack);
            }}
          >
            <Trash2 size={14} /> Delete Supplier
          </Button>
        </div>
      </div>

      {/* Profile Hero Banner */}
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
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 700, border: "2px solid rgba(200,155,71,0.45)", boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>
                  {supplier.initials}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    SILK SAREE SUPPLIER
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                  {supplier.name}
                </h1>
                <div className="mt-2 flex items-center gap-3 flex-wrap text-xs sm:text-sm text-white/70">
                  <span className="flex items-center gap-1.5"><MapPin size={14} color={T.antiqueGold} /> {supplier.city}, {supplier.state}</span>
                  <span className="flex items-center gap-1.5"><Package size={14} color={T.antiqueGold} /> {supplier.specialty}</span>
                  <StarRating rating={supplier.rating} />
                </div>
              </div>
            </div>

            {/* Metrics Stats Cards */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <CreditCard size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Purchased</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{formatMoney(rupees(stats.totalPurchased))}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Wallet size={20} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Paid</div>
                  <div className="text-sm sm:text-base font-bold text-[#7EE2A8] mt-0.5 whitespace-nowrap">{formatMoney(rupees(stats.totalPaid))}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Outstanding</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{formatMoney(rupees(stats.outstanding))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Royal Sub-Tab Strip */}
      <RoyalSubTabStrip
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

          {tab === "overview" && (
            <SectionCard
              icon={Boxes}
              title="Supplier Account Overview"
              subtitle={`Key metrics, saree purchases, and inventory records for ${supplier.name}`}
            >
              <OverviewTab
                card={card}
                supplierName={supplier.name}
                invFilter={invFilter}
                setInvFilter={setInvFilter}
                rangePurchases={rangePurchases}
                rangeBilled={rangeBilled}
                rangePaid={rangePaid}
                filteredSarees={filteredSarees}
                sareeSearch={sareeSearch}
                setSareeSearch={setSareeSearch}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                sareeTypes={sareeTypes}
                colorFilter={colorFilter}
                setColorFilter={setColorFilter}
                sareeColors={sareeColors}
                purchaseFilter={purchaseFilter}
                setPurchaseFilter={setPurchaseFilter}
                purchaseOptions={purchaseOptions}
                spendByMonth={spendByMonth}
                paymentStatusBreakdown={paymentStatusBreakdown}
                myRequests={myRequests}
              />
            </SectionCard>
          )}

          {tab === "orders" && (
            <SectionCard
              icon={ShoppingBag}
              title="Purchase Orders & Requests History"
              subtitle={`Full history of all saree purchase orders and requests with ${supplier.name}`}
            >
              <OrdersTab card={card} orderFilter={orderFilter} setOrderFilter={setOrderFilter} filteredOrders={filteredOrders} />
            </SectionCard>
          )}

          {tab === "payments" && (
            <SectionCard
              icon={CreditCard}
              title="Supplier Ledger & Payments"
              subtitle={`Settlement progress, invoice-wise transactions, and payment history for ${supplier.name}`}
            >
              <PaymentsTab
                card={card}
                filteredPaidSum={filteredPaidSum}
                totalPaid={stats.totalPaid}
                outstanding={stats.outstanding}
                payFilter={payFilter}
                setPayFilter={setPayFilter}
                filteredPayments={filteredPayments}
              />
            </SectionCard>
          )}

          {tab === "contact" && (
            <SectionCard
              icon={UserCheck}
              title="Supplier Contact & Bank Details"
              subtitle={`Official address, GSTIN, phone, and banking records for ${supplier.name}`}
            >
              <ContactTab supplier={supplier} />
            </SectionCard>
          )}

          {tab === "edit" && (
            <SectionCard
              icon={Edit3}
              title="Edit Supplier Profile"
              subtitle={`Update contact details, bank credentials, and status for ${supplier.name}`}
            >
              <EditTab
                card={card}
                form={form}
                setForm={setForm}
                cardPreview={cardPreview}
                setCardPreview={setCardPreview}
                savedFlash={savedFlash}
                onSave={saveProfile}
              />
            </SectionCard>
          )}

        </motion.div>
      </AnimatePresence>

      {payModalOpen && (
        <SupplierPayNowModal
          supplier={supplier}
          outstanding={stats.outstanding}
          openPurchases={purchases.filter(p => p.supplierId === supplier.id && p.status !== "Paid")}
          saving={savingPayment}
          onClose={() => setPayModalOpen(false)}
          onSave={payload => {
            setSavingPayment(true);
            addPayment({
              supplierId: supplier.id,
              date: payload.date,
              amount: payload.amount,
              mode: payload.mode,
              reference: payload.reference,
              purchaseId: payload.purchaseId,
            });
            toast.success(`Payment of ${formatMoney(rupees(payload.amount))} recorded for ${supplier.name}`);
            setSavingPayment(false);
            setPayModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
