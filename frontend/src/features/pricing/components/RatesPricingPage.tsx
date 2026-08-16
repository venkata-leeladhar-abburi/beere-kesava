import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { T, F } from "./rates-pricing/theme";
import { MakingChargesSection } from "./rates-pricing/MakingChargesSection";
import { DeductionRatesSection } from "./rates-pricing/DeductionRatesSection";
import { WholesaleTermsSection } from "./rates-pricing/WholesaleTermsSection";
import { JariSettingsSection } from "./rates-pricing/JariSettingsSection";
import { RateHistorySection } from "./rates-pricing/RateHistorySection";
import { SareeTypeCard } from "./rates-pricing/SareeTypeCard";
import type { SareeTypeRecord } from "./rates-pricing/sareeTypeData";
import { ratesApi, backendRateToDisplayRecord } from "../../../shared/api/rates";
import { Button } from "../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { useDataAccess } from "@/shared/ui/domain";

import { Tags, History, TrendingUp, TrendingDown } from "lucide-react";
import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";
const toRecord = backendRateToDisplayRecord;
// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORTS — preserved for external consumers of this module's public API
// ═══════════════════════════════════════════════════════════════════════════
export type { SareeTypeRecord } from "./rates-pricing/sareeTypeData";
export { SareeTypeCard } from "./rates-pricing/SareeTypeCard";
export {
  JARI_BUNS_PER_REEL, JARI_GRAMS_PER_REEL,
  jariToReels, jariFromReels, jariGrams, trimNum,
} from "./rates-pricing/jariUtils";
export type { JariUnit } from "./rates-pricing/jariUtils";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function RatesPricingPage() {
  // Saree types — fetched from the backend; setRates keeps optimistic local edits
  const [rates, setRates] = useState<SareeTypeRecord[]>([]);
  const [viewCard, setViewCard] = useState<SareeTypeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const canSeeCost = useDataAccess("cost");

  function loadRates() {
    setIsLoading(true);
    setIsError(false);
    ratesApi
      .list()
      .then((res) => setRates(res.items.map(toRecord)))
      .catch((err: unknown) => {
        console.error("Failed to load rates", err);
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadRates();
  }, []);

  function persistEdit(code: string, updates: Partial<SareeTypeRecord>) {
    ratesApi
      .update(code, {
        type: updates.type,
        description: updates.description,
        makingCharge: updates.charge !== undefined ? Number(updates.charge) : undefined,
        retailPrice: updates.retail !== undefined ? Number(updates.retail) : undefined,
        wholesalePrice: updates.wholesale !== undefined ? Number(updates.wholesale) : undefined,
        stdWeightG: updates.stdWeight !== undefined ? Number(updates.stdWeight) : undefined,
        warpWeightG: updates.warpWeight !== undefined ? Number(updates.warpWeight) : undefined,
        reshamWeightG: updates.reshamWeight !== undefined ? Number(updates.reshamWeight) : undefined,
        jariWeightG: updates.jariWeight !== undefined ? Number(updates.jariWeight) : undefined,
      })
      .catch((err: unknown) => console.error("Failed to save rate change", err));
  }

  function persistNew(entry: SareeTypeRecord) {
    ratesApi
      .create({
        code: entry.code,
        type: entry.type,
        description: entry.description || undefined,
        makingCharge: Number(entry.charge),
        retailPrice: Number(entry.retail),
        wholesalePrice: Number(entry.wholesale),
        stdWeightG: Number(entry.stdWeight),
        warpWeightG: Number(entry.warpWeight),
        reshamWeightG: Number(entry.reshamWeight),
        jariWeightG: Number(entry.jariWeight),
      })
      .catch((err: unknown) => console.error("Failed to create rate", err));
  }

  return (
    <>
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. PAGE HEADER                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 10 }}>SINCE 1999 · RATES &amp; PRICING</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Rates &amp; Pricing</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 5vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Making Charges</span>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", margin: 0, lineHeight: 1.6 }}>
            Configure making charges, raw material deduction rates, and wholesale payment terms across all saree types. All changes are logged and immutable.
          </p>
        </div>
      </header>

      {/* 2. STATS STRIP */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="px-4 md:px-7 xl:px-14 -mt-8 md:-mt-12 xl:-mt-[72px]"
        style={{ position: "relative", zIndex: 20 }}
      >
        {(() => {
          const hasRates = rates.length > 0;
          const highest = hasRates
            ? rates.reduce((a, b) => (Number(a.charge) >= Number(b.charge) ? a : b))
            : null;
          const lowest = hasRates
            ? rates.reduce((a, b) => (Number(a.charge) <= Number(b.charge) ? a : b))
            : null;
          const mostRecent = hasRates
            ? rates.find((r) => r.changed === "Just now") ?? rates[0]
            : null;
          const statItems = [
            { label: "TOTAL SAREE TYPES", value: String(rates.length), sub: hasRates ? "All with short codes and rates set" : "No saree types configured yet", icon: <Tags size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
            { label: "LAST RATE CHANGE", value: mostRecent ? mostRecent.changed : "—", sub: mostRecent ? `${mostRecent.type} · ${canSeeCost ? formatMoney(rupees(parseInt(mostRecent.charge))) : "••••"}` : "No rate changes yet", icon: <History size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
            { label: "HIGHEST MAKING CHARGE", value: highest ? (canSeeCost ? formatMoney(rupees(parseInt(highest.charge))) : "••••") : "—", sub: highest ? `${highest.type} · ${highest.code}` : "No rates configured yet", icon: <TrendingUp size={20} color="rgba(231,201,131,0.95)" />, highlight: true, goldVal: true },
            { label: "LOWEST MAKING CHARGE", value: lowest ? (canSeeCost ? formatMoney(rupees(parseInt(lowest.charge))) : "••••") : "—", sub: lowest ? `${lowest.type} · ${lowest.code} per saree` : "No rates configured yet", icon: <TrendingDown size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
          ];
          return <LuxuryStatsCard stats={statItems} />;
        })()}
      </motion.div>

      {/* 3. SECTION A — MAKING CHARGE RATES */}
      {isLoading ? (
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96, paddingBottom: 48, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          Loading rate catalog…
        </div>
      ) : isError ? (
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96, paddingBottom: 48 }}>
          <div style={{
            fontFamily: F.ui, fontSize: 14, color: T.crimson,
            background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.22)",
            borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 16,
          }}>
            <span>Failed to load the rate catalog. Please check your connection and try again.</span>
            <Button onClick={loadRates} variant="primary" size="sm">
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <MakingChargesSection
          rates={rates}
          setRates={setRates}
          onView={setViewCard}
          onPersistEdit={persistEdit}
          onPersistNew={persistNew}
        />
      )}

      {/* 4. SECTION B — RAW MATERIAL DEDUCTION RATES */}
      <DeductionRatesSection />

      {/* 5. SECTION C — WHOLESALE PAYMENT TERMS */}
      <WholesaleTermsSection />

      {/* 6. SECTION D — JARI MEASUREMENT SETTINGS */}
      <JariSettingsSection />

      {/* 7. SECTION E — RATE CHANGE HISTORY */}
      <RateHistorySection />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 8. FOOTER                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 md:px-7 xl:px-14" style={{
        background: T.luxuryBrown,
        paddingTop: 32,
        paddingBottom: 32,
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: T.warmCream, marginBottom: 6 }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Rates &amp; Pricing Management
        </div>
      </div>

    </div>

    {/* Saree Type Card Modal */}
    <AnimatePresence>
      {viewCard && (
        <SareeTypeCard sareeType={viewCard} onClose={() => setViewCard(null)} />
      )}
    </AnimatePresence>
    </>
  );
}
