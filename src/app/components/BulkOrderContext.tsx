import React, { createContext, useContext, useState, useCallback } from "react";

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
  address?: string;
  phone?: string;
  gstCode?: string;
  visitingCardUrl?: string;
  visitingCardName?: string;
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
}

const BulkOrderContext = createContext<BulkOrderContextValue | null>(null);

export function BulkOrderProvider({ children }: { children: React.ReactNode }) {
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>(INITIAL_BULK_ORDERS);

  const addBulkOrder = useCallback((order: BulkOrder) => {
    setBulkOrders(prev => [order, ...prev]);
  }, []);

  const updateBulkOrder = useCallback((ref: string, updates: Partial<BulkOrder>) => {
    setBulkOrders(prev =>
      prev.map(o => o.ref === ref ? { ...o, ...updates } : o)
    );
  }, []);

  const markDispatched = useCallback((ref: string, invoiceId?: string) => {
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
    );
  }, []);

  const recordPayment = useCallback((ref: string, amount: number) => {
    setBulkOrders(prev =>
      prev.map(o => {
        if (o.ref !== ref) return o;
        const newPaid = (o.amountPaid || 0) + amount;
        const due = o.amountDue || 0;
        const paymentStatus: BulkOrder["paymentStatus"] =
          due > 0 && newPaid >= due ? "paid" : newPaid > 0 ? "partial" : "pending";
        return { ...o, amountPaid: newPaid, paymentStatus };
      })
    );
  }, []);

  // Compute next order ref
  const allNums = bulkOrders
    .map(o => {
      const m = o.ref.match(/ORD-\d{4}-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);
  const maxNum = allNums.length > 0 ? Math.max(...allNums) : 41;
  const nextOrderRef = `ORD-2026-${String(maxNum + 1).padStart(3, "0")}`;

  return (
    <BulkOrderContext.Provider value={{ bulkOrders, addBulkOrder, updateBulkOrder, nextOrderRef, markDispatched, recordPayment }}>
      {children}
    </BulkOrderContext.Provider>
  );
}

export function useBulkOrders(): BulkOrderContextValue {
  const ctx = useContext(BulkOrderContext);
  if (!ctx) throw new Error("useBulkOrders must be used inside BulkOrderProvider");
  return ctx;
}
