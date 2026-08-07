import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, IndianRupee, TrendingUp, Users } from "lucide-react";

import { weaverPaymentsApi, vendorPaymentsApi, supplierPaymentsApi } from "../../../shared/api/payments";
import { invoicesApi } from "../../../shared/api/invoices";
import { EASE, F, T } from "../theme";
import { AnimCount } from "./common/motion";
import { useMoneyVisible } from "../../../shared/ui/MoneyValue";

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

  const paidToWeavers = (weaverPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amountPaid), 0);
  const totalVendorPayments = (vendorPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const outstandingFromCustomers = (invoicesRes?.items ?? []).reduce(
    (s, inv) => s + (Number(inv.total) - Number(inv.paid)), 0,
  );
  const collectedFromCustomers = (invoicesRes?.items ?? []).reduce((s, inv) => s + Number(inv.paid), 0);
  const netIncome = useMemo(() => {
    const supplierPaid = (supplierPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amount), 0);
    return collectedFromCustomers - totalVendorPayments - supplierPaid - paidToWeavers;
  }, [supplierPaymentsRes, collectedFromCustomers, totalVendorPayments, paidToWeavers]);

  const moneyVisible = useMoneyVisible();
  const fmt = (n: number) => (moneyVisible ? `${n < 0 ? "−" : ""}₹${Math.abs(n).toLocaleString("en-IN")}` : "—");

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 28,
        display: "flex",
        alignItems: "stretch",
        boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 140,
      }}>
        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 22px" }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(245,232,208,0.85)" }}>Loading payment stats…</span>
          </div>
        ) : isError ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "28px 22px" }}>
            <AlertTriangle size={20} color="#F47B72" />
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: "#F47B72" }}>Failed to load payment stats. Please retry.</span>
          </div>
        ) : STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: s.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1,
              padding: "28px 22px",
              backgroundImage: s.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 14,
              position: "relative",
              cursor: "pointer",
            }}
          >
            {/* Icon box */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{
                width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                background: s.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)",
                border: `1px solid ${s.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {s.icon}
            </motion.div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: s.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 48, color: s.gold ? T.goldLight : s.crimson ? "#F47B72" : "#FFFDF9", lineHeight: 1.0, marginBottom: 8 }}>
                <AnimCount raw={s.value} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: s.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                {s.sub}
              </div>
            </div>

            {/* Gold shimmer bar on highlighted cell */}
            {s.hi && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
