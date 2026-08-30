import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, UserPlus, Plus,
  LayoutGrid, AlignJustify, MapPin,
  Calendar, Star, IndianRupee, AlertTriangle, Users, ShoppingBag,
} from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionCard, Pill, FadeUp } from "../common/primitives";
import { Button, Field, Input, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { RetailCustomer } from "../types";
import { RetailChartsRow1, RetailChartsRow2 } from "./RetailCharts";
import { useCustomers } from "../../contexts/CustomersContext";
import { salesApi } from "../../../../shared/api/sales";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill } from "@/shared/ui/domain";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";

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
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 22, marginTop: 32, marginBottom: 28, alignItems: "stretch" }}>
        {[
          {
            icon: <Users size={22} color={T.antiqueGold} />,
            label: "Total Retail Customers",
            value: retailCustomers.length.toLocaleString("en-IN"),
            sub: "Profiles at point of sale",
            gid: "trc",
          },
          {
            icon: <UserPlus size={22} color={T.antiqueGold} />,
            label: "New Customers This Month",
            value: String(newThisMonthCount),
            sub: "Added via new sale entries",
            gid: "ncm",
          },
          {
            icon: <IndianRupee size={22} color={T.antiqueGold} />,
            label: "Retail Revenue This Month",
            value: formatMoney(rupees(totalRetailRevenueMonth)),
            sub: "Total from all retail sales",
            gid: "rrm",
          },
          {
            icon: <AlertTriangle size={22} color={T.antiqueGold} />,
            label: "Inactive — No Visit in 6M",
            value: String(inactiveCount),
            sub: "Consider reaching out",
            gid: "inr",
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

      <RetailChartsRow1 />
      <RetailChartsRow2 />

      {/* Mobile Flipkart-style Collapsible Filter Bar */}
      <div className="md:hidden bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs mb-4">
        <MobileFilterBar
          search={retailSearch}
          onSearchChange={setRetailSearch}
          searchPlaceholder="Search customer name or phone..."
          filterGroups={[
            {
              id: "status",
              label: "Status",
              value: retailStatusFilter,
              defaultValue: "all",
              options: [
                { value: "all", label: `All Retail (${filteredRetail.length})` },
                { value: "regular", label: `Regular Buyers (${filteredRetail.filter(r => r.regular).length})` },
                { value: "inactive", label: `Inactive (${filteredRetail.filter(r => r.inactive).length})` },
              ],
              onChange: (v: string) => setRetailStatusFilter(v as any),
            },
            {
              id: "city",
              label: "City",
              value: retailCityFilter,
              defaultValue: "all",
              options: [
                { value: "all", label: "All Cities" },
                ...retailCities.map(c => ({ value: c, label: c })),
              ],
              onChange: setRetailCityFilter,
            },
            {
              id: "sort",
              label: "Sort By",
              value: retailSort,
              defaultValue: "spend",
              options: [
                { value: "spend", label: "Sort: Total Spend" },
                { value: "purchases", label: "Sort: Total Purchases" },
                { value: "recent", label: "Sort: Most Recent Visit" },
              ],
              onChange: (v: string) => setRetailSort(v as any),
            },
          ]}
          onResetAll={() => {
            setRetailSearch("");
            setRetailStatusFilter("all");
            setRetailCityFilter("all");
            setRetailSort("spend");
          }}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-col gap-5 mb-6">
        {/* Top row: search + sort/filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search bar */}
          <div className="w-full md:w-[280px] lg:w-[400px] relative">
            <SearchInput
              aria-label="Search by customer name or phone"
              value={retailSearch}
              onChange={e => setRetailSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
            />
          </div>
          
          {/* Right side: Selects */}
          <div className="flex flex-wrap gap-3 items-center justify-between md:justify-end w-full md:w-auto">
            <div className="w-full sm:w-[160px]">
              <Select value={retailCityFilter} onValueChange={setRetailCityFilter} size="sm" placeholder="All Cities">
                <SelectItem value="all">All Cities</SelectItem>
                {retailCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </Select>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={retailSort} onValueChange={v => setRetailSort(v as "spend" | "purchases" | "recent")} size="sm">
                <SelectItem value="spend">Sort: Total Spend</SelectItem>
                <SelectItem value="purchases">Sort: Total Purchases</SelectItem>
                <SelectItem value="recent">Sort: Most Recent Visit</SelectItem>
              </Select>
            </div>
          </div>
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center">
            <Pill active={retailStatusFilter === "all"} onClick={() => setRetailStatusFilter("all")}>All Retail ({filteredRetail.length})</Pill>
            <Pill active={retailStatusFilter === "regular"} onClick={() => setRetailStatusFilter("regular")}>Regular Buyers ({filteredRetail.filter(r => r.regular).length})</Pill>
            <Pill active={retailStatusFilter === "inactive"} onClick={() => setRetailStatusFilter("inactive")}>Inactive ({filteredRetail.filter(r => r.inactive).length})</Pill>
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
            <div key={r.id} style={{
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

              {/* Card Header */}
              <div style={{ padding: "20px 22px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.royalBurgundy, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, border: `3px solid ${T.antiqueGold}`, flexShrink: 0 }}>
                    {r.name.replace("Smt. ", "").substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 700, lineHeight: 1.2 }}>{r.name}</div>
                      {r.regular && <Star size={16} color="#C89B47" fill="#C89B47" />}
                    </div>
                    {r.inactive && (
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.crimson, background: T.crimsonBg, padding: "3px 8px", borderRadius: 6, display: "inline-block", marginBottom: 3 }}>Inactive</span>
                    )}
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{r.phone}</div>
                  </div>
                </div>
              </div>

              {/* Card Middle: Info */}
              <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPin size={20} color={T.royalBurgundy} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Location</div>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.city}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingBag size={20} color={T.royalBurgundy} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Purchase History</div>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 2 }}>{r.totalPurchases} sarees</div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.45 }}>Total Spend: <Money value={rupees(r.totalSpend ?? 0)} /></div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={20} color={T.royalBurgundy} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Last Visit</div>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.lastVisit}</div>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12 }}>
                <Button variant="secondary" className="flex-1 rounded-xl shadow-none border-[#E8DCC4] hover:bg-[#F7F2EA] hover:border-[#D4C3A3] text-[#4A2B1D]" onClick={() => onViewHistory(r)}>
                  <LayoutGrid size={20} className="mr-2" />
                  History
                </Button>
                <DownloadGate>
                  <Button variant="secondary" className="flex-none rounded-xl shadow-none border-[#E8DCC4] hover:bg-[#F7F2EA] hover:border-[#D4C3A3] text-[#4A2B1D] px-3" onClick={() => onDownloadConfirm(r)}>
                    <Download size={20} />
                  </Button>
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
              pagination
            />
          </div>
        </div>
      )}
    </SectionCard>
    </div>
  );
}
