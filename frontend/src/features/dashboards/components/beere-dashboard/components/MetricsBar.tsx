import React from 'react';
import { motion } from 'motion/react';
import { T, F, EASE } from '../theme';
import { IcoResourceMgmt, IcoFabricRoll, IcoInvoice, IcoQualityCheck, IcoTruck } from '../ui';
import { AnimatedNumber } from '../ui';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { LuxuryStatsCard, StatItem } from '@/shared/ui/LuxuryStatsCard';

/** Icon set in the same order as the metrics array from useDashboardMetrics */
const ICONS = [
  <IcoResourceMgmt key="resource-mgmt" sz={22} col={T.warmCream} />,
  <IcoFabricRoll   key="fabric-roll"   sz={22} col={T.warmCream} />,
  <IcoInvoice      key="invoice"       sz={22} col={T.warmCream} />,
  <IcoQualityCheck key="quality-check" sz={22} col={T.warmCream} />,
  <IcoTruck        key="truck"         sz={22} col={T.warmCream} />,
];

export function MetricsBar() {
  const { metrics, isLoading, isError } = useDashboardMetrics();

  const statItems: StatItem[] = metrics.map((m, i) => ({
    label: m.label,
    value: isError ? (
      <span style={{ fontSize: 22, opacity: 0.85, color: "#e57373" }}>Error</span>
    ) : isLoading ? (
      <span style={{ fontSize: 28, opacity: 0.45 }}>—</span>
    ) : (
      <AnimatedNumber raw={m.val} />
    ),
    sub: isError ? "Failed to load" : m.sub,
    icon: ICONS[i],
    highlight: m.hi,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      className="px-4 md:px-7 xl:px-12"
      style={{ marginTop: -56, position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}
