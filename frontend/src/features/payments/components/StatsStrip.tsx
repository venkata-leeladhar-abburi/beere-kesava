import { useMemo } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, IndianRupee, TrendingUp, Users } from "lucide-react";

import { weaverPaymentsApi, vendorPaymentsApi, supplierPaymentsApi } from "../../../shared/api/payments";
import { invoicesApi } from "../../../shared/api/invoices";
import { EASE } from "../theme";
import { AnimCount } from "./common/motion";
import { useMoneyVisible } from "../../../shared/ui/MoneyValue";
import { rupees, formatMoney } from "@/lib/domain/money";
import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";

export function StatsStrip() {
  // Same live data sources as PaymentAnalyticsSection.tsx: weaver/vendor/
  // supplier payments and invoices, all fetched all-time (the backend has
  // no "this month" filter on these endpoints).
  const { data: weaverPaymentsRes, isLoading: weaverPaymentsLoading, isError: weaverPaymentsError } = useQuery({
    queryKey: ["analytics-weaver-payments"],
    queryFn: () => weaverPaymentsApi.list(),
  });
  const { data: vendorPaymentsRes, isLoading: vendorPaymentsLoading, isError: vendorPaymentsError } = useQuery({
    queryKey: ["analytics-vendor-payments"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const { data: supplierPaymentsRes, isLoading: supplierPaymentsLoading, isError: supplierPaymentsError } = useQuery({
    queryKey: ["analytics-supplier-payments"],
    queryFn: () => supplierPaymentsApi.list(),
  });
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError } = useQuery({
    queryKey: ["analytics-invoices"],
    queryFn: () => invoicesApi.list(),
  });

  const isLoading = weaverPaymentsLoading || vendorPaymentsLoading || supplierPaymentsLoading || invoicesLoading;
  const isError = weaverPaymentsError || vendorPaymentsError || supplierPaymentsError || invoicesError;

  const paidToWeavers = (weaverPaymentsRes?.items ?? []).reduce((s, p) => s + (Number(p?.amountPaid) || 0), 0);
  const totalVendorPayments = (vendorPaymentsRes?.items ?? []).reduce((s, p) => s + (Number(p?.amount) || 0), 0);
  const outstandingFromCustomers = (invoicesRes?.items ?? []).reduce(
    (s, inv) => s + ((Number(inv?.total) || 0) - (Number(inv?.paid) || 0)), 0,
  );
  const collectedFromCustomers = (invoicesRes?.items ?? []).reduce((s, inv) => s + (Number(inv?.paid) || 0), 0);
  const netIncome = useMemo(() => {
    const supplierPaid = (supplierPaymentsRes?.items ?? []).reduce((s, p) => s + (Number(p?.amount) || 0), 0);
    return collectedFromCustomers - totalVendorPayments - supplierPaid - paidToWeavers;
  }, [supplierPaymentsRes, collectedFromCustomers, totalVendorPayments, paidToWeavers]);

  const moneyVisible = useMoneyVisible();
  // Until every source has answered, each figure below would total to ₹0 — a
  // number the reader has no reason to disbelieve. `isLoading`/`isError` were
  // already derived here but never consulted, so that is exactly what the strip
  // used to show while its four queries were still in flight.
  const fmt = (n: number) => {
    if (isError) return "—";
    if (isLoading) return "…";
    return moneyVisible ? formatMoney(rupees(n), { compact: true }) : "—";
  };

  const STATS = [
    {
      label: "Paid to Weavers",
      value: fmt(paidToWeavers),
      sub: "Making charges",
      hi: false, gold: false, crimson: false,
      icon: <Users size={22} color="rgba(245,232,208,0.90)" />,
    },
    {
      label: "Outstanding from Customers",
      value: fmt(outstandingFromCustomers),
      sub: "Invoices yet to be collected",
      hi: false, gold: false, crimson: true,
      icon: <AlertTriangle size={22} color="#F47B72" />,
    },
    {
      label: "Collected from Customers",
      value: fmt(collectedFromCustomers),
      sub: "Payments received",
      hi: true, gold: true, crimson: false,
      icon: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />,
    },
    {
      label: "Paid to Vendors",
      value: fmt(totalVendorPayments),
      sub: "Raw material purchases",
      hi: false, gold: false, crimson: false,
      icon: <FileText size={22} color="rgba(245,232,208,0.90)" />,
    },
    {
      label: "Net Income (All-Time)",
      value: fmt(netIncome),
      sub: "After all payments made",
      hi: false, gold: true, crimson: false,
      icon: <TrendingUp size={22} color="rgba(231,201,131,0.95)" />,
    },
  ];

  const statItems = STATS.map(s => ({
    label: s.label,
    value: <AnimCount raw={s.value} />,
    sub: s.sub,
    icon: s.icon,
    highlight: s.hi,
    crimson: s.crimson,
    goldVal: s.gold,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}
