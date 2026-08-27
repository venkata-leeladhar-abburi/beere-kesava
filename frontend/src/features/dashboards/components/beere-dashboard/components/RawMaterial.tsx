import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { T, F, EASE } from '../theme';
import { MATS } from '../data.tsx';
import { SectionHeader, FadeUp } from '../ui';
import { rawMaterialsApi } from '../../../../../shared/api/rawMaterials';
import { jariToReels } from '../../../../../shared/lib/weightUnits';

export function RawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: stockRes, isLoading: stockLoading, isError: stockError } = useQuery({
    queryKey: ["raw-material-stock-list"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const stockItems = stockRes?.items ?? [];

  const warpStock = stockItems.filter(i => i.materialType === "WARP").reduce((s, i) => s + Number(i.currentStock), 0);
  const reshamStock = stockItems.filter(i => i.materialType === "RESHAM").reduce((s, i) => s + Number(i.currentStock), 0);
  // Jari stock rows can be recorded in Reels or Buns — sum through a common
  // unit (Reels) rather than adding raw quantities of mismatched units.
  const jariReels = stockItems
    .filter(i => i.materialType === "JARI")
    .reduce((s, i) => s + jariToReels(Number(i.currentStock), i.unit || "Reels"), 0);

  const mats = MATS.map(m => {
    if (m.name === "Warp") return { ...m, stock: `${warpStock} kg in stock` };
    if (m.name === "Resham") return { ...m, stock: `${reshamStock} kg in stock` };
    if (m.name === "Jari") return { ...m, stock: `${jariReels} Reels in stock` };
    return m;
  });

  return (
    <section className="px-4 md:px-7 xl:px-12" style={{ paddingBottom: 72, background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" onAction={() => onNavigate("Materials")} />
      {stockError && (
        <div style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 10, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", fontFamily: F.ui, fontSize: 13, color: "#C0392B" }}>
          Failed to load raw material stock.
        </div>
      )}
      {stockLoading && (
        <div style={{ padding: "12px 0", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Loading stock…</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 28 }}>
        {mats.map((m, i) => (
          <FadeUp key={m.name} delay={i * 0.1} style={{ height: "100%" }}>
            <motion.div
              onClick={() => onNavigate("Materials")}
              initial={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              animate={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              whileHover={{ y: -6, boxShadow: "0px 28px 72px rgba(74,6,27,0.15)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ background: T.warmIvory, borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 180, flexShrink: 0, overflow: "hidden" }}>
                <motion.img
                  src={m.img}
                  alt={m.name}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 4 }}>{m.desc}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: m.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{m.stock}</div>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
