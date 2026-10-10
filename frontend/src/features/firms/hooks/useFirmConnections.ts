import { useQuery } from "@tanstack/react-query";
import { firmsApi } from "../../../shared/api/firms";

export const firmConnectionsKey = (firmId: string) => ["firms", "connections", firmId] as const;

/**
 * The suppliers, vendors and wholesale customers this firm has documents or
 * payments with. Nobody is connected by a setting — a party is here because a
 * purchase, purchase order or invoice was raised under this firm with them.
 */
export function useFirmConnections(firmId: string | undefined) {
  const query = useQuery({
    queryKey: firmConnectionsKey(firmId ?? ""),
    queryFn: () => firmsApi.connections(firmId as string),
    enabled: !!firmId,
  });

  return {
    connections: query.data?.connections ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: () => void query.refetch(),
  };
}
