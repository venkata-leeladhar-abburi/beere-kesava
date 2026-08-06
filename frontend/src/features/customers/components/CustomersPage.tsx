import React, { useState, useEffect } from "react";
import { BulkOrder } from "../../bulk-orders/contexts/BulkOrderContext";
import { DateFilterState, DEFAULT_DATE_FILTER } from "../../../shared/ui/DateFilterBar";
import { BulkOrderDetailPage } from "../../bulk-orders/components/BulkOrderDetailPage";

import { PageHeader, StatsStrip } from "./sections/PageHeaderAndStats";
import { WholesaleDetailSection } from "./sections/wholesaleDetail/WholesaleDetailSection";
import { RetailDetailSection } from "./sections/RetailDetailSection";
import { CustomerAnalyticsSection } from "./sections/CustomerAnalyticsSection";
import { WholesaleCustomersSection } from "./sections/WholesaleCustomersSection";
import { RetailCustomersSection } from "./sections/RetailCustomersSection";
import { InactiveCustomersSection } from "./sections/InactiveCustomersSection";
import { CustomerModals } from "./modals/CustomerModals";
import { monthsSinceLabel } from "./utils";
import { retailData, inactiveData, wholesaleData } from "./data";
import { WholesaleCustomer, RetailCustomer, WholesaleTab } from "./types";
import { useCustomers } from "../contexts/CustomersContext";

/**
 * Composition root for the Customers feature (Wholesale + Retail + Analytics
 * + Inactive customers). Originally a single 2,296-line file — split into
 * theme/types/data/utils + common primitives + sections/ (with a
 * wholesaleDetail/ sub-split for the largest profile view) + modals/, all
 * under this same directory. See git history for the pre-split version if
 * you need to trace exactly what moved where.
 */
export function CustomersPage() {
  const [wholesaleView, setWholesaleView] = useState<"card"|"list"|"table">("card");
  const [retailView, setRetailView] = useState<"card"|"list">("card");
  const [showAddWholesale, setShowAddWholesale] = useState(false);  const { customers = [], updateCustomer } = useCustomers() ?? {};

  const wholesaleList = React.useMemo(() => {
    const backendWholesale = customers.filter(c => c.type === "WHOLESALE");
    const mapped = backendWholesale.map(c => ({
      id: c.id,
      name: c.name,
      code: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      city: c.city || "—",
      status: "clear" as const,
      orders: 0,
      spend: "0",
      out: "0",
      terms: "30 days",
      lastOrder: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
      activeOrder: null,
      duesMsg: "✓ All Payments Clear",
      gstNumber: c.gstCode || "—",
      visitingCard: c.visitingCardUrl || "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=400&fit=crop&q=80",
    }));
    return [...mapped, ...wholesaleData];
  }, [customers]);

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
  const [retailSearch, setRetailSearch] = useState("");
  const [retailStatusFilter, setRetailStatusFilter] = useState<"all" | "regular" | "inactive">("all");
  const [retailCityFilter, setRetailCityFilter] = useState<"all" | string>("all");
  const [retailSort, setRetailSort] = useState<"spend" | "purchases" | "recent">("spend");
  const [inactiveSearch, setInactiveSearch] = useState("");
  const [inactiveTypeFilter, setInactiveTypeFilter] = useState<"all" | "Wholesale" | "Retail">("all");
  const [inactiveCityFilter, setInactiveCityFilter] = useState<"all" | string>("all");
  const [inactiveTimelineFilter, setInactiveTimelineFilter] = useState<"all" | "6" | "8" | "10" | "12">("all");
  // Opening a bulk order from a customer's page hands off to the same full order
  // page used from Production / All Orders, so there is one place order details live.
  const [viewingBulkOrder, setViewingBulkOrder] = useState<{ order: BulkOrder; tab: "overview" | "sarees" | "payments" | "quotations" } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const retailList = React.useMemo(() => {
    const backendRetail = customers.filter(c => c.type === "RETAIL");
    const mapped = backendRetail.map(c => ({
      name: c.name,
      initials: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      phone: c.phone || "—",
      city: c.city || "—",
      purchases: 0,
      spend: "0",
      lastVisit: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—",
      regular: true,
      inactive: false,
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

  const inactiveCities = React.useMemo(() => Array.from(new Set(inactiveData.map(r => r.city))).sort(), []);
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
  }, [inactiveSearch, inactiveTypeFilter, inactiveCityFilter, inactiveTimelineFilter]);

  if (viewingBulkOrder) {
    return (
      <BulkOrderDetailPage
        order={viewingBulkOrder.order}
        initialTab={viewingBulkOrder.tab}
        onBack={() => setViewingBulkOrder(null)}
      />
    );
  }

  return (
    <div style={{ background: "#F7F2EA", minHeight: "100dvh", paddingBottom: 100 }}>
      <PageHeader />
      <StatsStrip />

      {selectedWholesaleCust ? (
        <WholesaleDetailSection
          customer={selectedWholesaleCust}
          wholesaleTab={wholesaleTab}
          setWholesaleTab={setWholesaleTab}
          onBack={() => setSelectedWholesaleCust(null)}
          onSave={updated => {
            if (updateCustomer && selectedWholesaleCust.id) {
              updateCustomer(selectedWholesaleCust.id, {
                name: updated.name,
                city: updated.city,
                gstCode: updated.gstNumber,
              });
            }
            setSelectedWholesaleCust(updated);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          }}
          onViewBulkOrder={(order, tab) => setViewingBulkOrder({ order, tab })}
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
          onBack={() => setModalRetail(null)}
          retailPurchaseDateFilter={retailPurchaseDateFilter}
          setRetailPurchaseDateFilter={setRetailPurchaseDateFilter}
        />
      ) : (
        <>
          <CustomerAnalyticsSection
            analyticsDateFilter={analyticsDateFilter}
            setAnalyticsDateFilter={setAnalyticsDateFilter}
          />

          <WholesaleCustomersSection
            wholesaleList={wholesaleList}
            wholesaleView={wholesaleView}
            setWholesaleView={setWholesaleView}
            showAddWholesale={showAddWholesale}
            setShowAddWholesale={setShowAddWholesale}
            onView={w => { setSelectedWholesaleCust(w); setWholesaleTab("Overview"); }}
            onEdit={w => { setSelectedWholesaleCust(w); setWholesaleTab("Edit Profile"); }}
          />

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
            onViewHistory={setModalRetail}
            onDownloadConfirm={setDownloadConfirmRetail}
          />

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
          />
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
    </div>
  );
}
