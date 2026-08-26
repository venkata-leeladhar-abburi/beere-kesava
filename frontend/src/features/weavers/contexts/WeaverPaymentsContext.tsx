import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackendWeaverPayment, weaverPaymentsApi, WeaverEarnings } from "../../../shared/api/payments";
import { weaversApi } from "../../../shared/api/weavers";
import { firmsApi, BackendFirm } from "../../../shared/api/firms";
import { useAuth } from "../../../contexts/AuthContext";

export interface WeaverPaymentRecord {
  id: string;
  weaverId: string;
  weaverName: string;
  amountPaid: number;
  utrNumber: string;
  firmName: string;
  paymentDate: string;
  uploadedAt: string;

  // New ledger fields
  batchNo?: string;
  loomNumber?: string;
  noOfSarees?: number;
  amount?: number;
  deduction?: number;
}

interface WeaverPaymentsContextValue {
  payments: WeaverPaymentRecord[];
  addPayments: (records: WeaverPaymentRecord[]) => void;
  getPaymentsForWeaver: (weaverId: string) => WeaverPaymentRecord[];
  // Amount owed per weaver, computed server-side from QC-passed sarees x the
  // real saree-type making charge — not a client-side estimate.
  earnings: WeaverEarnings[];
  getEarningsForWeaver: (weaverId: string) => WeaverEarnings | undefined;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

const WeaverPaymentsContext = createContext<WeaverPaymentsContextValue | null>(null);

const QUERY_KEY = ["weaverPayments"] as const;
const EARNINGS_QUERY_KEY = ["weaverEarnings"] as const;

function backendPaymentToFrontend(
  p: BackendWeaverPayment,
  weaverLookup: Map<string, string>,
  firmLookup: Map<string, string>,
): WeaverPaymentRecord {
  return {
    id: p.id,
    weaverId: p.weaverId,
    weaverName: weaverLookup.get(p.weaverId) ?? "Unknown Weaver",
    amountPaid: Number(p.amountPaid),
    utrNumber: p.utrNumber ?? "",
    firmName: (p.firmId ? firmLookup.get(p.firmId) : undefined) ?? "",
    paymentDate: new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    uploadedAt: p.uploadedAt,
    batchNo: p.batchNo ?? undefined,
    loomNumber: p.loomNumber ?? undefined,
    noOfSarees: p.noOfSarees ?? undefined,
    deduction: p.deduction ? Number(p.deduction) : undefined,
  };
}

export function WeaverPaymentsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // firmsApi is ACCOUNTANT-only — a WEAVER caller always 403s there. Firm
  // name is a cosmetic label on the payment row, not core data, so skip the
  // call entirely for non-accountant roles rather than firing a guaranteed
  // 403 just to fall back to an empty lookup.
  const { role } = useAuth();
  const canReadFirms = role === "accountant" || role === "admin" || role === "superadmin";

  const { data: payments = [], isError, error, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const [paymentsRes, weaversRes, firmsRes] = await Promise.all([
        weaverPaymentsApi.list(),
        weaversApi.list(),
        canReadFirms ? firmsApi.list().catch(() => ({ items: [] as BackendFirm[] })) : Promise.resolve({ items: [] as BackendFirm[] }),
      ]);
      const weaverLookup = new Map(weaversRes.items.map(w => [w.id, w.name]));
      const firmLookup = new Map(firmsRes.items.map(f => [f.id, f.firmName]));
      return paymentsRes.items.map(p => backendPaymentToFrontend(p, weaverLookup, firmLookup));
    },
  });

  // NOTE(known gap): this expects records already keyed by a real backend
  // Weaver UUID. WeaversPage.tsx/AllWeaversPage.tsx (the directory pages
  // these ids would normally come from) still run on static WV-XXX mock
  // data and haven't been wired to weaversApi yet — until that happens,
  // callers passing those fake ids will get a real 404 from the backend
  // rather than a silently-accepted fake payment.
  const addPaymentsMutation = useMutation({
    mutationFn: async (records: WeaverPaymentRecord[]) => {
      await Promise.all(
        records.map(r =>
          weaverPaymentsApi.create({
            weaverId: r.weaverId,
            amountPaid: r.amountPaid,
            utrNumber: r.utrNumber || undefined,
            paymentDate: r.paymentDate || undefined,
            batchNo: r.batchNo,
            loomNumber: r.loomNumber,
            noOfSarees: r.noOfSarees,
            deduction: r.deduction,
          }),
        ),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Weaver payment recorded");
    },
    onError: (err) => {
      console.error("Failed to record weaver payment(s):", err);
      toast.error(err instanceof Error ? err.message : "Failed to record weaver payment");
    },
  });

  const addPayments = (records: WeaverPaymentRecord[]) => addPaymentsMutation.mutate(records);

  const getPaymentsForWeaver = useMemo(() => {
    const byWeaver = new Map<string, WeaverPaymentRecord[]>();
    for (const p of payments) {
      const list = byWeaver.get(p.weaverId);
      if (list) list.push(p);
      else byWeaver.set(p.weaverId, [p]);
    }
    return (weaverId: string) => byWeaver.get(weaverId) ?? [];
  }, [payments]);

  const { data: earnings = [] } = useQuery({
    queryKey: EARNINGS_QUERY_KEY,
    queryFn: () => weaverPaymentsApi.earnings(),
  });

  const getEarningsForWeaver = useMemo(() => {
    const byWeaver = new Map(earnings.map(e => [e.weaverId, e]));
    return (weaverId: string) => byWeaver.get(weaverId);
  }, [earnings]);

  return (
    <WeaverPaymentsContext.Provider value={{ payments, addPayments, getPaymentsForWeaver, earnings, getEarningsForWeaver, isError, error, isLoading, refetch: () => void refetch() }}>
      {children}
    </WeaverPaymentsContext.Provider>
  );
}

const FALLBACK_WEAVER_PAYMENTS: WeaverPaymentsContextValue = {
  payments: [],
  addPayments: () => {},
  getPaymentsForWeaver: () => [],
  earnings: [],
  getEarningsForWeaver: () => undefined,
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useWeaverPayments(): WeaverPaymentsContextValue {
  const ctx = useContext(WeaverPaymentsContext);
  return ctx ?? FALLBACK_WEAVER_PAYMENTS;
}
