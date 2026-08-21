import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, UserPlus, Plus,
  LayoutGrid, AlignJustify, MapPin,
  Phone, Calendar, Star, IndianRupee, AlertTriangle, Users, ShoppingBag,
} from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionCard, Pill, FadeUp } from "../common/primitives";
import { Button, IconButton, Field, Input, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { RetailCustomer } from "../types";
import { RetailChartsRow1, RetailChartsRow2 } from "./RetailCharts";
import { useCustomers } from "../../contexts/CustomersContext";
import { salesApi } from "../../../../shared/api/sales";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill } from "@/shared/ui/domain";

interface RetailFormState {
  name: string;
  phone: string;
  city: string;
  address: string;
}

const EMPTY_RETAIL_FORM: RetailFormState = { name: "", phone: "", city: "", address: "" };

export interface RetailCustomersSectionProps {
  retailView: "card" | "list";
  setRetailView: (v: "card" | "list") => void;
  retailOverviewDateFilter: DateFilterState;
  setRetailOverviewDateFilter: (f: DateFilterState) => void;
  retailSearch: string;
  setRetailSearch: (s: string) => void;
  retailStatusFilter: "all" | "regular" | "inactive";
  setRetailStatusFilter: (s: "all" | "regular" | "inactive") => void;
  retailCityFilter: "all" | string;
  setRetailCityFilter: (s: string) => void;
  retailSort: "spend" | "purchases" | "recent";
  setRetailSort: (s: "spend" | "purchases" | "recent") => void;
  retailCities: string[];
  filteredRetail: RetailCustomer[];
  onViewHistory: (r: RetailCustomer) => void;
  onDownloadConfirm: (r: RetailCustomer) => void;
}

// ── SECTION 5: RETAIL CUSTOMERS ─────────────────────────────────────────────
export function RetailCustomersSection({
  retailView, setRetailView, retailOverviewDateFilter, setRetailOverviewDateFilter,
  retailSearch, setRetailSearch, retailStatusFilter, setRetailStatusFilter,
  retailCityFilter, setRetailCityFilter, retailSort, setRetailSort,
  retailCities, filteredRetail, onViewHistory, onDownloadConfirm,
}: RetailCustomersSectionProps) {
  const { addCustomer, retailCustomers } = useCustomers();
  const [showAddRetail, setShowAddRetail] = useState(false);
  const [form, setForm] = useState<RetailFormState>(EMPTY_RETAIL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-retail-section"],
    queryFn: () => salesApi.list(),
  });

  const updateField = <K extends keyof RetailFormState>(key: K, value: RetailFormState[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const openAddRetail = () => { setForm(EMPTY_RETAIL_FORM); setError(null); setShowAddRetail(true); };
  const closeAddRetail = () => { setShowAddRetail(false); setError(null); };

  const handleSaveRetail = async () => {
    if (!form.name.trim()) { setError("Customer name is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await addCustomer({
        type: "RETAIL",
        name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setShowAddRetail(false);
      setForm(EMPTY_RETAIL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save retail customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const now = useMemo(() => new Date(), []);
  const newThisMonthCount = useMemo(() => {
    return retailCustomers.filter(c => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [retailCustomers, now]);

  const retailSalesThisMonth = useMemo(() => {
    const items = salesRes?.items ?? [];
    return items.filter(s => {
      if (s.channel !== "RETAIL") return false;
      const d = new Date(s.saleDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [salesRes, now]);

  const totalRetailRevenueMonth = useMemo(() => {
    return retailSalesThisMonth.reduce((acc, s) => acc + Number(s.amount), 0);
  }, [retailSalesThisMonth]);

  const inactiveCount = useMemo(() => {
    return filteredRetail.filter(r => r.inactive).length;
  }, [filteredRetail]);

  const retailColumns: ColumnDef<RetailCustomer>[] = [
    {
      id: "name", header: "Customer Name", accessor: r => r.name, priority: 1,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
          {r.name}
          {r.regular && <Star size={12} color="#C89B47" fill="#C89B47" />}
        </div>
      ),
    },
    {
      id: "city", header: "City", accessor: r => r.city, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{r.city}</span>,
    },
    {
      id: "phone", header: "Phone", accessor: r => r.phone, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.taupe }}>{r.phone}</span>,
    },
    {
      id: "totalSpend", header: "Total Spend", accessor: r => r.totalSpend ?? 0, type: "number", sortable: true,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(r.totalSpend ?? 0)} /></span>,
    },
    {
      id: "purchases", header: "Purchases", accessor: r => r.totalPurchases, type: "number", sortable: true,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: T.luxuryBrown }}>{r.totalPurchases} sarees</span>,
    },
    {
      id: "lastVisit", header: "Last Visit", accessor: r => r.lastVisit, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{r.lastVisit}</span>,
    },
    {
      id: "status", header: "Status", accessor: r => r.inactive, type: "status",
      cell: (_v, r) => <StatusPill taxonomy="person" status={r.inactive ? "inactive" : "active"} />,
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Button variant="secondary" size="sm" onClick={() => onViewHistory(r)}>History</Button>
          <DownloadGate>
            <Button variant="tertiary" size="sm" iconLeft={Download} onClick={() => onDownloadConfirm(r)} />
          </DownloadGate>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
    <SectionCard
      icon={ShoppingBag}
      title="Retail Customers"
      subtitle="Browse all retail buyers from the point of sale, view their purchase history, and register new customers."
      actions={
        <Button onClick={openAddRetail} variant="secondary" className="bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white" iconLeft={Plus}>
          Add Retail Customer
        </Button>
      }
    >
      {showAddRetail && (
        <FadeUp>
          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderGold}`, borderRadius: 16, padding: "28px", marginBottom: 28, boxShadow: "0 4px 20px rgba(74,6,27,0.06)" }}>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, marginBottom: 20 }}>+ Register New Retail Customer</div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
              <Field label="Customer Name *">
                <Input value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. Smt. Sunitha Reddy" />
              </Field>
              <Field label="Phone Number *">
                <Input value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="e.g. +91 98765 43210" />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={e => updateField("city", e.target.value)} placeholder="e.g. Dharmavaram" />
              </Field>
              <Field label="Address / Landmark">
                <Input value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="e.g. Main Road, Near Bus Stand" />
              </Field>
            </div>
            {error && (
              <div style={{ marginTop: 20, padding: "10px 14px", background: T.crimsonBg, color: T.crimson, borderRadius: 8, fontFamily: F.ui, fontSize: 13 }}>{error}</div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.borderDef}` }}>
              <Button onClick={closeAddRetail} variant="tertiary" disabled={submitting}>Cancel</Button>
              <Button onClick={handleSaveRetail} variant="primary" disabled={submitting}>{submitting ? "Saving…" : "✓ Save Customer"}</Button>
            </div>
          </div>
        </FadeUp>
      )}

      <div style={{ marginBottom: 24 }}>
        <DateFilterBar filter={retailOverviewDateFilter} onChange={setRetailOverviewDateFilter} />
      </div>

      {/* Retail stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 18, marginBottom: 28, alignItems: "stretch" }}>
        {[
          { ico: <Users size={24} color={T.royalBurgundy} />, bg: "rgba(110,15,45,0.07)", l: "Total Retail Customers", v: retailCustomers.length.toLocaleString("en-IN"), c: T.luxuryBrown, sub: "Profiles at point of sale" },
          { ico: <UserPlus size={24} color={T.antiqueGold} />, bg: "rgba(200,155,71,0.09)", l: "New Customers This Month", v: String(newThisMonthCount), c: T.antiqueGold, sub: "Added via new sale entries" },
          { ico: <IndianRupee size={24} color={T.greenMid} />, bg: T.greenBg, l: "Retail Revenue This Month", v: formatMoney(rupees(totalRetailRevenueMonth)), c: T.greenMid, sub: "Total from all retail sales" },
          { ico: <AlertTriangle size={24} color={T.taupe} />, bg: "rgba(139,112,96,0.08)", l: "Inactive — No Visit in 6M", v: String(inactiveCount), c: T.taupe, sub: "Consider reaching out" },
        ].map((st) => (
          <div key={st.l} style={{ background: "#FFF", padding: "22px 22px 20px", borderRadius: 14, border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
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

      <RetailChartsRow1 />
      <RetailChartsRow2 />

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 300 }}>
            <SearchInput
              value={retailSearch}
              onChange={e => setRetailSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
            />
          </div>
          <Pill active={retailStatusFilter === "all"} onClick={() => setRetailStatusFilter("all")}>All Retail ({filteredRetail.length})</Pill>
          <Pill active={retailStatusFilter === "regular"} onClick={() => setRetailStatusFilter("regular")}>Regular Buyers ({filteredRetail.filter(r => r.regular).length})</Pill>
          <Pill active={retailStatusFilter === "inactive"} onClick={() => setRetailStatusFilter("inactive")}>Inactive ({filteredRetail.filter(r => r.inactive).length})</Pill>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 160 }}>
            <Select value={retailCityFilter} onValueChange={setRetailCityFilter} size="sm" placeholder="All Cities">
              <SelectItem value="all">All Cities</SelectItem>
              {retailCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </div>
          <div style={{ width: 200 }}>
            <Select value={retailSort} onValueChange={v => setRetailSort(v as "spend" | "purchases" | "recent")} size="sm">
              <SelectItem value="spend">Sort: Total Spend</SelectItem>
              <SelectItem value="purchases">Sort: Total Purchases</SelectItem>
              <SelectItem value="recent">Sort: Most Recent Visit</SelectItem>
            </Select>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 999, padding: 3, gap: 2 }}>
            <button
              type="button"
              onClick={() => setRetailView("card")}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 999,
                fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                background: retailView === "card" ? "#6E0F2D" : "transparent",
                color: retailView === "card" ? "#FFFFFF" : T.taupe,
                border: "none",
                boxShadow: retailView === "card" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <LayoutGrid size={15} color={retailView === "card" ? "#FFFFFF" : T.taupe} />
              Card View
            </button>
            <button
              type="button"
              onClick={() => setRetailView("list")}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 999,
                fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                background: retailView === "list" ? "#6E0F2D" : "transparent",
                color: retailView === "list" ? "#FFFFFF" : T.taupe,
                border: "none",
                boxShadow: retailView === "list" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <AlignJustify size={15} color={retailView === "list" ? "#FFFFFF" : T.taupe} />
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table */}
      {filteredRetail.length === 0 ? (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>No retail customers match these filters.</div>
      ) : retailView === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRetail.map(r => (
            <div key={r.id} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 22, boxShadow: "0 2px 12px rgba(74,6,27,0.04)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: T.royalBurgundy, fontWeight: 700 }}>
                    {r.name.replace("Smt. ", "").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.name}</span>
                      {r.regular && <Star size={14} color="#C89B47" fill="#C89B47" />}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} color={T.taupe} /> {r.city}
                    </div>
                  </div>
                </div>
                {r.inactive && (
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.crimson, background: T.crimsonBg, padding: "3px 8px", borderRadius: 6 }}>Inactive</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 10, background: T.silkCream, padding: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const }}>Total Spend</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: T.royalBurgundy, marginTop: 2 }}><Money value={rupees(r.totalSpend ?? 0)} /></div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const }}>Purchases</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: T.luxuryBrown, marginTop: 2 }}>{r.totalPurchases} sarees</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={12} /> {r.phone}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} /> Last visit: {r.lastVisit}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <Button variant="secondary" size="sm" fullWidth onClick={() => onViewHistory(r)}>Purchase History</Button>
                <DownloadGate>
                  <Button variant="tertiary" size="sm" iconLeft={Download} onClick={() => onDownloadConfirm(r)} />
                </DownloadGate>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }} className="w-full overflow-x-auto section-nav-scroll p-2">
          <div className="min-w-[750px]">
            <DataTable
              responsive={false}
              columns={retailColumns}
              data={filteredRetail}
              getRowId={r => r.id}
            />
          </div>
        </div>
      )}
    </SectionCard>
    </div>
  );
}
