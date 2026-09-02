import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { useListDetailScroll } from "@/shared/ui/ScrollToTop";
import { BulkOrder, useBulkOrders, resolveOrderMoney } from "@/features/bulk-orders";
import { INVOICES } from "@/features/payments";
import { rupees, formatMoney } from "@/lib/domain/money";
import { DateFilterState, DEFAULT_DATE_FILTER } from "../../../shared/ui/DateFilterBar";
import { BulkOrderDetailPage } from "@/features/bulk-orders";
import { MaterialsFooter } from "@/features/materials";
import { PageHeader, StatsStrip } from "./sections/PageHeaderAndStats";
import { WholesaleDetailSection } from "./sections/wholesaleDetail/WholesaleDetailSection";
import { RetailDetailSection } from "./sections/RetailDetailSection";
import { CustomerAnalyticsSection } from "./sections/CustomerAnalyticsSection";
import { WholesaleCustomersSection } from "./sections/WholesaleCustomersSection";
import { RetailCustomersSection } from "./sections/RetailCustomersSection";
import { InactiveCustomersSection } from "./sections/InactiveCustomersSection";
import { CustomerModals } from "./modals/CustomerModals";
import { monthsSinceLabel } from "./utils";
import { retailData } from "./data";
import type { InactiveCustomerRow } from "./sections/InactiveCustomersSection";
import { WholesaleCustomer, RetailCustomer, WholesaleTab } from "./types";
import { useCustomers } from "../contexts/CustomersContext";
import { useUrlFilters } from "../../../shared/ui/filter";
import { imgVisitingCardPlaceholder } from "@/shared/constants/mockImages";
import { resolveAssetUrl, toStoredAssetPath } from "@/shared/api/uploads";

/**
 * Composition root for the Customers feature (Wholesale + Retail + Analytics
 * + Inactive customers). Originally a single 2,296-line file — split into
 * theme/types/data/utils + common primitives + sections/ (with a
 * wholesaleDetail/ sub-split for the largest profile view) + modals/, all
 * under this same directory. See git history for the pre-split version if
 * you need to trace exactly what moved where.
 */
export function CustomersPage() {
  const location = useLocation();
  const [wholesaleView, setWholesaleView] = useState<"card"|"list"|"table">("table");
  const [retailView, setRetailView] = useState<"card"|"list">("list");
  const [showAddWholesale, setShowAddWholesale] = useState(() => new URLSearchParams(location.search).get("new") === "1");
  const { customers = [], updateCustomer } = useCustomers();
  const { bulkOrders } = useBulkOrders();

  const wholesaleList = React.useMemo(() => {
    const backendWholesale = customers.filter(c => c.type === "WHOLESALE");
    const mapped = backendWholesale.map(c => {
      // Real per-customer aggregates off their actual bulk orders — matched
      // the same way WholesaleDetailSection matches an individual customer's
      // orders (customerId FK, else business-name fallback for older rows
      // created before bulk orders carried a customerId).
      const custOrders = bulkOrders.filter(o =>
        (o.customerId && o.customerId === c.id) || o.customer.toLowerCase() === c.name.toLowerCase()
      );
      const money = custOrders.map(o => resolveOrderMoney(o, INVOICES));
      const billed = money.reduce((a, m) => a + m.amountDue, 0);
      const paid = money.reduce((a, m) => a + m.amountPaid, 0);
      const outstanding = Math.max(0, billed - paid);
      const activeOrder = custOrders.find(o => o.done < o.total) ?? null;

      return {
        id: c.id,
        name: c.name,
        code: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        displayCode: c.code || "",
        city: c.city || "—",
        status: (outstanding > 0 ? "overdue" : "clear") as "overdue" | "clear",
        orders: custOrders.length,
        spend: String(paid),
        out: String(outstanding),
        terms: c.paymentTerms || "30 days",
        // createdDate is the raw ISO createdAt (unlike `due`, which is
        // already formatted for display and not safely sortable as a
        // string), so it's what picks out the most recent order.
        lastOrder: custOrders.length
          ? [...custOrders].sort((a, b) => (b.createdDate ?? "").localeCompare(a.createdDate ?? ""))[0].due
          : (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"),
        activeOrder,
        duesMsg: outstanding > 0 ? `${formatMoney(rupees(outstanding))} outstanding` : "✓ All Payments Clear",
        gstNumber: c.gstCode || "—",
        visitingCard: resolveAssetUrl(c.visitingCardUrl) || imgVisitingCardPlaceholder,
        contactName: c.contactName || "",
        phone: c.phone || "",
        address: c.address || "",
        bankName: c.bankName || "",
        accountNumber: c.accountNumber || "",
        ifscCode: c.ifscCode || "",
        whatsapp: c.whatsapp || "",
        state: c.state || "Andhra Pradesh",
        notes: c.notes || "",
      };
    });
    return mapped;
  }, [customers, bulkOrders]);

  useEffect(() => {
    if (localStorage.getItem("bk_open_add_wholesale") === "true") {
      localStorage.removeItem("bk_open_add_wholesale");
      setShowAddWholesale(true);
      setTimeout(() => {
        const sect = document.getElementById("customers-wholesale-section");
        if (sect) {
          sect.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);
  const [selectedWholesaleCust, setSelectedWholesaleCust] = useState<WholesaleCustomer | null>(null);
  const [wholesaleTab, setWholesaleTab] = useState<WholesaleTab>("Overview");
  const [wholesaleOrderDateFilter, setWholesaleOrderDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [wholesalePaymentDateFilter, setWholesalePaymentDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [retailPurchaseDateFilter, setRetailPurchaseDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [modalWholesale, setModalWholesale] = useState<WholesaleCustomer | null>(null);
  const [modalRetail, setModalRetail] = useState<RetailCustomer | null>(null);
  const [downloadConfirmRetail, setDownloadConfirmRetail] = useState<RetailCustomer | null>(null);
  const [retailModalTab, setRetailModalTab] = useState<"history" | "profile">("history");
  const [viewingCard, setViewingCard] = useState<string | null>(null);
  const [retailOverviewDateFilter, setRetailOverviewDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  // Filter-bar state lives in the URL (design-system/05-OVERLAYS.md Part J) —
  // bookmarkable, shareable, survives refresh, back/forward just works.
  // Public shape below (retailSearch/setRetailSearch/...) is unchanged so
  // RetailCustomersSection/InactiveCustomersSection need zero edits.
  const retailFilters = useUrlFilters({ retailSearch: "", retailStatus: "all", retailCity: "all", retailSort: "spend" });
  const retailSearch = retailFilters.filters.retailSearch;
  const setRetailSearch = (s: string) => retailFilters.setFilter("retailSearch", s);
  const retailStatusFilter = retailFilters.filters.retailStatus as "all" | "regular" | "inactive";
  const setRetailStatusFilter = (s: "all" | "regular" | "inactive") => retailFilters.setFilter("retailStatus", s);
  const retailCityFilter = retailFilters.filters.retailCity;
  const setRetailCityFilter = (s: string) => retailFilters.setFilter("retailCity", s);
  const retailSort = retailFilters.filters.retailSort as "spend" | "purchases" | "recent";
  const setRetailSort = (s: "spend" | "purchases" | "recent") => retailFilters.setFilter("retailSort", s);

  const inactiveFilters = useUrlFilters({ inactiveSearch: "", inactiveType: "all", inactiveCity: "all", inactiveTimeline: "all" });
  const inactiveSearch = inactiveFilters.filters.inactiveSearch;
  const setInactiveSearch = (s: string) => inactiveFilters.setFilter("inactiveSearch", s);
  const inactiveTypeFilter = inactiveFilters.filters.inactiveType as "all" | "Wholesale" | "Retail";
  const setInactiveTypeFilter = (t: "all" | "Wholesale" | "Retail") => inactiveFilters.setFilter("inactiveType", t);
  const inactiveCityFilter = inactiveFilters.filters.inactiveCity;
  const setInactiveCityFilter = (c: string) => inactiveFilters.setFilter("inactiveCity", c);
  const inactiveTimelineFilter = inactiveFilters.filters.inactiveTimeline as "all" | "6" | "8" | "10" | "12";
  const setInactiveTimelineFilter = (t: "all" | "6" | "8" | "10" | "12") => inactiveFilters.setFilter("inactiveTimeline", t);
  const clearInactiveFilters = inactiveFilters.clearAll;
  // Opening a bulk order from a customer's page hands off to the same full order
  // page used from Production / All Orders, so there is one place order details live.
  const [viewingBulkOrder, setViewingBulkOrder] = useState<{ order: BulkOrder; tab: "overview" | "sarees" | "payments" | "quotations" } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { openDetail, backToList } = useListDetailScroll();

  const retailList = React.useMemo(() => {
    const backendRetail = (customers || []).filter(c => c.type === "RETAIL");
    const mapped = backendRetail.map((c, idx) => ({
      id: c.id || `backend-retail-${idx}`,
      name: c.name || "Unnamed Customer",
      initials: (c.name || "C").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      phone: c.phone || "—",
      city: c.city || "—",
      purchases: c.totalPurchases,
      spend: String(c.totalSpend),
      totalSpend: c.totalSpend,
      totalPurchases: c.totalPurchases,
      lastVisit: c.lastPurchaseDate
        ? new Date(c.lastPurchaseDate).toLocaleDateString("en-IN")
        : (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"),
      regular: c.totalPurchases >= 2,
      inactive: c.totalPurchases === 0,
    }));
    return [...mapped, ...retailData];
  }, [customers]);

  const retailCities = React.useMemo(() => Array.from(new Set(retailList.map(r => r.city))).sort(), [retailList]);
  const filteredRetail = React.useMemo(() => {
    return retailList
      .filter(r => {
        const q = retailSearch.trim().toLowerCase();
        const matchSearch = q === "" || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
        const matchStatus = retailStatusFilter === "all" || (retailStatusFilter === "regular" ? r.regular : r.inactive);
        const matchCity = retailCityFilter === "all" || r.city === retailCityFilter;
        return matchSearch && matchStatus && matchCity;
      })
      .sort((a, b) => {
        if (retailSort === "purchases") return b.purchases - a.purchases;
        if (retailSort === "recent") return monthsSinceLabel(a.lastVisit) - monthsSinceLabel(b.lastVisit);
        return parseInt((b.spend || "0").replace(/,/g, ""), 10) - parseInt((a.spend || "0").replace(/,/g, ""), 10);
      });
  }, [retailList, retailSearch, retailStatusFilter, retailCityFilter, retailSort]);

  // Real inactive customers — no order/visit in 6+ months — built from the
  // same live `wholesaleList`/`retailList` aggregates the other sections use,
  // instead of the dead hardcoded `inactiveData` mock.
  const inactiveData: InactiveCustomerRow[] = React.useMemo(() => {
    const wholesaleInactive = wholesaleList
      .filter(w => monthsSinceLabel(w.lastOrder) >= 6)
      .map(w => ({ name: w.name, type: "Wholesale", city: w.city, last: w.lastOrder, spend: w.spend }));
    const retailInactive = retailList
      .filter(r => monthsSinceLabel(r.lastVisit) >= 6)
      .map(r => ({ name: r.name, type: "Retail", city: r.city, last: r.lastVisit, spend: r.spend }));
    return [...wholesaleInactive, ...retailInactive];
  }, [wholesaleList, retailList]);

  const inactiveCities = React.useMemo(() => Array.from(new Set(inactiveData.map(r => r.city))).sort(), [inactiveData]);
  const filteredInactive = React.useMemo(() => {
    return inactiveData
      .filter(r => {
        const q = inactiveSearch.trim().toLowerCase();
        const matchSearch = q === "" || r.name.toLowerCase().includes(q);
        const matchType = inactiveTypeFilter === "all" || r.type === inactiveTypeFilter;
        const matchCity = inactiveCityFilter === "all" || r.city === inactiveCityFilter;
        const months = monthsSinceLabel(r.last);
        const matchTimeline = inactiveTimelineFilter === "all" || months >= parseInt(inactiveTimelineFilter, 10);
        return matchSearch && matchType && matchCity && matchTimeline;
      })
      .sort((a, b) => monthsSinceLabel(b.last) - monthsSinceLabel(a.last));
  }, [inactiveData, inactiveSearch, inactiveTypeFilter, inactiveCityFilter, inactiveTimelineFilter]);

  if (viewingBulkOrder) {
    return (
      <BulkOrderDetailPage
        order={viewingBulkOrder.order}
        initialTab={viewingBulkOrder.tab}
        onBack={() => backToList(() => setViewingBulkOrder(null))}
      />
    );
  }

  return (
    <div style={{ background: "#F7F2EA", minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 0 }}>
      <PageHeader />
      <StatsStrip />

      {selectedWholesaleCust ? (
        <WholesaleDetailSection
          customer={selectedWholesaleCust}
          wholesaleTab={wholesaleTab}
          setWholesaleTab={setWholesaleTab}
          onBack={() => backToList(() => setSelectedWholesaleCust(null))}
          onSave={updated => {
            if (selectedWholesaleCust.id) {
              updateCustomer(selectedWholesaleCust.id, {
                name: updated.name,
                contactName: updated.contactName || undefined,
                city: updated.city,
                phone: updated.phone || undefined,
                address: updated.address || undefined,
                gstCode: updated.gstNumber,
                bankName: updated.bankName || undefined,
                accountNumber: updated.accountNumber || undefined,
                ifscCode: updated.ifscCode || undefined,
                whatsapp: updated.whatsapp || undefined,
                state: updated.state || undefined,
                paymentTerms: updated.terms || undefined,
                notes: updated.notes || undefined,
                // Skip the shared placeholder: it is display-only filler for a
                // customer with no card, not something to persist.
                visitingCardUrl:
                  updated.visitingCard && updated.visitingCard !== imgVisitingCardPlaceholder
                    ? toStoredAssetPath(updated.visitingCard) ?? undefined
                    : undefined,
              });
            }
            setSelectedWholesaleCust(updated);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          }}
          onViewBulkOrder={(order, tab) => openDetail(() => setViewingBulkOrder({ order, tab }))}
          onViewCard={setViewingCard}
          wholesaleOrderDateFilter={wholesaleOrderDateFilter}
          setWholesaleOrderDateFilter={setWholesaleOrderDateFilter}
          wholesalePaymentDateFilter={wholesalePaymentDateFilter}
          setWholesalePaymentDateFilter={setWholesalePaymentDateFilter}
        />
      ) : modalRetail ? (
        <RetailDetailSection
          customer={modalRetail}
          retailModalTab={retailModalTab}
          setRetailModalTab={setRetailModalTab}
          onBack={() => backToList(() => setModalRetail(null))}
          retailPurchaseDateFilter={retailPurchaseDateFilter}
          setRetailPurchaseDateFilter={setRetailPurchaseDateFilter}
        />
      ) : (
        <>
        <div id="cust-wholesale-list">
          <WholesaleCustomersSection
            wholesaleList={wholesaleList}
            wholesaleView={wholesaleView}
            setWholesaleView={setWholesaleView}
            showAddWholesale={showAddWholesale}
            setShowAddWholesale={setShowAddWholesale}
            onView={w => openDetail(() => { setSelectedWholesaleCust(w); setWholesaleTab("Overview"); })}
            onEdit={w => openDetail(() => { setSelectedWholesaleCust(w); setWholesaleTab("Edit Profile"); })}
          />
        </div>

        <div id="cust-retail-list">
          <RetailCustomersSection
            retailView={retailView}
            setRetailView={setRetailView}
            retailOverviewDateFilter={retailOverviewDateFilter}
            setRetailOverviewDateFilter={setRetailOverviewDateFilter}
            retailSearch={retailSearch}
            setRetailSearch={setRetailSearch}
            retailStatusFilter={retailStatusFilter}
            setRetailStatusFilter={setRetailStatusFilter}
            retailCityFilter={retailCityFilter}
            setRetailCityFilter={setRetailCityFilter}
            retailSort={retailSort}
            setRetailSort={setRetailSort}
            retailCities={retailCities}
            filteredRetail={filteredRetail}
            onViewHistory={c => openDetail(() => setModalRetail(c))}
            onDownloadConfirm={setDownloadConfirmRetail}
          />
        </div>

        <div id="cust-analytics">
          <CustomerAnalyticsSection
            analyticsDateFilter={analyticsDateFilter}
            setAnalyticsDateFilter={setAnalyticsDateFilter}
          />
        </div>

        <div id="cust-inactive">
          <InactiveCustomersSection
            inactiveSearch={inactiveSearch}
            setInactiveSearch={setInactiveSearch}
            inactiveTypeFilter={inactiveTypeFilter}
            setInactiveTypeFilter={setInactiveTypeFilter}
            inactiveCityFilter={inactiveCityFilter}
            setInactiveCityFilter={setInactiveCityFilter}
            inactiveTimelineFilter={inactiveTimelineFilter}
            setInactiveTimelineFilter={setInactiveTimelineFilter}
            inactiveCities={inactiveCities}
            filteredInactive={filteredInactive}
            inactiveDataLength={inactiveData.length}
            wholesaleCount={inactiveData.filter(r => r.type === "Wholesale").length}
            retailCount={inactiveData.filter(r => r.type === "Retail").length}
            onClearAllFilters={clearInactiveFilters}
          />
        </div>
        </>
      )}

      <CustomerModals
        modalWholesale={modalWholesale}
        setModalWholesale={setModalWholesale}
        downloadConfirmRetail={downloadConfirmRetail}
        setDownloadConfirmRetail={setDownloadConfirmRetail}
        viewingCard={viewingCard}
        setViewingCard={setViewingCard}
        saveSuccess={saveSuccess}
      />
      <div style={{ marginTop: "auto" }}>
        <MaterialsFooter />
      </div>
    </div>
  );
}
