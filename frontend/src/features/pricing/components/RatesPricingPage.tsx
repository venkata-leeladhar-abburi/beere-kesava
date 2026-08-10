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

const toRecord = backendRateToDisplayRecord;

const imgRatesHero = "https://images.unsplash.com/photo-1527751171053-6ac5ec50000b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

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
      <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · RATES &amp; PRICING</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Rates &amp; Pricing</h1>
            <span style={{ fontFamily: F.display, fontSize: 30, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Making Charges</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            Configure making charges, raw material deduction rates, and wholesale payment terms across all saree types. All changes are logged and immutable.
          </p>
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
          <img src={imgRatesHero} alt="Saree pricing" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.85)" }} />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. FLOATING STATS STRIP                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
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
              { label: "TOTAL SAREE TYPES", val: String(rates.length), sub: hasRates ? "All with short codes and rates set" : "No saree types configured yet", hi: false, crimson: false, goldVal: false },
              { label: "LAST RATE CHANGE", val: mostRecent ? mostRecent.changed : "—", sub: mostRecent ? `${mostRecent.type} · ${formatMoney(rupees(parseInt(mostRecent.charge)))}` : "No rate changes yet", hi: false, crimson: false, goldVal: false },
              { label: "HIGHEST MAKING CHARGE", val: highest ? formatMoney(rupees(parseInt(highest.charge))) : "—", sub: highest ? `${highest.type} · ${highest.code}` : "No rates configured yet", hi: true, crimson: false, goldVal: true },
              { label: "LOWEST MAKING CHARGE", val: lowest ? formatMoney(rupees(parseInt(lowest.charge))) : "—", sub: lowest ? `${lowest.type} · ${lowest.code} per saree` : "No rates configured yet", hi: false, crimson: false, goldVal: false },
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 3. SECTION A — MAKING CHARGE RATES */}
      {isLoading ? (
        <div style={{ padding: "96px 56px 48px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          Loading rate catalog…
        </div>
      ) : isError ? (
        <div style={{ padding: "96px 56px 48px" }}>
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
      <div style={{
        background: T.luxuryBrown,
        padding: "32px 56px",
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
