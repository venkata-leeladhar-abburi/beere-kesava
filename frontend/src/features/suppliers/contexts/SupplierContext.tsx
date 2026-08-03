import React, { createContext, useCallback, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export * from "./supplier-types";
import { Supplier, Purchase, SupplierPayment, PurchaseRequest, initialsOf, totalPieces, purchaseTotals, parseINR, computeFinalAmount, buildSareeCode, buildSareePieceCode, pieceCodeFromLineCode, expandSareePieces, formatINR } from "./supplier-types";
import { SEED_SUPPLIERS, SEED_PURCHASES, SEED_PAYMENTS, SEED_REQUESTS } from "./supplier-seed";
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

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: suppliers = SEED_SUPPLIERS } = useQuery({
    queryKey: SUPPLIERS_KEY, queryFn: () => Promise.resolve(SEED_SUPPLIERS), initialData: SEED_SUPPLIERS,
  });
  const { data: purchases = SEED_PURCHASES } = useQuery({
    queryKey: PURCHASES_KEY, queryFn: () => Promise.resolve(SEED_PURCHASES), initialData: SEED_PURCHASES,
  });
  const { data: payments = SEED_PAYMENTS } = useQuery({
    queryKey: PAYMENTS_KEY, queryFn: () => Promise.resolve(SEED_PAYMENTS), initialData: SEED_PAYMENTS,
  });
  const { data: requests = SEED_REQUESTS } = useQuery({
    queryKey: REQUESTS_KEY, queryFn: () => Promise.resolve(SEED_REQUESTS), initialData: SEED_REQUESTS,
  });

  const setSuppliers = (updater: (prev: Supplier[]) => Supplier[]) =>
    qc.setQueryData<Supplier[]>(SUPPLIERS_KEY, prev => updater(prev ?? []));
  const setPurchases = (updater: (prev: Purchase[]) => Purchase[]) =>
    qc.setQueryData<Purchase[]>(PURCHASES_KEY, prev => updater(prev ?? []));
  const setPayments = (updater: (prev: SupplierPayment[]) => SupplierPayment[]) =>
    qc.setQueryData<SupplierPayment[]>(PAYMENTS_KEY, prev => updater(prev ?? []));
  const setRequests = (updater: (prev: PurchaseRequest[]) => PurchaseRequest[]) =>
    qc.setQueryData<PurchaseRequest[]>(REQUESTS_KEY, prev => updater(prev ?? []));

  const nextSupplierId = useCallback(
    () => `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
    [suppliers.length]
  );

  const addSupplierMutation = useMutation({
    mutationFn: (s: Omit<Supplier, "id" | "initials">) => Promise.resolve(s),
    onSuccess: (s) => {
      const id = `SUP-${String(Date.now()).slice(-6)}`;
      setSuppliers(prev => [{ ...s, id, initials: initialsOf(s.name) }, ...prev]);
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<Supplier> }) => Promise.resolve(args),
    onSuccess: ({ id, patch }) =>
      setSuppliers(prev => prev.map(s => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        return patch.name ? { ...next, initials: initialsOf(patch.name) } : next;
      })),
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
    mutationFn: (p: Omit<SupplierPayment, "id">) => Promise.resolve(p),
    onSuccess: (p) => setPayments(prev => [{ ...p, id: `SPY-${String(Date.now()).slice(-6)}` }, ...prev]),
  });

  const raiseRequestMutation = useMutation({
    mutationFn: (r: Omit<PurchaseRequest, "id" | "status">) => Promise.resolve(r),
    onSuccess: (r) => setRequests(prev => [{ ...r, id: `EPR-${String(Date.now()).slice(-6)}`, status: "pending" }, ...prev]),
  });

  const decideRequestMutation = useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected"; decidedBy: string; note?: string }) => Promise.resolve(args),
    onSuccess: ({ id, status, decidedBy, note }) => {
      const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      setRequests(prev => prev.map(r => {
        if (r.id !== id) return r;
        let createdPurchaseId: string | undefined;
        // Approving a request turns it into a real external purchase, exactly as
        // the admin submitted it — nothing to re-key on the superadmin's side.
        if (status === "approved" && r.status === "pending" && r.sarees && r.sarees.length > 0) {
          createdPurchaseId = `EXT-2026-${String(Date.now()).slice(-4)}`;
          const purchase: Purchase = {
            id: createdPurchaseId,
            supplierId: r.supplierId || undefined,
            supplier: r.supplierName,
            location: r.location ?? "—",
            date: r.purchaseDate || r.requestedDate,
            sareeCount: totalPieces(r.sarees),
            gstNumber: r.gstNumber ?? "",
            invoiceNumber: r.invoiceNumber ?? "",
            billAmount: r.billAmount || `₹${Math.round(purchaseTotals(r.sarees).selling).toLocaleString("en-IN")}`,
            status: "Pending",
            notes: r.notes ?? "",
            invoiceFileName: r.invoiceFileName,
            sarees: r.sarees,
          };
          setPurchases(prevP => [purchase, ...prevP]);
        }
        return { ...r, status, decidedBy, decidedDate: today, decisionNote: note, createdPurchaseId };
      }));
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
  const decideRequest = (id: string, status: "approved" | "rejected", decidedBy: string, note?: string) =>
    decideRequestMutation.mutate({ id, status, decidedBy, note });

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
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}
