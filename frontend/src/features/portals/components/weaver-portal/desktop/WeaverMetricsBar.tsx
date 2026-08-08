import React from "react";
import { C, F } from "../theme";
import { useBatches } from "../../../../production/contexts/BatchContext";
import { useQc } from "../../../../qc/contexts/QcContext";
import { useWeaverPayments } from "../../../../weavers/contexts/WeaverPaymentsContext";
import { useCurrentWeaver } from "../useCurrentWeaver";

export function WeaverMetricsBar() {
  const { weaverId } = useCurrentWeaver();
  const { batches } = useBatches();
  const { getQcForWeaver } = useQc();
  const { getPaymentsForWeaver } = useWeaverPayments();

  const now = new Date();
  const weaverQcRecords = weaverId ? getQcForWeaver(weaverId) : [];
  const thisMonthQc = weaverQcRecords.filter(q => {
    const d = new Date(q.qcDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const passedCount = weaverQcRecords.filter(q => q.result === "passed").length;
  const qcPassPct = weaverQcRecords.length > 0 ? Math.round((passedCount / weaverQcRecords.length) * 100) : 100;

  const payments = weaverId ? getPaymentsForWeaver(weaverId) : [];
  const thisMonthPayments = payments.filter(p => {
    const d = new Date(p.paymentDate || p.uploadedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const earnedThisMonth = thisMonthPayments.reduce((s, p) => s + p.amountPaid, 0);

  const activeBatchCount = (batches ?? []).filter(
    b => b.status !== "completed" && weaverId && b.rows.some(r => r.weaverId === weaverId)
  ).length;

  const stats = [
    { label: "Active Batches", val: `${activeBatchCount}` },
    { label: "Sarees This Month", val: `${thisMonthQc.length}` },
    { label: "QC Pass Rate", val: `${qcPassPct}%` },
    { label: "Earned This Month", val: `₹${earnedThisMonth.toLocaleString("en-IN")}` },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length},1fr)`, borderBottom: `1px solid ${C.bdr}`, background: C.white }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ padding: "20px 24px", borderRight: i < stats.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
          <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.text, lineHeight: 1 }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}
