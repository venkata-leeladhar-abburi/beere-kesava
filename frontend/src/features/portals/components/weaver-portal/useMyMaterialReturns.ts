import { useQuery } from "@tanstack/react-query";
import { useAuthGate } from "../../../../contexts/AuthContext";
import {
  BackendMaterialReturnRecord,
  materialReturnsApi,
  OutstandingMaterialGroup,
} from "../../../../shared/api/material-returns";

// A WEAVER token's GET /material-returns and /material-returns/outstanding
// calls are self-scoped server-side (material-returns.controller.ts /
// resolveWeaverScope) — no weaverId needs to be sent, and the response can
// only ever contain this weaver's own records. That's what makes an
// admin-confirmed return (APPROVED, signed) visible here as soon as it
// happens, without a second lookup of who the weaver is.
const MY_RETURNS_KEY = ["materialReturn", "myReturns"] as const;
const MY_RETURNS_OUTSTANDING_KEY = ["materialReturn", "myReturnsOutstanding"] as const;

export interface MyMaterialReturnRecord {
  id: string;
  batchId?: string;
  receivedAt: string;
  status: "pending-signature" | "approved" | "cancelled";
  signatureCaptured: boolean;
  signatureTimestamp?: string;
  signatureUrl?: string;
  notes?: string;
  items: BackendMaterialReturnRecord["items"];
}

function toRecord(r: BackendMaterialReturnRecord): MyMaterialReturnRecord {
  return {
    id: r.id,
    batchId: r.batchId ?? undefined,
    receivedAt: r.receivedAt,
    status: r.status === "PENDING_SIGNATURE" ? "pending-signature" : r.status === "APPROVED" ? "approved" : "cancelled",
    signatureCaptured: r.signatureCaptured,
    signatureTimestamp: r.signatureTimestamp ?? undefined,
    signatureUrl: r.signatureUrl ?? undefined,
    notes: r.notes ?? undefined,
    items: r.items,
  };
}

export function useMyMaterialReturns() {
  const enabled = useAuthGate("weaver");

  const returnsQuery = useQuery({
    queryKey: MY_RETURNS_KEY,
    enabled,
    queryFn: () => materialReturnsApi.list(),
  });

  const outstandingQuery = useQuery<OutstandingMaterialGroup[]>({
    queryKey: MY_RETURNS_OUTSTANDING_KEY,
    enabled,
    queryFn: () => materialReturnsApi.getOutstanding({}),
  });

  const records = (returnsQuery.data?.items ?? []).map(toRecord);
  // Only material admin has confirmed (approved + signed) belongs in the
  // weaver's own view — a still-pending return hasn't been acted on by
  // admin yet and isn't "confirmed".
  const confirmedRecords = records
    .filter(r => r.status === "approved")
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  return {
    confirmedRecords,
    outstanding: outstandingQuery.data ?? [],
    isLoading: returnsQuery.isLoading || outstandingQuery.isLoading,
    isError: returnsQuery.isError || outstandingQuery.isError,
    error: returnsQuery.error ?? outstandingQuery.error,
    refetch: () => {
      void returnsQuery.refetch();
      void outstandingQuery.refetch();
    },
  };
}
