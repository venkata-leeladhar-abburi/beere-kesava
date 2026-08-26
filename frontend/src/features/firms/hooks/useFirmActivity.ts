import { useQuery } from "@tanstack/react-query";
import { firmsApi, type FirmActivity } from "../../../shared/api/firms";

export const firmActivityKey = (firmId: string) => ["firms", "activity", firmId] as const;

const EMPTY: FirmActivity["totals"] = {
  realizedIncome: 0,
  realizedExpense: 0,
  net: 0,
  pendingIncome: 0,
  pendingExpense: 0,
  quotedPipeline: 0,
};

/**
 * Every document and payment that names this firm — the auto-tracked half of
 * the ledger, fetched alongside the manual FirmFinancialEntry rows the
 * FirmsContext already owns.
 */
export function useFirmActivity(firmId: string | undefined) {
  const query = useQuery({
    queryKey: firmActivityKey(firmId ?? ""),
    queryFn: () => firmsApi.activity(firmId as string),
    enabled: !!firmId,
  });

  return {
    documents: query.data?.documents ?? [],
    payments: query.data?.payments ?? [],
    totals: query.data?.totals ?? EMPTY,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: () => void query.refetch(),
  };
}
