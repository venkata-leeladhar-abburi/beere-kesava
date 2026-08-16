import React, { createContext, useCallback, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";

export * from "./supplier-types";
import { Supplier, Purchase, SareeTag, SupplierPayment, PurchaseRequest, initialsOf, totalPieces, purchaseTotals, parseINR } from "./supplier-types";
import { BackendSupplier, suppliersApi } from "../../../shared/api/suppliers";
import { supplierPaymentsApi } from "../../../shared/api/payments";
import { BackendPurchaseRequest, purchaseRequestsApi, STOPGAP_ACTING_USER_ID } from "../../../shared/api/purchase-requests";
import {
  BackendPurchase, BackendPurchaseSareeLine, CreatePurchasePayload,
  CreatePurchaseSareeLinePayload, UpdatePurchasePayload, purchasesApi,
} from "../../../shared/api/purchases";
import { rupees, formatMoney } from "@/lib/domain/money";

// suppliers + payments + requests are wired to the real backend; purchases
// keep their rich per-saree line-item detail (price/photo/weight per piece)
// which has no backend model yet (backend Purchase only stores aggregate
// sareeCount/billAmount) — deliberately left as local/mock, same call as
// Design Library's dispatches. Requests' rich full-purchase payload
// (sarees[], invoiceFileName, gstNumber, billAmount, notes) has the same gap
// — the backend PurchaseRequest only stores sareeType/quantity/estimatedAmount
// — so that extra detail is kept in a local-only side cache keyed by the
// real backend request id (see requestExtrasRef below).
function toSupplier(s: BackendSupplier): Supplier {
  return {
    id: s.id,
    code: s.code ?? undefined,
    name: s.name,
    initials: s.initials ?? initialsOf(s.name),
    contactName: s.contactName ?? "",
    phone: s.phone ?? "",
    whatsapp: s.whatsapp ?? undefined,
    city: s.city ?? "",
    state: s.state ?? "",
    address: s.address ?? "",
    gstCode: s.gstCode ?? "",
    specialty: s.specialty ?? "",
    terms: s.terms ?? "",
    bankName: s.bankName ?? undefined,
    accountNo: s.accountNo ?? undefined,
    notes: s.notes ?? undefined,
    status: s.status === "ACTIVE" ? "active" : s.status === "INACTIVE" ? "inactive" : "overdue",
    rating: s.rating ?? 0,
  };
}
function toSareeTag(l: BackendPurchaseSareeLine): SareeTag {
  return {
    id: l.code,
    weight: l.weight ?? "",
    date: l.sareeDate ? l.sareeDate.split("T")[0] : "",
    sareeType: l.sareeType ?? "",
    color: l.color ?? "",
    price: Number(l.price),
    sellPercent: Number(l.sellPercent),
    quantity: l.quantity,
    finalAmount: Number(l.finalAmount),
    notes: l.notes ?? "",
    imageUrl: l.imageUrl ?? undefined,
    returnedQuantity: l.returnedQuantity ?? 0,
  };
}

function toPurchase(p: BackendPurchase): Purchase {
  return {
    id: p.id,
    supplierId: p.supplierId ?? undefined,
    supplier: p.supplier?.name ?? p.supplierName ?? "",
    location: p.location ?? (p.supplier ? `${p.supplier.city ?? ""}, ${p.supplier.state ?? ""}`.replace(/^, |, $/, "") : ""),
    date: p.date.split("T")[0],
    sareeCount: p.sareeCount,
    gstNumber: p.gstNumber ?? "",
    invoiceNumber: p.invoiceNumber ?? "",
    billAmount: formatMoney(rupees(Number(p.billAmount))),
    status: p.status === "PAID" ? "Paid" : p.status === "PARTIAL" ? "Partial" : "Pending",
    notes: p.notes ?? "",
    invoiceFileName: p.invoiceFileName ?? undefined,
    sarees: p.sareeLines.map(toSareeTag),
  };
}

/** A date string only counts as real input if it's non-empty and not the form's "unset" placeholder. */
function cleanDate(d: string | undefined): string | undefined {
  return d && d !== "—" ? d : undefined;
}

function toStatusPayload(status: string): "PAID" | "PENDING" | "PARTIAL" {
  return status === "Paid" ? "PAID" : status === "Partial" ? "PARTIAL" : "PENDING";
}

function toSareeLinePayload(s: SareeTag): CreatePurchaseSareeLinePayload {
  return {
    code: s.id,
    weight: s.weight || undefined,
    date: cleanDate(s.date),
    sareeType: s.sareeType || undefined,
    color: s.color || undefined,
    price: s.price,
    sellPercent: s.sellPercent,
    quantity: s.quantity,
    finalAmount: s.finalAmount,
    notes: s.notes || undefined,
    imageUrl: s.imageUrl,
    returnedQuantity: s.returnedQuantity ?? 0,
  };
}

function toCreatePurchasePayload(p: Omit<Purchase, "id">, addedById: string): CreatePurchasePayload {
  return {
    supplierId: p.supplierId || undefined,
    supplierName: p.supplierId ? undefined : p.supplier,
    location: p.location || undefined,
    date: cleanDate(p.date),
    sareeCount: p.sareeCount,
    gstNumber: p.gstNumber || undefined,
    invoiceNumber: p.invoiceNumber || undefined,
    billAmount: parseINR(p.billAmount),
    status: toStatusPayload(p.status),
    notes: p.notes || undefined,
    invoiceFileName: p.invoiceFileName,
    addedById,
    sarees: p.sarees.map(toSareeLinePayload),
  };
}

function toUpdatePurchasePayload(patch: Partial<Purchase>): UpdatePurchasePayload {
  return {
    supplierId: patch.supplierId || undefined,
    supplierName: patch.supplierId ? undefined : patch.supplier,
    location: patch.location,
    date: cleanDate(patch.date),
    sareeCount: patch.sareeCount,
    gstNumber: patch.gstNumber,
    invoiceNumber: patch.invoiceNumber,
    billAmount: patch.billAmount !== undefined ? parseINR(patch.billAmount) : undefined,
    status: patch.status ? toStatusPayload(patch.status) : undefined,
    notes: patch.notes,
    invoiceFileName: patch.invoiceFileName,
    sarees: patch.sarees?.map(toSareeLinePayload),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface SupplierContextValue {
  suppliers: Supplier[];
  purchases: Purchase[];
  payments: SupplierPayment[];
  requests: PurchaseRequest[];

  addSupplier: (s: Omit<Supplier, "id" | "initials">) => string;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplier: (id: string) => Supplier | undefined;
  nextSupplierId: () => string;

  addPurchase: (p: Omit<Purchase, "id">) => string;
  updatePurchase: (id: string, patch: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  /** Marks the given number of pieces on one saree line as returned to the supplier. */
  returnSareePieces: (purchaseId: string, lineCode: string, count: number) => void;

  addPayment: (p: Omit<SupplierPayment, "id">) => void;
  raiseRequest: (r: Omit<PurchaseRequest, "id" | "status">) => void;
  decideRequest: (id: string, status: "approved" | "rejected", decidedBy: string, note?: string) => void;

  /** Purchases + payment totals + outstanding for one supplier. */
  statsFor: (supplierId: string) => {
    purchases: Purchase[];
    totalPurchased: number;
    totalPaid: number;
    outstanding: number;
    sareeCount: number;
    lastPurchaseDate: string;
  };

  isError: boolean;
  error: unknown;
}

const SupplierContext = createContext<SupplierContextValue | null>(null);

export function useSuppliers() {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error("useSuppliers must be used within a SupplierProvider");
  return ctx;
}

const SUPPLIERS_KEY = ["suppliers", "list"] as const;
const PURCHASES_KEY = ["suppliers", "purchases"] as const;
const PAYMENTS_KEY = ["suppliers", "payments"] as const;
const REQUESTS_KEY = ["suppliers", "requests"] as const;

function toPurchaseRequest(r: BackendPurchaseRequest, supplierName: string): PurchaseRequest {
  return {
    id: r.id,
    supplierId: r.supplierId ?? "",
    supplierName,
    requestedBy: "Admin",
    requestedDate: r.createdAt.split("T")[0],
    sareeType: r.sareeType ?? "",
    quantity: r.quantity,
    estimatedAmount: r.estimatedAmount ? Number(r.estimatedAmount) : 0,
    urgency: (r.urgency as PurchaseRequest["urgency"]) ?? "Normal",
    reason: r.reason ?? "",
    status: r.status === "PENDING" ? "pending" : r.status === "APPROVED" ? "approved" : "rejected",
    decidedBy: r.decidedById ? "Superadmin" : undefined,
    decidedDate: r.decidedDate ?? undefined,
    decisionNote: r.decisionNote ?? undefined,
  };
}

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  // This provider is mounted globally (App.tsx) for every role, but the
  // backend restricts /suppliers, /payments/suppliers and /purchase-requests
  // to ACCOUNTANT (ADMIN/SUPERADMIN bypass every role check there) — skip
  // the fetch for every other role rather than firing a request that's
  // guaranteed to 403.
  const { role, user } = useAuth();
  const enabled = role === "accountant" || role === "admin" || role === "superadmin";
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;

  const { data: suppliers = [], isError: isSuppliersError, error: suppliersError } = useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: async () => (await suppliersApi.list()).items.map(toSupplier),
    enabled,
  });
  const { data: purchases = [] } = useQuery({
    queryKey: PURCHASES_KEY,
    queryFn: async () => (await purchasesApi.list()).items.map(toPurchase),
    enabled,
  });
  const { data: payments = [], isError: isPaymentsError, error: paymentsError } = useQuery({
    queryKey: PAYMENTS_KEY,
    queryFn: async () => {
      const res = await supplierPaymentsApi.list();
      return res.items.map((p): SupplierPayment => ({
        id: p.id,
        supplierId: p.supplierId,
        date: p.date,
        amount: Number(p.amount),
        mode: (p.method as SupplierPayment["mode"]) ?? "Bank Transfer",
        reference: p.utr ?? "",
      }));
    },
    enabled,
  });
  const { data: rawRequests = [], isError: isRequestsError, error: requestsError } = useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: async () => (await purchaseRequestsApi.list()).items,
    enabled,
  });

  const isError = isSuppliersError || isPaymentsError || isRequestsError;
  const error = suppliersError ?? paymentsError ?? requestsError ?? null;
  const requests = rawRequests.map((r) =>
    toPurchaseRequest(r, suppliers.find((s) => s.id === r.supplierId)?.name ?? "")
  );

  const setSuppliers = (updater: (prev: Supplier[]) => Supplier[]) =>
    qc.setQueryData<Supplier[]>(SUPPLIERS_KEY, prev => updater(prev ?? []));
  const setPurchases = (updater: (prev: Purchase[]) => Purchase[]) =>
    qc.setQueryData<Purchase[]>(PURCHASES_KEY, prev => updater(prev ?? []));
  const setPayments = (updater: (prev: SupplierPayment[]) => SupplierPayment[]) =>
    qc.setQueryData<SupplierPayment[]>(PAYMENTS_KEY, prev => updater(prev ?? []));
  const setRawRequests = (updater: (prev: BackendPurchaseRequest[]) => BackendPurchaseRequest[]) =>
    qc.setQueryData<BackendPurchaseRequest[]>(REQUESTS_KEY, prev => updater(prev ?? []));

  const nextSupplierId = useCallback(
    () => `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
    [suppliers.length]
  );

  const addSupplierMutation = useMutation({
    mutationFn: (s: Omit<Supplier, "id" | "initials">) =>
      suppliersApi.create({
        name: s.name, contactName: s.contactName, phone: s.phone, whatsapp: s.whatsapp,
        city: s.city, state: s.state, address: s.address, gstCode: s.gstCode,
        specialty: s.specialty, terms: s.terms, bankName: s.bankName, accountNo: s.accountNo,
        notes: s.notes, rating: s.rating,
      }),
    onSuccess: (created) => {
      setSuppliers(prev => [toSupplier(created), ...prev]);
      toast.success("Supplier added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add supplier");
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Supplier> }) =>
      suppliersApi.update(args.id, {
        name: args.patch.name, contactName: args.patch.contactName, phone: args.patch.phone,
        whatsapp: args.patch.whatsapp, city: args.patch.city, state: args.patch.state,
        address: args.patch.address, gstCode: args.patch.gstCode, specialty: args.patch.specialty,
        terms: args.patch.terms, bankName: args.patch.bankName, accountNo: args.patch.accountNo,
        notes: args.patch.notes, rating: args.patch.rating,
        status: args.patch.status ? args.patch.status.toUpperCase() : undefined,
      }),
    onSuccess: (updated) => {
      setSuppliers(prev => prev.map(s => s.id === updated.id ? toSupplier(updated) : s));
      toast.success("Supplier updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update supplier");
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: (_void, id) => {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success("Supplier deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete supplier");
    },
  });

  const getSupplier = useCallback(
    (id: string) => suppliers.find(s => s.id === id),
    [suppliers]
  );

  const addPurchaseMutation = useMutation({
    mutationFn: (p: Omit<Purchase, "id">) => purchasesApi.create(toCreatePurchasePayload(p, actingUserId)),
    onSuccess: (created) => {
      setPurchases(prev => [toPurchase(created), ...prev]);
      toast.success("Purchase recorded");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to record purchase");
    },
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Purchase> }) =>
      purchasesApi.update(args.id, toUpdatePurchasePayload(args.patch)),
    onSuccess: (updated) => {
      setPurchases(prev => prev.map(p => p.id === updated.id ? toPurchase(updated) : p));
      toast.success("Purchase updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update purchase");
    },
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id: string) => purchasesApi.remove(id),
    onSuccess: (_void, id) => {
      setPurchases(prev => prev.filter(p => p.id !== id));
      toast.success("Purchase deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete purchase");
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (p: Omit<SupplierPayment, "id">) =>
      supplierPaymentsApi.create({
        supplierId: p.supplierId, amount: p.amount, date: p.date, utr: p.reference, method: p.mode,
      }),
    onSuccess: (created) => {
      setPayments(prev => [{
        id: created.id, supplierId: created.supplierId, date: created.date,
        amount: Number(created.amount), mode: (created.method as SupplierPayment["mode"]) ?? "Bank Transfer",
        reference: created.utr ?? "",
      }, ...prev]);
      toast.success("Payment recorded");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    },
  });

  const raiseRequestMutation = useMutation({
    mutationFn: (r: Omit<PurchaseRequest, "id" | "status">) =>
      purchaseRequestsApi.create({
        supplierId: r.supplierId || undefined,
        sareeType: r.sareeType,
        quantity: r.quantity,
        estimatedAmount: r.estimatedAmount || undefined,
        urgency: r.urgency,
        reason: r.reason,
      }),
    onSuccess: (created) => {
      setRawRequests(prev => [created, ...prev]);
      toast.success("Purchase request raised");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to raise purchase request");
    },
  });

  const decideRequestMutation = useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected"; note?: string }) =>
      purchaseRequestsApi.decide(args.id, {
        decision: args.status === "approved" ? "APPROVED" : "REJECTED",
        decisionNote: args.note,
      }),
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to decide purchase request");
    },
    onSuccess: async (updated) => {
      // Approving a request with a full rich saree payload attached (raised via
      // an older local-only flow) turns it into a real external purchase — the
      // backend PurchaseRequest has no such payload itself, so this only fires
      // when the caller-side `requests` entry still carries local `sarees` data.
      const local = requests.find(r => r.id === updated.id);
      if (updated.status === "APPROVED" && local?.sarees && local.sarees.length > 0) {
        const purchase: Omit<Purchase, "id"> = {
          supplierId: local.supplierId || undefined,
          supplier: local.supplierName,
          location: local.location ?? "—",
          date: local.purchaseDate || local.requestedDate,
          sareeCount: totalPieces(local.sarees),
          gstNumber: local.gstNumber ?? "",
          invoiceNumber: local.invoiceNumber ?? "",
          billAmount: local.billAmount || formatMoney(rupees(purchaseTotals(local.sarees).selling)),
          status: "Pending",
          notes: local.notes ?? "",
          invoiceFileName: local.invoiceFileName,
          sarees: local.sarees,
        };
        try {
          const created = await purchasesApi.create(toCreatePurchasePayload(purchase, actingUserId));
          setPurchases(prevP => [toPurchase(created), ...prevP]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Approved, but failed to record the purchase");
        }
      }
      setRawRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      toast.success(updated.status === "APPROVED" ? "Purchase request approved" : "Purchase request rejected");
    },
  });

  const addSupplier = (s: Omit<Supplier, "id" | "initials">): string => {
    const id = `SUP-${String(Date.now()).slice(-6)}`;
    addSupplierMutation.mutate(s);
    return id;
  };
  const updateSupplier = (id: string, patch: Partial<Supplier>) => updateSupplierMutation.mutate({ id, patch });
  const deleteSupplier = (id: string) => deleteSupplierMutation.mutateAsync(id).then(() => undefined);

  const addPurchase = (p: Omit<Purchase, "id">): string => {
    const id = `EXT-2026-${String(Date.now()).slice(-4)}`;
    addPurchaseMutation.mutate(p);
    return id;
  };
  const updatePurchase = (id: string, patch: Partial<Purchase>) => updatePurchaseMutation.mutate({ id, patch });
  const deletePurchase = (id: string) => deletePurchaseMutation.mutate(id);

  const returnSareePieces = (purchaseId: string, lineCode: string, count: number) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    const sarees = purchase.sarees.map(s => {
      if (s.id !== lineCode) return s;
      const qty = Number(s.quantity) || 1;
      const nextReturned = Math.min(qty, (Number(s.returnedQuantity) || 0) + count);
      return { ...s, returnedQuantity: nextReturned };
    });
    updatePurchase(purchaseId, { sarees });
  };

  const addPayment = (p: Omit<SupplierPayment, "id">) => addPaymentMutation.mutate(p);
  const raiseRequest = (r: Omit<PurchaseRequest, "id" | "status">) => raiseRequestMutation.mutate(r);
  const decideRequest = (id: string, status: "approved" | "rejected", _decidedBy: string, note?: string) =>
    decideRequestMutation.mutate({ id, status, note });

  const statsFor = useCallback((supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    // Older purchases may predate supplierId, so fall back to matching on the name.
    const mine = purchases.filter(p =>
      p.supplierId === supplierId || (!!supplier && p.supplier === supplier.name)
    );
    const totalPurchased = mine.reduce((sum, p) => sum + parseINR(p.billAmount), 0);
    const totalPaid = payments.filter(p => p.supplierId === supplierId).reduce((sum, p) => sum + p.amount, 0);
    return {
      purchases: mine,
      totalPurchased,
      totalPaid,
      outstanding: Math.max(0, totalPurchased - totalPaid),
      sareeCount: mine.reduce((sum, p) => sum + p.sareeCount, 0),
      lastPurchaseDate: mine[0]?.date ?? "—",
    };
  }, [purchases, payments, suppliers]);

  const value: SupplierContextValue = {
    suppliers, purchases, payments, requests,
    addSupplier, updateSupplier, deleteSupplier, getSupplier, nextSupplierId,
    addPurchase, updatePurchase, deletePurchase, returnSareePieces,
    addPayment, raiseRequest, decideRequest, statsFor,
    isError, error,
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}
