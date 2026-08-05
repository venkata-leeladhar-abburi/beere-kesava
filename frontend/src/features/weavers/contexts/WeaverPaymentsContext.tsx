import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BackendWeaverPayment, weaverPaymentsApi } from "../../../shared/api/payments";
import { weaversApi } from "../../../shared/api/weavers";
import { firmsApi } from "../../../shared/api/firms";

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
}

const WeaverPaymentsContext = createContext<WeaverPaymentsContextValue | null>(null);

const QUERY_KEY = ["weaverPayments"] as const;

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

  const { data: payments = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const [paymentsRes, weaversRes, firmsRes] = await Promise.all([
        weaverPaymentsApi.list(),
        weaversApi.list(),
        firmsApi.list(),
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
    },
    onError: (err) => {
      console.error("Failed to record weaver payment(s):", err);
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

  return (
    <WeaverPaymentsContext.Provider value={{ payments, addPayments, getPaymentsForWeaver }}>
      {children}
    </WeaverPaymentsContext.Provider>
  );
}

export function useWeaverPayments(): WeaverPaymentsContextValue {
  const ctx = useContext(WeaverPaymentsContext);
  if (!ctx) throw new Error("useWeaverPayments must be used inside WeaverPaymentsProvider");
  return ctx;
}
