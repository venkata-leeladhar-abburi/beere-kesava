// Full supplier profile page (Overview / Order History / Payment History /
// Contact Details / Edit Profile tabs). Split into one file per tab under
// this supplierProfile/ subfolder, composed here.

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MapPin, Package, Send, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SupplierPayNowModal } from "@/features/payments";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import {
  useSuppliers, Supplier, parseINR,
} from "../../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { SupplierFormValues } from "../../types";
import { FadeUp, StatusPill, StarRating } from "../../common/primitives";
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
  const { statsFor, payments, requests, updateSupplier, deleteSupplier, addPayment } = useSuppliers();
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
  const confirm = useConfirm();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Command palette RECENT group (design-system/05-OVERLAYS.md Part H) —
  // record this profile as viewed once per mount.
  useEffect(() => {
    recordView({ key: `supplier:${supplier.id}`, label: supplier.name, path: "/admin/suppliers", kind: "Supplier" });
  }, [supplier.id, supplier.name]);
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders",   label: "Order History" },
    { key: "payments", label: "Payment History" },
    { key: "contact",  label: "Contact Details" },
    { key: "edit",     label: "Edit Profile" },
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
      const month = (p.date || "").split(" ").slice(1).join(" ") || "—"; // "01 Jun 2026" → "Jun 2026"
      buckets.set(month, (buckets.get(month) || 0) + parseINR(p.billAmount));
    });
    return Array.from(buckets, ([month, spend]) => ({ month, spend })).reverse();
  }, [stats.purchases]);

  // Billed amount grouped by payment status — the number that matters most when
  // deciding which supplier needs to be paid next.
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
    accountNo: supplier.accountNo || "", gstCode: supplier.gstCode,
    rating: supplier.rating || 3, notes: supplier.notes || "",
  });
  const [cardPreview, setCardPreview] = useState<string | null>(supplier.visitingCard || null);
  const [savedFlash, setSavedFlash] = useState(false);

  React.useEffect(() => {
    setForm({
      name: supplier.name, contactName: supplier.contactName, phone: supplier.phone,
      whatsapp: supplier.whatsapp || "", city: supplier.city, state: supplier.state,
      address: supplier.address, terms: supplier.terms, bankName: supplier.bankName || "",
      accountNo: supplier.accountNo || "", gstCode: supplier.gstCode,
      rating: supplier.rating || 3, notes: supplier.notes || "",
    });
    setCardPreview(supplier.visitingCard || null);
  }, [supplier]);

  const saveProfile = () => {
    updateSupplier(supplier.id, { ...form, visitingCard: cardPreview || undefined });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const card: React.CSSProperties = { background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" };

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40, paddingBottom: 40, background: T.silkCream, minHeight: "100dvh" }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "suppliers", label: "Suppliers", onClick: onBack },
            { key: "supplier", label: supplier.name },
          ]}
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button variant="tertiary" size="md" iconLeft={ArrowLeft} onClick={onBack}>
          Back to Suppliers
        </Button>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          <Button
            variant="primary"
            size="md"
            iconLeft={Wallet}
            disabled={stats.outstanding <= 0}
            onClick={() => setPayModalOpen(true)}
            className="border-none shadow-[0_4px_16px_rgba(110,15,45,0.3)] bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] disabled:opacity-50"
          >
            Pay Supplier
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeft={Send}
            onClick={() => onRaiseRequest(supplier.id)}
            className="border-none shadow-[0_4px_16px_rgba(200,155,71,0.3)] bg-[linear-gradient(135deg,#C89B47,#E7C983)] text-[#2C0913] hover:bg-[linear-gradient(135deg,#C89B47,#E7C983)]"
          >
            Raise Purchase Request
          </Button>
          <StatusPill status={supplier.status} />
          <EntityCode type="supplier" value={supplier.code || supplier.id} />
          <Button
            variant="tertiary" size="md" iconLeft={Trash2}
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
            Delete
          </Button>
        </div>
      </div>

      <FadeUp>
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", color: "#FFF", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }} className="p-5 sm:p-8">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 18, fontWeight: 800, flexShrink: 0, boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>{supplier.initials}</div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>{supplier.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{supplier.city}, {supplier.state}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Package size={13} color={T.antiqueGold} />{supplier.specialty}</span>
                <StarRating rating={supplier.rating} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 sm:gap-10 items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0">
            {[
              { label: "TOTAL PURCHASED", value: formatMoney(rupees(stats.totalPurchased)), color: T.goldLight },
              { label: "TOTAL PAID",      value: formatMoney(rupees(stats.totalPaid)),      color: "#7EE2A8" },
              { label: "OUTSTANDING",     value: formatMoney(rupees(stats.outstanding)),    color: stats.outstanding > 0 ? "#F87171" : T.goldLight },
            ].map(m => (
              <div key={m.label} className="text-left sm:text-right">
                <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>{m.label}</div>
                <div className="text-lg sm:text-2xl font-bold" style={{ fontFamily: F.display, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Tabs */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 mb-6 border-b-2 border-[var(--border-default)]">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(t => (
            <Button
              key={t.key}
              variant="link"
              size="md"
              onClick={() => setTab(t.key)}
              className={
                "rounded-none px-4 sm:px-6 py-3 mb-[-6px] shrink-0 border-0 border-b-2 no-underline hover:no-underline text-sm sm:text-base " +
                (tab === t.key
                  ? "border-b-[var(--surface-brand)] font-bold text-[color:var(--text-brand)]"
                  : "border-b-transparent font-normal text-[color:var(--text-tertiary)]")
              }
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

          {tab === "overview" && (
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
          )}

          {tab === "orders" && (
            <OrdersTab card={card} orderFilter={orderFilter} setOrderFilter={setOrderFilter} filteredOrders={filteredOrders} />
          )}

          {tab === "payments" && (
            <PaymentsTab
              card={card}
              filteredPaidSum={filteredPaidSum}
              totalPaid={stats.totalPaid}
              outstanding={stats.outstanding}
              payFilter={payFilter}
              setPayFilter={setPayFilter}
              filteredPayments={filteredPayments}
            />
          )}

          {tab === "contact" && <ContactTab card={card} supplier={supplier} />}

          {tab === "edit" && (
            <EditTab
              card={card}
              form={form}
              setForm={setForm}
              cardPreview={cardPreview}
              setCardPreview={setCardPreview}
              savedFlash={savedFlash}
              onSave={saveProfile}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {payModalOpen && (
        <SupplierPayNowModal
          supplier={supplier}
          outstanding={stats.outstanding}
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
