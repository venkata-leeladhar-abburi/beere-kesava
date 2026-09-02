import { useState } from "react";
import { ChevronDown, Download, Eye, Edit, Plus, LayoutGrid, Table as TableIcon, MapPin, Building2, Users, AlertTriangle } from "lucide-react";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionCard, Pill, FadeUp } from "../common/primitives";
import { downloadDataAsCSV, monthsSinceLabel } from "../utils";
import { WholesaleCustomer, ViewMode } from "../types";
import { Button, Field, Input, PhoneInput, SearchInput, Select, SelectItem, Textarea } from "../../../../shared/ui/primitives";
import { useCustomers } from "../../contexts/CustomersContext";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "../../../../shared/ui/domain/Money";
import { VisitingCardUploadField } from "../../../../shared/ui/VisitingCardUploadField";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";

interface WholesaleFormState {
  name: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  address: string;
  paymentTerms: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  gstNumber: string;
  notes: string;
  /** Stored path of the uploaded visiting card (POST /uploads/photo), or "". */
  visitingCardUrl: string;
}

const EMPTY_WHOLESALE_FORM: WholesaleFormState = {
  name: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  city: "",
  state: "Andhra Pradesh",
  address: "",
  paymentTerms: "30 days",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  gstNumber: "",
  notes: "",
  visitingCardUrl: "",
};

export interface WholesaleCustomersSectionProps {
  wholesaleList: WholesaleCustomer[];
  wholesaleView: ViewMode;
  setWholesaleView: (v: ViewMode) => void;
  showAddWholesale: boolean;
  setShowAddWholesale: (v: boolean) => void;
  onView: (w: WholesaleCustomer) => void;
  onEdit: (w: WholesaleCustomer) => void;
}

// ── SECTION 4: WHOLESALE CUSTOMERS ──────────────────────────────────────────
export function WholesaleCustomersSection({
  wholesaleList, wholesaleView, setWholesaleView, showAddWholesale, setShowAddWholesale, onView, onEdit,
}: WholesaleCustomersSectionProps) {
  const { addCustomer, isLoading, error: loadError, refetch } = useCustomers();
  const [form, setForm] = useState<WholesaleFormState>(EMPTY_WHOLESALE_FORM);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wholesaleSearch, setWholesaleSearch] = useState("");
  const [wholesaleFilter, setWholesaleFilter] = useState<"all" | "active" | "dues" | "inactive">("all");

  const isInactive = (w: WholesaleCustomer) => monthsSinceLabel(w.lastOrder) >= 6;

  const totalOutstanding = wholesaleList.reduce((sum, w) => sum + (Number(w.out) || 0), 0);
  const activeOrdersCount = wholesaleList.filter(w => !!w.activeOrder).length;
  const duesCount = wholesaleList.filter(w => w.status === "overdue").length;
  const inactiveCount = wholesaleList.filter(isInactive).length;

  const filteredWholesaleList = wholesaleList.filter(w => {
    const q = wholesaleSearch.trim().toLowerCase();
    const matchSearch = q === "" || w.name.toLowerCase().includes(q) || w.city.toLowerCase().includes(q);
    const matchFilter =
      wholesaleFilter === "all" ? true :
        wholesaleFilter === "active" ? !isInactive(w) :
          wholesaleFilter === "dues" ? w.status === "overdue" :
            isInactive(w);
    return matchSearch && matchFilter;
  });

  const listColumns: ColumnDef<WholesaleCustomer>[] = [
    { id: "code", header: "Code", accessor: w => w.displayCode || w.id, priority: 3, cell: (_v, w) => <span style={{ fontFamily: "var(--font-mono)", color: T.royalBurgundy, fontSize: 13 }}>{w.displayCode || w.id}</span> },
    { id: "name", header: "Business Name", accessor: w => w.name, priority: 1, cell: (_v, w) => <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{w.name}</span> },
    { id: "city", header: "City", accessor: w => w.city, priority: 3, cell: (_v, w) => <span style={{ color: T.taupe }}>{w.city}</span> },
    { id: "orders", header: "Orders", accessor: w => w.orders, cell: (_v, w) => <span style={{ color: T.luxuryBrown }}>{w.orders}</span> },
    { id: "outstanding", header: "Outstanding", accessor: w => w.out, cell: (_v, w) => <span style={{ color: w.out === "0" ? T.greenMid : T.crimson, fontWeight: 600 }}>{formatMoney(rupees(Number(w.out) || 0))}</span> },
    {
      id: "status", header: "Status", accessor: w => w.status, type: "status",
      cell: (_v, w) => <span style={{ padding: "4px 10px", background: w.status === "clear" ? T.greenBg : w.status === "overdue" ? T.crimsonBg : "rgba(200,155,71,0.10)", color: w.status === "clear" ? T.greenMid : w.status === "overdue" ? T.crimson : T.antiqueGold, fontSize: 12, borderRadius: 5, fontWeight: 600 }}>{w.status.toUpperCase()}</span>,
    },
    { id: "action", header: "Action", accessor: () => null, type: "actions", cell: (_v, w) => <Button onClick={() => onView(w)} variant="link" size="sm">View</Button> },
  ];

  const tableColumns: ColumnDef<WholesaleCustomer>[] = [
    { id: "code", header: "Code", accessor: w => w.displayCode || w.id, priority: 3, cell: (_v, w) => <span style={{ fontFamily: "var(--font-mono)", color: T.royalBurgundy, fontSize: 13 }}>{w.displayCode || w.id}</span> },
    { id: "name", header: "Business Name", accessor: w => w.name, priority: 1, cell: (_v, w) => <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{w.name}</span> },
    { id: "city", header: "City", accessor: w => w.city, priority: 3, cell: (_v, w) => <span style={{ color: T.taupe }}>{w.city}</span> },
    { id: "totalOrders", header: "Total Orders", accessor: w => w.orders, cell: (_v, w) => <span style={{ color: T.luxuryBrown }}>{w.orders}</span> },
    { id: "totalSpend", header: "Total Spend", accessor: w => w.spend, cell: (_v, w) => <span style={{ color: T.antiqueGold, fontWeight: 600 }}>{formatMoney(rupees(Number(w.spend) || 0))}</span> },
    { id: "outstanding", header: "Outstanding", accessor: w => w.out, cell: (_v, w) => <span style={{ color: w.out === "0" ? T.greenMid : T.crimson, fontWeight: 600 }}>{formatMoney(rupees(Number(w.out) || 0))}</span> },
    { id: "terms", header: "Terms", accessor: w => w.terms, priority: 3, cell: (_v, w) => <span style={{ color: T.luxuryBrown }}>{w.terms}</span> },
    { id: "lastOrder", header: "Last Order", accessor: w => w.lastOrder, priority: 3, cell: (_v, w) => <span style={{ color: T.taupe }}>{w.lastOrder}</span> },
    {
      id: "status", header: "Status", accessor: w => w.status, type: "status",
      cell: (_v, w) => <span style={{ padding: "4px 10px", background: w.status === "clear" ? T.greenBg : w.status === "overdue" ? T.crimsonBg : "rgba(200,155,71,0.10)", color: w.status === "clear" ? T.greenMid : w.status === "overdue" ? T.crimson : T.antiqueGold, fontSize: 12, borderRadius: 5, fontWeight: 600 }}>{w.status.toUpperCase()}</span>,
    },
    { id: "action", header: "Action", accessor: () => null, type: "actions", cell: (_v, w) => <Button onClick={() => onView(w)} variant="link" size="sm">View Profile</Button> },
  ];

  const updateField = <K extends keyof WholesaleFormState>(key: K, value: WholesaleFormState[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const closeAddWholesale = () => {
    setShowAddWholesale(false);
    setForm(EMPTY_WHOLESALE_FORM);
    setCardUrl(null);
    setError(null);
  };

  const handleSaveWholesale = async () => {
    setError(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Business Name and Phone Number are required.");
      return;
    }
    setSubmitting(true);
    try {
      await addCustomer({
        name: form.name.trim(),
        type: "WHOLESALE",
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim(),
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        gstCode: form.gstNumber.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifscCode: form.ifscCode.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        state: form.state || undefined,
        paymentTerms: form.paymentTerms || undefined,
        notes: form.notes.trim() || undefined,
        visitingCardUrl: cardUrl || undefined,
      });
      closeAddWholesale();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="customers-wholesale-section" className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
      <SectionCard
        icon={Building2}
        title="Wholesale Customers"
        subtitle="These are the businesses that buy sarees in bulk. Manage their profiles, track their orders, and monitor outstanding payments."
        actions={
          <Button onClick={() => (showAddWholesale ? closeAddWholesale() : setShowAddWholesale(true))} variant="secondary" iconLeft={Plus} className="bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white">
            Add New Wholesale Customer
          </Button>
        }
      >
        {showAddWholesale && (
          <FadeUp>
            <div style={{ background: "#FFF", borderRadius: 16, padding: 32, border: `1px solid ${T.borderDef}`, marginBottom: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Wholesale Customer</h3>
                  <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
                </div>
                <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>A WHL-### id will be assigned</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Business Name *"><Input aria-label="Name of the business or shop" type="text" placeholder="Name of the business or shop" value={form.name} onChange={e => updateField("name", e.target.value)} /></Field>
                  <Field label="Owner / Contact Name *"><Input aria-label="Who to speak to at this business" type="text" placeholder="Who to speak to at this business" value={form.contactName} onChange={e => updateField("contactName", e.target.value)} /></Field>
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                    <Field label="Phone Number *"><PhoneInput aria-label="Main contact number" value={form.phone} onValueChange={v => updateField("phone", v)} /></Field>
                    <Field label="WhatsApp Number"><Input aria-label="If different" type="text" placeholder="If different" value={form.whatsapp} onChange={e => updateField("whatsapp", e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                    <Field label="City *"><Input aria-label="City" type="text" placeholder="City" value={form.city} onChange={e => updateField("city", e.target.value)} /></Field>
                    <Field label="State *">
                      <Select value={form.state} onValueChange={v => updateField("state", v)}>
                        <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                        <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                      </Select>
                    </Field>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Business Address"><Textarea placeholder="Full address for delivery and billing" rows={2} value={form.address} onChange={e => updateField("address", e.target.value)} /></Field>
                  <Field label="Payment Terms">
                    <Select value={form.paymentTerms} onValueChange={v => updateField("paymentTerms", v)}>
                      <SelectItem value="30 days">30 days</SelectItem>
                      <SelectItem value="45 days">45 days</SelectItem>
                      <SelectItem value="60 days">60 days</SelectItem>
                      <SelectItem value="90 days">90 days</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                    <Field label="Bank Name"><Input aria-label="For any refunds" type="text" placeholder="For any refunds" value={form.bankName} onChange={e => updateField("bankName", e.target.value)} /></Field>
                    <Field label="Account Number"><Input aria-label="Account No." type="text" placeholder="Account No." value={form.accountNumber} onChange={e => updateField("accountNumber", e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                    <Field label="IFSC Code"><Input aria-label="Bank IFSC code" type="text" placeholder="e.g. HDFC0001842" value={form.ifscCode} onChange={e => updateField("ifscCode", e.target.value)} /></Field>
                    <Field label="GST Number"><Input aria-label="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" type="text" placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" value={form.gstNumber} onChange={e => updateField("gstNumber", e.target.value)} /></Field>
                  </div>
                  <VisitingCardUploadField cardUrl={cardUrl} onChange={setCardUrl} />
                  <Field label="Notes"><Input aria-label="Any special instructions..." type="text" placeholder="Any special instructions..." value={form.notes} onChange={e => updateField("notes", e.target.value)} /></Field>
                </div>
              </div>
              {error && (
                <div style={{ marginTop: 20, padding: "10px 14px", background: T.crimsonBg, color: T.crimson, borderRadius: 8, fontFamily: F.ui, fontSize: 13 }}>{error}</div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.borderDef}` }}>
                <Button onClick={closeAddWholesale} variant="tertiary" disabled={submitting}>Cancel</Button>
                <Button onClick={handleSaveWholesale} variant="primary" disabled={submitting}>{submitting ? "Saving…" : "✓ Save Customer"}</Button>
              </div>
            </div>
          </FadeUp>
        )}

        {/* Wholesale stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 22, marginTop: 32, marginBottom: 28, alignItems: "stretch" }}>
          {[
            {
              icon: <Building2 size={22} color={T.antiqueGold} />,
              label: "Total Wholesale Customers",
              value: String(wholesaleList.length),
              sub: "Active business relationships",
              gid: "twc",
            },
            {
              icon: <AlertTriangle size={22} color={T.antiqueGold} />,
              label: "Total Outstanding",
              value: <Money value={rupees(totalOutstanding)} />,
              sub: "Across all overdue accounts",
              gid: "too",
            },
            {
              icon: <Eye size={22} color={T.antiqueGold} />,
              label: "Active Orders Right Now",
              value: String(activeOrdersCount),
              sub: "Bulk orders in production",
              gid: "aor",
            },
            {
              icon: <Users size={22} color={T.antiqueGold} />,
              label: "Inactive Customers",
              value: String(inactiveCount),
              sub: "No order in 6+ months",
              gid: "inc",
            },
          ].map((s) => (
            <div key={s.label} style={{ position: "relative", borderRadius: 14, border: `1px solid ${T.borderDef}`, background: "#FFFDF9", boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 6px 30px rgba(0,0,0,0.04)", overflow: "visible", display: "flex", flexDirection: "column" as const, alignItems: "center", minHeight: 236 }}>
              {/* ── Header — royal burgundy gradient ── */}
              <svg viewBox="0 0 300 90" preserveAspectRatio="none" style={{ width: "100%", height: 44, display: "block", borderRadius: "12px 12px 0 0", flexShrink: 0 }}>
                <defs>
                  <linearGradient id={`bk-head-${s.gid}`} x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#7A1232" />
                    <stop offset="40%" stopColor={T.royalBurgundy} />
                    <stop offset="100%" stopColor={T.deepWine} />
                  </linearGradient>
                </defs>
                <path d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z" fill={`url(#bk-head-${s.gid})`} />
                <path d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z" fill={`url(#bk-shim-${s.gid})`} opacity="0.4" />
                <defs>
                  <linearGradient id={`bk-shim-${s.gid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(200,155,71,0)" />
                    <stop offset="50%" stopColor="rgba(200,155,71,0.08)" />
                    <stop offset="100%" stopColor="rgba(200,155,71,0)" />
                  </linearGradient>
                </defs>
                <path d="M0,32 C70,36 110,85 150,88 C190,85 230,36 300,32" fill="none" stroke="rgba(200,155,71,0.30)" strokeWidth="0.7" />
                <g transform="translate(150,86)" opacity="0.45">
                  <path d="M-6,0 C-8,-3 -11,-2 -10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M6,0 C8,-3 11,-2 10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
                  <rect x="-2" y="-2" width="4" height="4" rx="0.3" fill={T.antiqueGold} transform="rotate(45)" />
                </g>
              </svg>

              {/* ── Circular icon badge ── */}
              <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(155deg, #7A1232 0%, #6E0F2D 40%, #4A061B 100%)", border: `2.5px solid rgba(200,155,71,0.45)`, boxShadow: "0 4px 14px rgba(74,6,27,0.25), 0 0 0 3px rgba(255,253,249,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </div>
              </div>

              {/* ── Card body content ── */}
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, padding: "34px 20px 0", width: "100%" }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, letterSpacing: 1, textTransform: "uppercase" as const, textAlign: "center" as const, lineHeight: 1.45 }}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginTop: 14, textAlign: "center" as const }}>{s.value}</div>
                <div style={{ width: "45%", display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                  <div style={{ width: 5, height: 5, background: "rgba(110,15,45,0.22)", transform: "rotate(45deg)", flexShrink: 0, margin: "0 4px" }} />
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, textAlign: "center" as const, lineHeight: 1.4 }}>{s.sub}</div>
              </div>

              {/* ── Footer strip — royal burgundy ── */}
              <div style={{ width: "100%", marginTop: "auto", position: "relative", overflow: "hidden", borderRadius: "0 0 12px 12px", height: 30, flexShrink: 0 }}>
                <svg viewBox="0 0 300 40" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", position: "absolute", top: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`bk-foot-${s.gid}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.royalBurgundy} />
                      <stop offset="50%" stopColor="#5A0A22" />
                      <stop offset="100%" stopColor={T.deepWine} />
                    </linearGradient>
                  </defs>
                  <path d="M0,28 C60,28 100,10 150,8 C200,10 240,28 300,28 L300,40 L0,40 Z" fill={`url(#bk-foot-${s.gid})`} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyItems: "center", justifyContent: "center", paddingBottom: 0 }}>
                  <img src="/assets/gold-fleur-footer.png" alt="Ornament" style={{ height: 26, maxWidth: "100%", objectFit: "contain", opacity: 0.9, transform: "translateY(1px)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Flipkart-style Collapsible Filter Bar */}
        <div className="md:hidden bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs mb-4">
          <MobileFilterBar
            search={wholesaleSearch}
            onSearchChange={setWholesaleSearch}
            searchPlaceholder="Search business name, city..."
            filterGroups={[
              {
                id: "status",
                label: "Status",
                value: wholesaleFilter,
                defaultValue: "all",
                options: [
                  { value: "all", label: `All Wholesale (${wholesaleList.length})` },
                  { value: "active", label: `Active (${wholesaleList.length})` },
                  { value: "dues", label: "Has Dues (0)" },
                  { value: "inactive", label: "Inactive (0)" },
                ],
                onChange: (v: string) => setWholesaleFilter(v as any),
              },
            ]}
            onResetAll={() => {
              setWholesaleSearch("");
              setWholesaleFilter("all");
            }}
          />
        </div>

        {/* Desktop Toolbar */}
        <div className="hidden md:flex flex-col gap-5 mb-6">
          {/* Top row: search + sort/view */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search bar */}
            <div className="w-full md:w-[280px] lg:w-[400px] relative">
              <SearchInput
                aria-label="Search by business name, city..."
                placeholder="Search by business name, city..."
                value={wholesaleSearch}
                onChange={e => setWholesaleSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}>Sort By: Outstanding <ChevronDown size={14} /></span>
              <div style={{ display: "inline-flex", alignItems: "center", background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 999, padding: 3, gap: 2 }}>
                <button
                  type="button"
                  onClick={() => setWholesaleView("card")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 999,
                    fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                    background: wholesaleView === "card" ? "#6E0F2D" : "transparent",
                    color: wholesaleView === "card" ? "#FFFFFF" : T.taupe,
                    border: "none",
                    boxShadow: wholesaleView === "card" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <LayoutGrid size={15} color={wholesaleView === "card" ? "#FFFFFF" : T.taupe} />
                  Card View
                </button>
                <button
                  type="button"
                  onClick={() => setWholesaleView("table")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 999,
                    fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                    background: wholesaleView === "table" || wholesaleView === "list" ? "#6E0F2D" : "transparent",
                    color: wholesaleView === "table" || wholesaleView === "list" ? "#FFFFFF" : T.taupe,
                    border: "none",
                    boxShadow: wholesaleView === "table" || wholesaleView === "list" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <TableIcon size={15} color={wholesaleView === "table" || wholesaleView === "list" ? "#FFFFFF" : T.taupe} />
                  Table View
                </button>
              </div>
              <DownloadGate>
                <Button
                  variant="tertiary"
                  size="sm"
                  iconLeft={Download}
                  onClick={() => downloadDataAsCSV(
                    "wholesale_customers.csv",
                    ["Code", "Name", "City", "Status", "Orders", "Spend", "Outstanding", "Last Order"],
                    filteredWholesaleList.map(w => [w.displayCode || w.id, w.name, w.city, w.status, w.orders, w.spend, w.out, w.lastOrder]),
                  )}
                >Download</Button>
              </DownloadGate>
            </div>
          </div>

          {/* Filter pills row */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <Pill active={wholesaleFilter === "all"} onClick={() => setWholesaleFilter("all")}>All Wholesale ({wholesaleList.length})</Pill>
            <Pill active={wholesaleFilter === "active"} onClick={() => setWholesaleFilter("active")}>Active ({wholesaleList.length - inactiveCount})</Pill>
            <Pill active={wholesaleFilter === "dues"} onClick={() => setWholesaleFilter("dues")}>Has Dues ({duesCount})</Pill>
            <Pill active={wholesaleFilter === "inactive"} onClick={() => setWholesaleFilter("inactive")}>Inactive ({inactiveCount})</Pill>
          </div>
        </div>


        {/* Wholesale Cards View */}
        {wholesaleView === "card" && isLoading && <LoadingState variant="skeleton" rows={4} />}
        {wholesaleView === "card" && !isLoading && loadError && <ErrorState error={loadError} onRetry={refetch} />}
        {wholesaleView === "card" && !isLoading && !loadError && filteredWholesaleList.length === 0 && (
          <EmptyState title="No wholesale customers yet" description="Customers added here appear across bulk orders, quotations, and dispatch." />
        )}
        {wholesaleView === "card" && !isLoading && !loadError && filteredWholesaleList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
            {filteredWholesaleList.map((w, i) => {
              return (
                <div key={w.id} style={{
                  background: "#FFFDF9",
                  borderRadius: 12,
                  border: `1.5px solid ${T.antiqueGold}`,
                  boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  color: T.luxuryBrown,
                }}>
                  {/* Accent top */}
                  <div style={{ height: 4, background: T.royalBurgundy, width: "100%", flexShrink: 0 }} />

                  {/* Card Header: Avatar & Short ID */}
                  <div style={{ padding: "20px 22px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.royalBurgundy, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, border: `3px solid ${T.antiqueGold}`, flexShrink: 0 }}>
                        {w.code}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{w.name}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px", marginBottom: 3 }}>{w.displayCode || w.id}</div>
                        <div style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 7, padding: "3px 10px" }}>EST. {2020 + (i % 5)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Middle: Firm Name & City */}
                  <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MapPin size={20} color={T.royalBurgundy} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Location</div>
                        <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{w.city}</div>
                      </div>
                    </div>

                    {/* Card Bottom: GST, Credit Terms & Dues */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Building2 size={20} color={T.royalBurgundy} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Business Details</div>
                        <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 2 }}>GSTIN: {w.gstNumber || "Unregistered"}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.45 }}>Credit Terms: {w.terms}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AlertTriangle size={20} color={T.royalBurgundy} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Outstanding</div>
                        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: w.out === "0" ? T.greenMid : T.crimson }}>
                          {w.out === "0" ? "Clear" : formatMoney(rupees(Number(w.out) || 0))}
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: w.status === "overdue" ? T.crimson : T.taupe, marginTop: 2, fontWeight: 600 }}>
                          {w.status === "clear" ? "✓ No Dues" : w.status === "overdue" ? "⚠ Overdue" : "◐ Pending"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12 }}>
                    <Button onClick={() => onView(w)} variant="secondary" className="flex-1 rounded-xl shadow-none border-[#E8DCC4] hover:bg-[#F7F2EA] hover:border-[#D4C3A3] text-[#4A2B1D]">
                      <Eye size={20} className="mr-2" />
                      View Profile
                    </Button>
                    <Button onClick={() => onEdit(w)} variant="secondary" className="flex-1 rounded-xl shadow-none border-[#E8DCC4] hover:bg-[#F7F2EA] hover:border-[#D4C3A3] text-[#4A2B1D]">
                      <Edit size={20} className="mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wholesale List View */}
        {wholesaleView === "list" && (
          <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <DataTable columns={listColumns} data={filteredWholesaleList} getRowId={w => w.id} loading={isLoading} error={!!loadError} onRetry={refetch} emptyTitle="No wholesale customers yet" pagination />
          </div>
        )}

        {/* Wholesale Table View */}
        {wholesaleView === "table" && (
          <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }} className="w-full overflow-x-auto section-nav-scroll p-2">
            <div className="min-w-[850px]">
              <DataTable columns={tableColumns} data={filteredWholesaleList} getRowId={w => w.id} loading={isLoading} error={!!loadError} onRetry={refetch} emptyTitle="No wholesale customers yet" pagination />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
