// Full supplier profile page (Overview / Order History / Payment History /
// Contact Details / Edit Profile tabs). Split into one file per tab under
// this supplierProfile/ subfolder, composed here.

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MapPin, Package, Send } from "lucide-react";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import {
  useSuppliers, Supplier, formatINR, parseINR,
} from "../../../contexts/SupplierContext";
import { SupplierFormValues } from "../../types";
import { FadeUp, StatusPill, StarRating } from "../../common/primitives";
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
  const { statsFor, payments, requests, updateSupplier } = useSuppliers();
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
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
    () => stats.purchases.flatMap(p => p.sarees.map(s => ({ ...s, purchaseId: p.id, invoiceNumber: p.invoiceNumber }))),
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
    <div style={{ padding: "40px 56px", background: T.silkCream, minHeight: "100dvh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Suppliers
        </motion.button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <motion.button onClick={() => onRaiseRequest(supplier.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, border: "none", padding: "10px 20px", borderRadius: 8, color: T.darkBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,71,0.3)" }}>
            <Send size={14} /> Raise Purchase Request
          </motion.button>
          <StatusPill status={supplier.status} />
          <span style={{ fontFamily: F.mono, fontSize: 13, background: "#FFF", border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>{supplier.id}</span>
        </div>
      </div>

      {/* Hero */}
      <FadeUp>
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 20, fontWeight: 800, flexShrink: 0, boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>{supplier.initials}</div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, margin: "0 0 6px" }}>{supplier.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{supplier.city}, {supplier.state}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Package size={13} color={T.antiqueGold} />{supplier.specialty}</span>
                <StarRating rating={supplier.rating} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 44, alignItems: "center" }}>
            {[
              { label: "TOTAL PURCHASED", value: formatINR(stats.totalPurchased), color: T.goldLight },
              { label: "TOTAL PAID",      value: formatINR(stats.totalPaid),      color: "#7EE2A8" },
              { label: "OUTSTANDING",     value: formatINR(stats.outstanding),    color: stats.outstanding > 0 ? "#F87171" : T.goldLight },
            ].map(m => (
              <div key={m.label} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.borderDef}`, marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "14px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", marginBottom: -2, cursor: "pointer", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
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
    </div>
  );
}
