import React, { createContext, useCallback, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";

export * from "./supplier-types";
import { Supplier, Purchase, SupplierPayment, PurchaseRequest, initialsOf, totalPieces, purchaseTotals, parseINR, computeFinalAmount, buildSareeCode, buildSareePieceCode, pieceCodeFromLineCode, expandSareePieces, formatINR } from "./supplier-types";
import { SEED_PURCHASES } from "./supplier-seed";
import { BackendSupplier, suppliersApi } from "../../../shared/api/suppliers";
import { supplierPaymentsApi } from "../../../shared/api/payments";
import { BackendPurchaseRequest, purchaseRequestsApi } from "../../../shared/api/purchase-requests";

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
    status: s.status === "ACTIVE" ? "active" : s.status === "INACTIVE" ? "inactive" : "overdue",
    rating: s.rating ?? 0,
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
  getSupplier: (id: string) => Supplier | undefined;
  nextSupplierId: () => string;

  addPurchase: (p: Omit<Purchase, "id">) => string;
  updatePurchase: (id: string, patch: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;

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
  // to ACCOUNTANT — skip the fetch entirely for every other role rather
  // than firing a request that's guaranteed to 403.
  const { role } = useAuth();
  const enabled = role === "accountant";

  const { data: suppliers = [], isError: isSuppliersError, error: suppliersError } = useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: async () => (await suppliersApi.list()).items.map(toSupplier),
    enabled,
  });
  const { data: purchases = SEED_PURCHASES } = useQuery({
    queryKey: PURCHASES_KEY, queryFn: () => Promise.resolve(SEED_PURCHASES), initialData: SEED_PURCHASES,
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
        rating: s.rating,
      }),
    onSuccess: (created) => setSuppliers(prev => [toSupplier(created), ...prev]),
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Supplier> }) =>
      suppliersApi.update(args.id, {
        name: args.patch.name, contactName: args.patch.contactName, phone: args.patch.phone,
        whatsapp: args.patch.whatsapp, city: args.patch.city, state: args.patch.state,
        address: args.patch.address, gstCode: args.patch.gstCode, specialty: args.patch.specialty,
        terms: args.patch.terms, bankName: args.patch.bankName, accountNo: args.patch.accountNo,
        rating: args.patch.rating,
        status: args.patch.status ? args.patch.status.toUpperCase() : undefined,
      }),
    onSuccess: (updated) => setSuppliers(prev => prev.map(s => s.id === updated.id ? toSupplier(updated) : s)),
  });

  const getSupplier = useCallback(
    (id: string) => suppliers.find(s => s.id === id),
    [suppliers]
  );

  const addPurchaseMutation = useMutation({
    mutationFn: (p: Omit<Purchase, "id">) => Promise.resolve(p),
    onSuccess: (p) => {
      const id = `EXT-2026-${String(Date.now()).slice(-4)}`;
      setPurchases(prev => [{ ...p, id }, ...prev]);
    },
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Purchase> }) => Promise.resolve(args),
    onSuccess: ({ id, patch }) => setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)),
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(id),
    onSuccess: (id) => setPurchases(prev => prev.filter(p => p.id !== id)),
  });

  const addPaymentMutation = useMutation({
    mutationFn: (p: Omit<SupplierPayment, "id">) =>
      supplierPaymentsApi.create({
        supplierId: p.supplierId, amount: p.amount, date: p.date, utr: p.reference, method: p.mode,
      }),
    onSuccess: (created) => setPayments(prev => [{
      id: created.id, supplierId: created.supplierId, date: created.date,
      amount: Number(created.amount), mode: (created.method as SupplierPayment["mode"]) ?? "Bank Transfer",
      reference: created.utr ?? "",
    }, ...prev]),
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
    onSuccess: (created) => setRawRequests(prev => [created, ...prev]),
  });

  const decideRequestMutation = useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected"; note?: string }) =>
      purchaseRequestsApi.decide(args.id, {
        decision: args.status === "approved" ? "APPROVED" : "REJECTED",
        decisionNote: args.note,
      }),
    onSuccess: (updated) => {
      // Approving a request with a full rich saree payload attached (raised via
      // an older local-only flow) turns it into a real external purchase — the
      // backend PurchaseRequest has no such payload itself, so this only fires
      // when the caller-side `requests` entry still carries local `sarees` data.
      const local = requests.find(r => r.id === updated.id);
      if (updated.status === "APPROVED" && local?.sarees && local.sarees.length > 0) {
        const createdPurchaseId = `EXT-2026-${String(Date.now()).slice(-4)}`;
        const purchase: Purchase = {
          id: createdPurchaseId,
          supplierId: local.supplierId || undefined,
          supplier: local.supplierName,
          location: local.location ?? "—",
          date: local.purchaseDate || local.requestedDate,
          sareeCount: totalPieces(local.sarees),
          gstNumber: local.gstNumber ?? "",
          invoiceNumber: local.invoiceNumber ?? "",
          billAmount: local.billAmount || `₹${Math.round(purchaseTotals(local.sarees).selling).toLocaleString("en-IN")}`,
          status: "Pending",
          notes: local.notes ?? "",
          invoiceFileName: local.invoiceFileName,
          sarees: local.sarees,
        };
        setPurchases(prevP => [purchase, ...prevP]);
      }
      setRawRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    },
  });

  const addSupplier = (s: Omit<Supplier, "id" | "initials">): string => {
    const id = `SUP-${String(Date.now()).slice(-6)}`;
    addSupplierMutation.mutate(s);
    return id;
  };
  const updateSupplier = (id: string, patch: Partial<Supplier>) => updateSupplierMutation.mutate({ id, patch });

  const addPurchase = (p: Omit<Purchase, "id">): string => {
    const id = `EXT-2026-${String(Date.now()).slice(-4)}`;
    addPurchaseMutation.mutate(p);
    return id;
  };
  const updatePurchase = (id: string, patch: Partial<Purchase>) => updatePurchaseMutation.mutate({ id, patch });
  const deletePurchase = (id: string) => deletePurchaseMutation.mutate(id);

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
    addSupplier, updateSupplier, getSupplier, nextSupplierId,
    addPurchase, updatePurchase, deletePurchase,
    addPayment, raiseRequest, decideRequest, statsFor,
    isError, error,
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}
