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
import { ratesApi, backendRateToDisplayRecord, type BackendRate } from "../../../shared/api/rates";
import { Button } from "../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { useDataAccess } from "@/shared/ui/domain";

import { Tags, History, TrendingUp, TrendingDown } from "lucide-react";
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
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110, flex: "0 0 100%", maxWidth: "100%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · RATES &amp; PRICING</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Rates &amp; Pricing</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Making Charges</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
            Configure making charges, raw material deduction rates, and wholesale payment terms across all saree types. All changes are logged and immutable.
          </p>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. FLOATING STATS STRIP                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]"
        style={{ position: "relative", zIndex: 20 }}
      >
        <div className="grid grid-cols-2 xl:flex" style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
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
            return [
              { label: "TOTAL SAREE TYPES", val: String(rates.length), sub: hasRates ? "All with short codes and rates set" : "No saree types configured yet", hi: false, crimson: false, goldVal: false, Icon: Tags },
              { label: "LAST RATE CHANGE", val: mostRecent ? mostRecent.changed : "—", sub: mostRecent ? `${mostRecent.type} · ${canSeeCost ? formatMoney(rupees(parseInt(mostRecent.charge))) : "••••"}` : "No rate changes yet", hi: false, crimson: false, goldVal: false, Icon: History },
              { label: "HIGHEST MAKING CHARGE", val: highest ? (canSeeCost ? formatMoney(rupees(parseInt(highest.charge))) : "••••") : "—", sub: highest ? `${highest.type} · ${highest.code}` : "No rates configured yet", hi: true, crimson: false, goldVal: true, Icon: TrendingUp },
              { label: "LOWEST MAKING CHARGE", val: lowest ? (canSeeCost ? formatMoney(rupees(parseInt(lowest.charge))) : "••••") : "—", sub: lowest ? `${lowest.type} · ${lowest.code} per saree` : "No rates configured yet", hi: false, crimson: false, goldVal: false, Icon: TrendingDown },
            ];
          })().map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.Icon size={20} color={m.crimson ? "#F47B72" : m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
