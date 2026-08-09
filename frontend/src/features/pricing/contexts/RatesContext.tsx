import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ratesApi, backendRateToDisplayRecord } from "../../../shared/api/rates";
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
    loadRates();
  }, []);

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
