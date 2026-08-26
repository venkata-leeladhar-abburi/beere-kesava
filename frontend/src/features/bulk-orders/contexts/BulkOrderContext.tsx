import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BackendBulkOrder,
  BackendBulkOrderStatus,
  BackendDispatchStatus,
  BackendOrderPaymentStatus,
  bulkOrdersApi,
} from "../../../shared/api/bulk-orders";
import { customersApi } from "../../../shared/api/customers";
import { useRatesPricing } from "@/features/pricing";
import { type SareeTypeRecord } from "@/features/pricing";
import { resolveAssetUrl, toStoredAssetPath } from "../../../shared/api/uploads";

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

// ─── Backend <-> frontend enum mapping ─────────────────────────────────────────
const STATUS_TO_BACKEND: Record<BulkOrder["status"], BackendBulkOrderStatus> = {
  "on-track": "ON_TRACK", "at-risk": "AT_RISK", overdue: "OVERDUE",
};
const STATUS_FROM_BACKEND: Record<BackendBulkOrderStatus, BulkOrder["status"]> = {
  ON_TRACK: "on-track", AT_RISK: "at-risk", OVERDUE: "overdue",
};
const DISPATCH_STATUS_FROM_BACKEND: Record<BackendDispatchStatus, NonNullable<BulkOrder["dispatchStatus"]>> = {
  PENDING: "pending", DISPATCHED: "dispatched", INVOICED: "invoiced",
};
const PAYMENT_STATUS_TO_BACKEND: Record<NonNullable<BulkOrder["paymentStatus"]>, BackendOrderPaymentStatus> = {
  pending: "PENDING", partial: "PARTIAL", paid: "PAID",
};
const PAYMENT_STATUS_FROM_BACKEND: Record<BackendOrderPaymentStatus, NonNullable<BulkOrder["paymentStatus"]>> = {
  PENDING: "pending", PARTIAL: "partial", PAID: "paid",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function backendOrderToFrontend(
  o: BackendBulkOrder,
  customerLookup: Map<string, string>,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): BulkOrder {
  const due = new Date(o.dueDate);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((due.getTime() - now.getTime()) / dayMs);

  return {
    customer: customerLookup.get(o.customerId) ?? "Unknown Customer",
    ref: o.ref,
    due: formatDate(o.dueDate),
    status: STATUS_FROM_BACKEND[o.status],
    daysLeft: o.status === "AT_RISK" && diffDays >= 0 ? diffDays : undefined,
    overdueBy: o.status === "OVERDUE" && diffDays < 0 ? Math.abs(diffDays) : undefined,
    sareeType: o.sareeTypeCode
      ? `${getSareeTypeByCode(o.sareeTypeCode)?.type ?? o.sareeTypeCode} · ${o.sareeTypeCode}`
      : "—",
    design: o.designCode ?? "",
    done: o.done,
    total: o.total,
    shortage: o.shortage || undefined,
    createdDate: o.createdDate,
    customerId: o.customerId,
    dispatchStatus: DISPATCH_STATUS_FROM_BACKEND[o.dispatchStatus],
    paymentStatus: PAYMENT_STATUS_FROM_BACKEND[o.paymentStatus],
    amountDue: Number(o.amountDue),
    amountPaid: Number(o.amountPaid),
    address: o.address ?? undefined,
    phone: o.phone ?? undefined,
    gstCode: o.gstCode ?? undefined,
    visitingCardUrl: resolveAssetUrl(o.visitingCardUrl) ?? undefined,
    photoUrls: o.photoUrls?.map(u => resolveAssetUrl(u) ?? u),
    tallied: o.tallied,
    talliedBy: o.talliedBy ?? undefined,
    talliedDate: o.talliedDate ?? undefined,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface BulkOrderContextValue {
  bulkOrders: BulkOrder[];
  addBulkOrder: (order: BulkOrder) => void;
  updateBulkOrder: (ref: string, updates: Partial<BulkOrder>) => void;
  nextOrderRef: string;
  markDispatched: (ref: string, invoiceId?: string) => void;
  recordPayment: (ref: string, amount: number) => void;
  tallyOrder: (ref: string, by: string) => void;
  deleteBulkOrder: (ref: string) => Promise<void>;
  isError: boolean;
  error: unknown;
}

const BulkOrderContext = createContext<BulkOrderContextValue | null>(null);

const QUERY_KEY = ["bulkOrders"] as const;

export function BulkOrderProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { getSareeTypeByCode } = useRatesPricing();

  const { data: bulkOrders = [], isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const [ordersRes, customersRes] = await Promise.all([bulkOrdersApi.list(), customersApi.list()]);
      const customerLookup = new Map(customersRes.items.map(c => [c.id, c.name]));
      return ordersRes.items.map(o => backendOrderToFrontend(o, customerLookup, getSareeTypeByCode));
    },
  });

  const setBulkOrders = (updater: (prev: BulkOrder[]) => BulkOrder[]) => {
    queryClient.setQueryData<BulkOrder[]>(QUERY_KEY, prev => updater(prev ?? []));
  };

  const addBulkOrderMutation = useMutation({
    mutationFn: (order: BulkOrder) => {
      if (!order.customerId) {
        throw new Error("A real customer must be selected to create a bulk order");
      }
      const dueIso = new Date(order.due).toISOString();
      return bulkOrdersApi.create({
        customerId: order.customerId,
        dueDate: dueIso,
        sareeTypeCode: order.sareeType?.split(" · ").pop() || undefined,
        designCode: order.design || undefined,
        total: order.total,
        amountDue: order.amountDue ?? 0,
        gstCode: order.gstCode,
        address: order.address,
        phone: order.phone,
        visitingCardUrl: toStoredAssetPath(order.visitingCardUrl) ?? undefined,
        photoUrls: order.photoUrls?.map(u => toStoredAssetPath(u) ?? u),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Bulk order created");
    },
    onError: (err) => {
      console.error("Failed to create bulk order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create bulk order");
    },
  });

  const updateBulkOrderMutation = useMutation({
    mutationFn: (args: { ref: string; updates: Partial<BulkOrder> }) =>
      bulkOrdersApi.update(args.ref, {
        status: args.updates.status ? STATUS_TO_BACKEND[args.updates.status] : undefined,
        done: args.updates.done,
        shortage: args.updates.shortage,
        paymentStatus: args.updates.paymentStatus ? PAYMENT_STATUS_TO_BACKEND[args.updates.paymentStatus] : undefined,
        amountPaid: args.updates.amountPaid,
        tallied: args.updates.tallied,
        talliedBy: args.updates.talliedBy,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Bulk order updated");
    },
    onError: (err) => {
      console.error("Failed to update bulk order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update bulk order");
    },
  });

  // NOTE(backend gap): UpdateBulkOrderDto doesn't expose dispatchStatus/invoiceId
  // yet (dispatchStatus only ever gets its DB default), so "marking dispatched"
  // stays an optimistic client-only patch until that DTO field is added.
  const markDispatchedMutation = useMutation({
    mutationFn: (args: { ref: string; invoiceId?: string }) => Promise.resolve(args),
    onSuccess: ({ ref, invoiceId }) => {
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
      toast.success("Order marked dispatched");
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (args: { ref: string; amount: number }) => {
      const current = queryClient.getQueryData<BulkOrder[]>(QUERY_KEY)?.find(o => o.ref === args.ref);
      const newPaid = (current?.amountPaid || 0) + args.amount;
      const due = current?.amountDue || 0;
      const paymentStatus: NonNullable<BulkOrder["paymentStatus"]> =
        due > 0 && newPaid >= due ? "paid" : newPaid > 0 ? "partial" : "pending";
      return bulkOrdersApi
        .update(args.ref, { amountPaid: newPaid, paymentStatus: PAYMENT_STATUS_TO_BACKEND[paymentStatus] })
        .then(() => args);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Payment recorded");
    },
    onError: (err) => {
      console.error("Failed to record payment:", err);
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    },
  });

  const tallyOrderMutation = useMutation({
    mutationFn: (args: { ref: string; by: string }) => bulkOrdersApi.update(args.ref, { tallied: true, talliedBy: args.by }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Order tallied");
    },
    onError: (err) => {
      console.error("Failed to tally order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to tally order");
    },
  });

  // Batches, quotations, dispatches, and inventory records that referenced
  // this order are unlinked (not deleted) by the backend, so their own
  // caches (finishing/* — readySarees, assignments, quotations) need
  // refetching too or they'd keep showing a bulkOrderRef that's now gone.
  const deleteBulkOrderMutation = useMutation({
    mutationFn: (ref: string) => bulkOrdersApi.remove(ref),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["finishing"] });
      toast.success("Bulk order deleted");
    },
    onError: (err) => {
      console.error("Failed to delete bulk order:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete bulk order");
    },
  });

  const addBulkOrder = (order: BulkOrder) => addBulkOrderMutation.mutate(order);
  const updateBulkOrder = (ref: string, updates: Partial<BulkOrder>) => updateBulkOrderMutation.mutate({ ref, updates });
  const markDispatched = (ref: string, invoiceId?: string) => markDispatchedMutation.mutate({ ref, invoiceId });
  const recordPayment = (ref: string, amount: number) => recordPaymentMutation.mutate({ ref, amount });
  const tallyOrder = (ref: string, by: string) => tallyOrderMutation.mutate({ ref, by });
  const deleteBulkOrder = (ref: string) => deleteBulkOrderMutation.mutateAsync(ref).then(() => undefined);

  const nextOrderRef = useMemo(() => {
    const allNums = bulkOrders
      .map(o => {
        const m = o.ref.match(/ORD-\d{4}-(\d+)/);
        return m ? parseInt(m[1] ?? "0", 10) : 0;
      })
      .filter(n => n > 0);
    // Preview only — BulkOrdersService assigns the authoritative ref on create.
    // Starts from 0 on an empty database; it previously seeded from 41, which
    // invented "ORD-2026-042" as the very first order number.
    const maxNum = allNums.length > 0 ? Math.max(...allNums) : 0;
    return `ORD-2026-${String(maxNum + 1).padStart(3, "0")}`;
  }, [bulkOrders]);

  return (
    <BulkOrderContext.Provider value={{ bulkOrders, addBulkOrder, updateBulkOrder, nextOrderRef, markDispatched, recordPayment, tallyOrder, deleteBulkOrder, isError, error }}>
      {children}
    </BulkOrderContext.Provider>
  );
}

const FALLBACK_BULK_ORDERS: BulkOrderContextValue = {
  bulkOrders: [],
  addBulkOrder: () => {},
  updateBulkOrder: () => {},
  nextOrderRef: "ORD-2026-001",
  markDispatched: () => {},
  recordPayment: () => {},
  tallyOrder: () => {},
  deleteBulkOrder: async () => {},
  isError: false,
  error: null,
};

export function useBulkOrders(): BulkOrderContextValue {
  const ctx = useContext(BulkOrderContext);
  return ctx ?? FALLBACK_BULK_ORDERS;
}
