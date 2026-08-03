import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── BulkOrder Interface ──────────────────────────────────────────────────────
export interface BulkOrder {
  customer: string;
  ref: string;
  due: string;
  status: "on-track" | "at-risk" | "overdue";
  daysLeft?: number;
  overdueBy?: number;
  sareeType: string;
  design: string;
  done: number;
  total: number;
  shortage?: number;
  instructions?: string;
  linkedBatches?: string[];
  createdDate?: string;
  customerId?: string;
  dispatchStatus?: "pending" | "dispatched" | "invoiced";
  dispatchDate?: string;
  invoiceId?: string;
  paymentStatus?: "pending" | "partial" | "paid";
  amountDue?: number;
  amountPaid?: number;
  batches?: string[];
  address?: string;
  phone?: string;
  gstCode?: string;
  visitingCardUrl?: string;
  visitingCardName?: string;
  photoUrls?: string[];
  notes?: string;
  /** Set once someone has physically counted the sarees against this order. */
  tallied?: boolean;
  talliedBy?: string;
  talliedDate?: string;
}

// ─── Initial Data (from ProductionPage BULK_ORDERS) ───────────────────────────
const INITIAL_BULK_ORDERS: BulkOrder[] = [
  { customer: "Lakshmi Silks",          ref: "ORD-2026-041", due: "28 May 2026", status: "on-track",              sareeType: "Self Brocade · SB-001",  design: "BKB-045", done: 76, total: 80,              customerId: "WHL-001", dispatchStatus: "pending", paymentStatus: "pending", address: "12-4-88, Silk Merchants Lane, Hyderabad, TG", phone: "+91 98765 43210", gstCode: "36ABCDE1234F1Z5" },
  { customer: "Padmavathi Textiles",    ref: "ORD-2026-038", due: "25 May 2026", status: "at-risk",  daysLeft: 2,  sareeType: "Heavy Zari · HZ-003",    design: "BKB-031", done: 42, total: 60, shortage: 18, customerId: "WHL-003", dispatchStatus: "pending", paymentStatus: "pending", phone: "+91 91234 56780" },
  { customer: "Vijaya Silk House",      ref: "ORD-2026-035", due: "30 May 2026", status: "on-track",              sareeType: "Plain Silk · PS-002",     design: "BKB-022", done: 28, total: 30,              customerId: "WHL-004", dispatchStatus: "pending", paymentStatus: "pending" },
  { customer: "Narayana Silk Emporium", ref: "ORD-2026-032", due: "20 May 2026", status: "overdue",  overdueBy: 3, sareeType: "Bridal Special · BS-004", design: "BKB-019", done: 18, total: 25, shortage: 7,  customerId: "WHL-002", dispatchStatus: "pending", paymentStatus: "pending" },
  { customer: "Meenakshi Silks",        ref: "ORD-2026-029", due: "05 Jun 2026", status: "on-track",              sareeType: "Self Brocade · SB-001",  design: "BKB-038", done: 15, total: 40,              customerId: "WHL-005", dispatchStatus: "pending", paymentStatus: "pending" },
  { customer: "Kalavathi Exports",      ref: "ORD-2026-027", due: "02 Jun 2026", status: "on-track",              sareeType: "Heavy Zari · HZ-003",    design: "BKB-045", done: 8,  total: 35,              customerId: "WHL-006", dispatchStatus: "pending", paymentStatus: "pending" },
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface BulkOrderContextValue {
  bulkOrders: BulkOrder[];
  addBulkOrder: (order: BulkOrder) => void;
  updateBulkOrder: (ref: string, updates: Partial<BulkOrder>) => void;
  nextOrderRef: string;
  markDispatched: (ref: string, invoiceId?: string) => void;
  recordPayment: (ref: string, amount: number) => void;
  tallyOrder: (ref: string, by: string) => void;
}

const BulkOrderContext = createContext<BulkOrderContextValue | null>(null);

const QUERY_KEY = ["bulkOrders"] as const;

export function BulkOrderProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: bulkOrders = INITIAL_BULK_ORDERS } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => Promise.resolve(INITIAL_BULK_ORDERS),
    initialData: INITIAL_BULK_ORDERS,
  });

  const setBulkOrders = (updater: (prev: BulkOrder[]) => BulkOrder[]) => {
    queryClient.setQueryData<BulkOrder[]>(QUERY_KEY, prev => updater(prev ?? []));
  };

  const addBulkOrderMutation = useMutation({
    mutationFn: (order: BulkOrder) => Promise.resolve(order),
    onSuccess: (order) => setBulkOrders(prev => [order, ...prev]),
  });

  const updateBulkOrderMutation = useMutation({
    mutationFn: (args: { ref: string; updates: Partial<BulkOrder> }) => Promise.resolve(args),
    onSuccess: ({ ref, updates }) =>
      setBulkOrders(prev => prev.map(o => o.ref === ref ? { ...o, ...updates } : o)),
  });

  const markDispatchedMutation = useMutation({
    mutationFn: (args: { ref: string; invoiceId?: string }) => Promise.resolve(args),
    onSuccess: ({ ref, invoiceId }) =>
      setBulkOrders(prev =>
        prev.map(o =>
          o.ref === ref
            ? {
                ...o,
                dispatchStatus: "dispatched" as const,
                dispatchDate: new Date().toISOString().split("T")[0],
                ...(invoiceId ? { invoiceId } : {}),
              }
            : o
        )
      ),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (args: { ref: string; amount: number }) => Promise.resolve(args),
    onSuccess: ({ ref, amount }) =>
      setBulkOrders(prev =>
        prev.map(o => {
          if (o.ref !== ref) return o;
          const newPaid = (o.amountPaid || 0) + amount;
          const due = o.amountDue || 0;
          const paymentStatus: BulkOrder["paymentStatus"] =
            due > 0 && newPaid >= due ? "paid" : newPaid > 0 ? "partial" : "pending";
          return { ...o, amountPaid: newPaid, paymentStatus };
        })
      ),
  });

  const tallyOrderMutation = useMutation({
    mutationFn: (args: { ref: string; by: string }) => Promise.resolve(args),
    onSuccess: ({ ref, by }) =>
      setBulkOrders(prev =>
        prev.map(o =>
          o.ref === ref
            ? { ...o, tallied: true, talliedBy: by, talliedDate: new Date().toISOString().split("T")[0] }
            : o
        )
      ),
  });

  const addBulkOrder = (order: BulkOrder) => addBulkOrderMutation.mutate(order);
  const updateBulkOrder = (ref: string, updates: Partial<BulkOrder>) => updateBulkOrderMutation.mutate({ ref, updates });
  const markDispatched = (ref: string, invoiceId?: string) => markDispatchedMutation.mutate({ ref, invoiceId });
  const recordPayment = (ref: string, amount: number) => recordPaymentMutation.mutate({ ref, amount });
  const tallyOrder = (ref: string, by: string) => tallyOrderMutation.mutate({ ref, by });

  const nextOrderRef = useMemo(() => {
    const allNums = bulkOrders
      .map(o => {
        const m = o.ref.match(/ORD-\d{4}-(\d+)/);
        return m ? parseInt(m[1] ?? "0", 10) : 0;
      })
      .filter(n => n > 0);
    const maxNum = allNums.length > 0 ? Math.max(...allNums) : 41;
    return `ORD-2026-${String(maxNum + 1).padStart(3, "0")}`;
  }, [bulkOrders]);

  return (
    <BulkOrderContext.Provider value={{ bulkOrders, addBulkOrder, updateBulkOrder, nextOrderRef, markDispatched, recordPayment, tallyOrder }}>
      {children}
    </BulkOrderContext.Provider>
  );
}

export function useBulkOrders(): BulkOrderContextValue {
  const ctx = useContext(BulkOrderContext);
  if (!ctx) throw new Error("useBulkOrders must be used inside BulkOrderProvider");
  return ctx;
}
