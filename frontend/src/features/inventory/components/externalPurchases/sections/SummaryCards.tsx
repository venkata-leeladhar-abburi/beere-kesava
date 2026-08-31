import { ShoppingCart, Tag, FileText, Calendar } from "lucide-react";
import { Purchase } from "@/features/suppliers";
import { LuxuryStatsCard } from "@/shared/ui/LuxuryStatsCard";

/** Floating stat strip — total purchases, sarees tagged, pending payments, this month. */
export function SummaryCards({ purchases, totalSarees }: { purchases: Purchase[]; totalSarees: number }) {
  const statItems = [
    { label: "TOTAL PURCHASES", value: String(purchases.length), sub: "All time across all entries", icon: <ShoppingCart size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "TOTAL SAREES TAGGED", value: String(totalSarees), sub: "Barcodes generated", icon: <Tag size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "PENDING PAYMENTS", value: String(purchases.filter((p) => p.status !== "Paid").length), sub: "Entries awaiting payment", icon: <FileText size={20} color="rgba(245,232,208,0.90)" />, highlight: true },
    { label: "THIS MONTH", value: String(purchases.length), sub: "New entries this month", icon: <Calendar size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-14 -mt-6 md:-mt-8 xl:-mt-[40px]" style={{ zIndex: 20, position: "relative" }}>
      <LuxuryStatsCard stats={statItems} />
    </div>
  );
}
