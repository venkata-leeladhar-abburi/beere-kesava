import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ratesApi, backendRateToDisplayRecord } from "../../../shared/api/rates";
import { useAuthGate } from "../../../contexts/AuthContext";
import type { SareeTypeRecord } from "../components/rates-pricing/sareeTypeData";

interface RatesContextValue {
  rates: SareeTypeRecord[];
  isLoading: boolean;
  isError: boolean;
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined;
  getSareeTypeByName: (name: string) => SareeTypeRecord | undefined;
  refreshRates: () => void;
}

const RatesContext = createContext<RatesContextValue | undefined>(undefined);

export function RatesProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<SareeTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  // GET /rates carries no role restriction on the backend (rates.controller.ts) —
  // WORKER needs it too, since Worker Staff's saree-receive screen
  // (MaterialSplitPanel) reads rate cards to auto-split warp/resham/jari, and
  // WEAVER needs it since the weaver portal's Gross Charge metric
  // (useWeaverDashboardMetrics) looks up each produced saree's making charge
  // by type code. This provider mounts above the router, so without a gate
  // at all it fired on /login before anyone had a token and 401'd; the gate
  // must include every role that legitimately reads rate data, not just the
  // ones that can edit it (accountant/admin/superadmin still own mutations,
  // per the RequireRoles on POST/PATCH in rates.controller.ts).
  const canReadRates = useAuthGate("accountant", "admin", "superadmin", "worker", "weaver");

  function loadRates() {
    setIsLoading(true);
    setIsError(false);
    ratesApi
      .list()
      .then((res) => setRates(res.items.map(backendRateToDisplayRecord)))
      .catch((err: unknown) => {
        console.error("Failed to load rates", err);
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (!canReadRates) {
      // Not a skeleton forever: with no permission to read rates there is
      // nothing coming, so consumers get an empty-but-settled state.
      setIsLoading(false);
      return;
    }
    loadRates();
  }, [canReadRates]);

  const getSareeTypeByCode = (code: string) => rates.find((r) => r.code === code);
  const getSareeTypeByName = (name: string) => rates.find((r) => r.type === name);

  return (
    <RatesContext.Provider
      value={{
        rates,
        isLoading,
        isError,
        getSareeTypeByCode,
        getSareeTypeByName,
        refreshRates: loadRates,
      }}
    >
      {children}
    </RatesContext.Provider>
  );
}

export function useRatesPricing() {
  const context = useContext(RatesContext);
  if (!context) {
    throw new Error("useRatesPricing must be used within a RatesProvider");
  }
  return context;
}
