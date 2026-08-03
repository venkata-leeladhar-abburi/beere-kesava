import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Seed historical records so past-month history already has UTR + Firm data
const SEED_PAYMENTS: WeaverPaymentRecord[] = [
  {
    id: "pay-seed-001",
    weaverId: "WV-001",
    weaverName: "Ravi Kumar",
    amountPaid: 6300,
    utrNumber: "UTR202604301122",
    firmName: "Beere Kesava & Brothers Silks",
    paymentDate: "30 Apr 2026",
    uploadedAt: "2026-05-01T09:02:00.000Z",
  },
  {
    id: "pay-seed-002",
    weaverId: "WV-001",
    weaverName: "Ravi Kumar",
    amountPaid: 5040,
    utrNumber: "UTR202603281456",
    firmName: "Beere Kesava & Brothers Silks",
    paymentDate: "28 Mar 2026",
    uploadedAt: "2026-03-29T10:30:00.000Z",
  },
  {
    id: "pay-seed-003",
    weaverId: "WV-001",
    weaverName: "Ravi Kumar",
    amountPaid: 7560,
    utrNumber: "UTR202602271234",
    firmName: "Beere Kesava & Brothers Silks",
    paymentDate: "27 Feb 2026",
    uploadedAt: "2026-02-28T08:15:00.000Z",
  },
];

const QUERY_KEY = ["weaverPayments"] as const;

export function WeaverPaymentsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: payments = SEED_PAYMENTS } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => Promise.resolve(SEED_PAYMENTS),
    initialData: SEED_PAYMENTS,
  });

  const addPaymentsMutation = useMutation({
    mutationFn: (records: WeaverPaymentRecord[]) => Promise.resolve(records),
    onSuccess: (records) => {
      queryClient.setQueryData<WeaverPaymentRecord[]>(QUERY_KEY, prev => {
        const existingUtrs = new Set((prev ?? []).map(p => p.utrNumber));
        const newRecords = records.filter(r => !existingUtrs.has(r.utrNumber));
        return [...newRecords, ...(prev ?? [])];
      });
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
