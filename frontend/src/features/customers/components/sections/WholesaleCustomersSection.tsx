import { useState } from "react";
import {
  ChevronDown, Download, Eye, Edit, Plus,
  LayoutGrid, AlignJustify, Table as TableIcon, MapPin,
  Building2, Users, AlertTriangle,
} from "lucide-react";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionTitle, Pill, FadeUp } from "../common/primitives";
import { WholesaleCustomer, ViewMode } from "../types";
import { Button, IconButton, Field, Input, SearchInput, Select, SelectItem, Textarea } from "../../../../shared/ui/primitives";
import { useCustomers } from "../../contexts/CustomersContext";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney, paise } from "@/lib/domain/money";
import { Money } from "../../../../shared/ui/domain/Money";

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
  gstNumber: string;
  notes: string;
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
  gstNumber: "",
  notes: "",
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
  const { addCustomer } = useCustomers();
  const [form, setForm] = useState<WholesaleFormState>(EMPTY_WHOLESALE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listColumns: ColumnDef<WholesaleCustomer>[] = [
    { id: "code", header: "Code", accessor: w => w.id, cell: (_v, w) => <span style={{ fontFamily: F.mono, color: T.royalBurgundy, fontSize: 13 }}>{w.id}</span> },
    { id: "name", header: "Business Name", accessor: w => w.name, cell: (_v, w) => <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{w.name}</span> },
    { id: "city", header: "City", accessor: w => w.city, cell: (_v, w) => <span style={{ color: T.taupe }}>{w.city}</span> },
    { id: "orders", header: "Orders", accessor: w => w.orders, cell: (_v, w) => <span style={{ color: T.luxuryBrown }}>{w.orders}</span> },
    { id: "outstanding", header: "Outstanding", accessor: w => w.out, cell: (_v, w) => <span style={{ color: w.out === "0" ? T.greenMid : T.crimson, fontWeight: 600 }}>{formatMoney(rupees(Number(w.out) || 0))}</span> },
    {
      id: "status", header: "Status", accessor: w => w.status, type: "status",
      cell: (_v, w) => <span style={{ padding: "4px 10px", background: w.status === "clear" ? T.greenBg : w.status === "overdue" ? T.crimsonBg : "rgba(200,155,71,0.10)", color: w.status === "clear" ? T.greenMid : w.status === "overdue" ? T.crimson : T.antiqueGold, fontSize: 12, borderRadius: 5, fontWeight: 600 }}>{w.status.toUpperCase()}</span>,
    },
    { id: "action", header: "Action", accessor: () => null, type: "actions", cell: (_v, w) => <Button onClick={() => onView(w)} variant="link" size="sm">View</Button> },
  ];

  const tableColumns: ColumnDef<WholesaleCustomer>[] = [
    { id: "code", header: "Code", accessor: w => w.id, cell: (_v, w) => <span style={{ fontFamily: F.mono, color: T.royalBurgundy, fontSize: 13 }}>{w.id}</span> },
    { id: "name", header: "Business Name", accessor: w => w.name, cell: (_v, w) => <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{w.name}</span> },
    { id: "city", header: "City", accessor: w => w.city, cell: (_v, w) => <span style={{ color: T.taupe }}>{w.city}</span> },
    { id: "totalOrders", header: "Total Orders", accessor: w => w.orders, cell: (_v, w) => <span style={{ color: T.luxuryBrown }}>{w.orders}</span> },
    { id: "totalSpend", header: "Total Spend", accessor: w => w.spend, cell: (_v, w) => <span style={{ color: T.antiqueGold, fontWeight: 600 }}>{formatMoney(rupees(Number(w.spend) || 0))}</span> },
    { id: "outstanding", header: "Outstanding", accessor: w => w.out, cell: (_v, w) => <span style={{ color: w.out === "0" ? T.greenMid : T.crimson, fontWeight: 600 }}>{formatMoney(rupees(Number(w.out) || 0))}</span> },
    { id: "terms", header: "Terms", accessor: w => w.terms, cell: (_v, w) => <span style={{ color: T.luxuryBrown }}>{w.terms}</span> },
    { id: "lastOrder", header: "Last Order", accessor: w => w.lastOrder, cell: (_v, w) => <span style={{ color: T.taupe }}>{w.lastOrder}</span> },
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
        phone: form.phone.trim(),
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        gstCode: form.gstNumber.trim() || undefined,
      });
      closeAddWholesale();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="customers-wholesale-section" style={{ padding: "0 56px 64px 56px" }}>
      <SectionTitle
        title="Wholesale Customers"
        sub="These are the businesses that buy sarees in bulk. Manage their profiles, track their orders, and monitor outstanding payments."
        action=""
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -60, marginBottom: 24 }}>
        <Button onClick={() => (showAddWholesale ? closeAddWholesale() : setShowAddWholesale(true))} variant="primary" iconLeft={Plus}>
          Add New Wholesale Customer →
        </Button>
      </div>

      {showAddWholesale && (
        <FadeUp>
          <div style={{ background: "#FFF", borderRadius: 16, padding: 32, border: `1px solid ${T.borderDef}`, marginBottom: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Wholesale Customer</h3>
                <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
              </div>
              <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>WHL-049 will be assigned</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Business Name *"><Input aria-label="Name of the business or shop" type="text" placeholder="Name of the business or shop" value={form.name} onChange={e => updateField("name", e.target.value)} /></Field>
                <Field label="Owner / Contact Name *"><Input aria-label="Who to speak to at this business" type="text" placeholder="Who to speak to at this business" value={form.contactName} onChange={e => updateField("contactName", e.target.value)} /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Phone Number *"><Input aria-label="Main contact number" type="text" placeholder="Main contact number" value={form.phone} onChange={e => updateField("phone", e.target.value)} /></Field>
                  <Field label="WhatsApp Number"><Input aria-label="If different" type="text" placeholder="If different" value={form.whatsapp} onChange={e => updateField("whatsapp", e.target.value)} /></Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                <Field label="Payment Terms *">
                  <Select value={form.paymentTerms} onValueChange={v => updateField("paymentTerms", v)}>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="45 days">45 days</SelectItem>
                    <SelectItem value="60 days">60 days</SelectItem>
                    <SelectItem value="90 days">90 days</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </Select>
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Bank Name"><Input aria-label="For any refunds" type="text" placeholder="For any refunds" value={form.bankName} onChange={e => updateField("bankName", e.target.value)} /></Field>
                  <Field label="Account Number"><Input aria-label="Account No." type="password" placeholder="Account No." value={form.accountNumber} onChange={e => updateField("accountNumber", e.target.value)} /></Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="GST Number"><Input aria-label="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" type="text" placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" value={form.gstNumber} onChange={e => updateField("gstNumber", e.target.value)} /></Field>
                  <Field label="Visiting Card Photo"><Input type="file" accept="image/*" /></Field>
                </div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28, alignItems: "stretch" }}>
        {[
          { ico: <Building2 size={24} color={T.royalBurgundy} />, bg: "rgba(110,15,45,0.07)", l: "Total Wholesale Customers", v: String(wholesaleList.length), c: T.luxuryBrown, sub: "Active business relationships" },
          { ico: <AlertTriangle size={24} color={T.crimson} />, bg: T.crimsonBg, l: "Total Outstanding", v: <Money value={paise(0)} />, c: T.crimson, sub: "Across all overdue accounts" },
          { ico: <Eye size={24} color={T.antiqueGold} />, bg: "rgba(200,155,71,0.09)", l: "Active Orders Right Now", v: "0", c: T.antiqueGold, sub: "Bulk orders in production" },
          { ico: <Users size={24} color={T.taupe} />, bg: "rgba(139,112,96,0.08)", l: "Inactive Customers", v: "0", c: T.taupe, sub: "No order in 6+ months" },
        ].map((st, i) => (
          <div key={i} style={{ background: "#FFF", padding: "22px 22px 20px", borderRadius: 14, border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {st.ico}
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>{st.l}</div>
              <div style={{ fontFamily: F.display, fontSize: 30, color: st.c, fontWeight: 700, lineHeight: 1.0 }}>{st.v}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>{st.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 300 }}>
            <SearchInput aria-label="Search by business name, city..." placeholder="Search by business name, city..." />
          </div>
          <Pill active={true}>All Wholesale ({wholesaleList.length})</Pill>
          <Pill active={false}>Active ({wholesaleList.length})</Pill>
          <Pill active={false}>Has Dues (0)</Pill>
          <Pill active={false}>Inactive (0)</Pill>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}>Sort By: Outstanding <ChevronDown size={14} /></span>
          <div style={{ display: "flex", background: "#FFF", borderRadius: 8, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <IconButton icon={LayoutGrid} label="Card view" variant={wholesaleView === "card" ? "secondary" : "ghost"} size="sm" onClick={() => setWholesaleView("card")} className="rounded-none" />
            <IconButton icon={AlignJustify} label="List view" variant={wholesaleView === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setWholesaleView("list")} className="rounded-none border-l" />
            <IconButton icon={TableIcon} label="Table view" variant={wholesaleView === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setWholesaleView("table")} className="rounded-none border-l" />
          </div>
          <DownloadGate>
            <Button variant="tertiary" size="sm" iconLeft={Download}>Download</Button>
          </DownloadGate>
        </div>
      </div>

      {/* Wholesale Cards View */}
      {wholesaleView === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
          {wholesaleList.map((w, i) => {
            return (
              <div key={i} style={{
                background: `linear-gradient(135deg, ${T.warmIvory} 0%, ${T.silkCream} 100%)`,
                borderRadius: 20,
                border: `1.5px solid ${T.borderGold}`,
                boxShadow: "0 10px 28px rgba(74,6,27,0.06)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                minHeight: 300,
                color: T.luxuryBrown,
              }}>
                {/* Subtle Light Card Pattern */}
                <div style={{ position: "absolute", top: "-50%", right: "-30%", width: "100%", height: "100%", background: "radial-gradient(circle, rgba(200,155,71,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

                {/* Card Header: Avatar & Short ID */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${T.royalBurgundy}, ${T.darkBurgundy})`, color: "#FFFDF9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, fontWeight: 700, boxShadow: "0 4px 10px rgba(110,15,45,0.15)" }}>
                      {w.code}
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, letterSpacing: "1px" }}>{w.id}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>EST. {2020 + (i % 5)}</div>
                    </div>
                  </div>
                  {/* Small Gold Chip Icon to mimic a credit card */}
                  <div style={{ width: 34, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${T.goldLight}, ${T.antiqueGold})`, border: "1px solid rgba(255,255,255,0.4)", display: "flex", flexDirection: "column", gap: 3, padding: 4, justifyContent: "center", boxShadow: "0 2px 5px rgba(200,155,71,0.2)" }}>
                    <div style={{ height: 2, background: "rgba(0,0,0,0.15)", borderRadius: 1 }} />
                    <div style={{ height: 2, background: "rgba(0,0,0,0.15)", borderRadius: 1 }} />
                    <div style={{ height: 2, background: "rgba(0,0,0,0.15)", borderRadius: 1 }} />
                  </div>
                </div>

                {/* Card Middle: Firm Name & City */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: 20 }}>
                  <h4 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 6px 0", letterSpacing: "0.5px", lineHeight: 1.25 }}>{w.name}</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.taupe }}>
                    <MapPin size={13} color={T.antiqueGold} />
                    <span style={{ fontFamily: F.ui, fontSize: 13 }}>{w.city}</span>
                  </div>
                </div>

                {/* Card Bottom: GST, Credit Terms & Dues */}
                <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>GSTIN</div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{w.gstNumber || "Unregistered"}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, marginTop: 6, fontWeight: 600 }}>Credit Terms: {w.terms}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Outstanding</div>
                    <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: w.out === "0" ? T.greenMid : T.crimson }}>
                      {w.out === "0" ? "Clear" : formatMoney(rupees(Number(w.out) || 0))}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: w.status === "overdue" ? T.crimson : T.taupe, marginTop: 4, fontWeight: 600 }}>
                      {w.status === "clear" ? "✓ No Dues" : w.status === "overdue" ? "⚠ Overdue" : "◐ Pending"}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  borderTop: `1px solid ${T.borderDef}`,
                  paddingTop: 12,
                }}>
                  <Button onClick={() => onView(w)} variant="secondary" size="sm" iconLeft={Eye} fullWidth>
                    View Profile
                  </Button>
                  <Button onClick={() => onEdit(w)} variant="tertiary" size="sm" iconLeft={Edit}>
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
          <DataTable columns={listColumns} data={wholesaleList} getRowId={w => w.id} emptyTitle="No wholesale customers yet" />
        </div>
      )}

      {/* Wholesale Table View */}
      {wholesaleView === "table" && (
        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflowX: "auto" }}>
          <DataTable columns={tableColumns} data={wholesaleList} getRowId={w => w.id} emptyTitle="No wholesale customers yet" />
        </div>
      )}
    </div>
  );
}
