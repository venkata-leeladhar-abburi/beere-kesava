import React, { createContext, useCallback, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth, useAuthGate } from "../../../contexts/AuthContext";

export * from "./supplier-types";
import { Supplier, Purchase, SareeTag, SupplierPayment, PurchaseRequest, initialsOf, totalPieces, purchaseTotals, parseINR } from "./supplier-types";
import { BackendSupplier, suppliersApi } from "../../../shared/api/suppliers";
import { resolveAssetUrl, toStoredAssetPath } from "../../../shared/api/uploads";
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
    ifscCode: s.ifscCode ?? undefined,
    notes: s.notes ?? undefined,
    visitingCard: resolveAssetUrl(s.visitingCardUrl) ?? undefined,
    status: s.status === "ACTIVE" ? "active" : s.status === "INACTIVE" ? "inactive" : "overdue",
    rating: s.rating ?? 0,
  };
}
function toSareeTag(l: BackendPurchaseSareeLine): SareeTag {
  return {
    id: l.code,
    lineId: l.id,
    weight: l.weight ?? "",
    date: l.sareeDate ? l.sareeDate.split("T")[0] : "",
    sareeType: l.sareeType ?? "",
    color: l.color ?? "",
    price: Number(l.price),
    sellPercent: Number(l.sellPercent),
    quantity: l.quantity,
    finalAmount: Number(l.finalAmount),
    notes: l.notes ?? "",
    imageUrl: resolveAssetUrl(l.imageUrl) ?? undefined,
    pieceImageUrls: l.pieceImageUrls,
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
    invoiceFileUrl: p.invoiceFileUrl ?? undefined,
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
    imageUrl: toStoredAssetPath(s.imageUrl) ?? undefined,
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
    invoiceFileUrl: p.invoiceFileUrl,
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
    invoiceFileUrl: patch.invoiceFileUrl,
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

  addSupplier: (s: Omit<Supplier, "id" | "initials">) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplier: (id: string) => Supplier | undefined;

  addPurchase: (p: Omit<Purchase, "id">) => void;
  updatePurchase: (id: string, patch: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  /** Full purchase incl. saree photos — `purchases` only carries the "summary" view. */
  getPurchaseDetail: (id: string) => Promise<Purchase>;

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
  isLoading: boolean;
  refetch: () => void;
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
  const { user } = useAuth();
  const enabled = useAuthGate("accountant", "admin", "superadmin");
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;

  const { data: suppliers = [], isError: isSuppliersError, error: suppliersError, isLoading: isSuppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: async () => (await suppliersApi.list()).items.map(toSupplier),
    enabled,
  });
  // "summary" view — the base64 photo data on every sareeLine (imageUrl/
  // pieceImageUrls) can push a full page of purchases past the frontend's
  // request timeout (see ListPurchasesQueryDto.view). This list only needs
  // per-line price/quantity for the buying/selling/profit columns; photos
  // are fetched on demand per-purchase (see getPurchaseDetail) when a user
  // opens its detail drawer or saree list.
  const { data: purchases = [], isError: isPurchasesError, error: purchasesError, refetch: refetchPurchases } = useQuery({
    queryKey: PURCHASES_KEY,
    queryFn: async () => (await purchasesApi.list(100, 1, undefined, undefined, "summary")).items.map(toPurchase),
    enabled,
  });
  const { data: payments = [], isError: isPaymentsError, error: paymentsError, refetch: refetchPayments } = useQuery({
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
        purchaseId: p.purchaseId ?? undefined,
        recordedBy: p.recordedBy ?? null,
      }));
    },
    enabled,
  });
  const { data: rawRequests = [], isError: isRequestsError, error: requestsError, refetch: refetchRequests } = useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: async () => (await purchaseRequestsApi.list()).items,
    enabled,
  });

  const isError = isSuppliersError || isPurchasesError || isPaymentsError || isRequestsError;
  const error = suppliersError ?? purchasesError ?? paymentsError ?? requestsError ?? null;
  const isLoading = isSuppliersLoading;
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

  const addSupplierMutation = useMutation({
    mutationFn: (s: Omit<Supplier, "id" | "initials">) =>
      suppliersApi.create({
        name: s.name, contactName: s.contactName, phone: s.phone, whatsapp: s.whatsapp,
        city: s.city, state: s.state, address: s.address, gstCode: s.gstCode,
        specialty: s.specialty, terms: s.terms, bankName: s.bankName, accountNo: s.accountNo, ifscCode: s.ifscCode,
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
        terms: args.patch.terms, bankName: args.patch.bankName, accountNo: args.patch.accountNo, ifscCode: args.patch.ifscCode,
        notes: args.patch.notes, rating: args.patch.rating,
        visitingCardUrl: toStoredAssetPath(args.patch.visitingCard) ?? undefined,
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
        purchaseId: p.purchaseId,
      }),
    onSuccess: (created) => {
      setPayments(prev => [{
        id: created.id, supplierId: created.supplierId, date: created.date,
        amount: Number(created.amount), mode: (created.method as SupplierPayment["mode"]) ?? "Bank Transfer",
        reference: created.utr ?? "",
        purchaseId: created.purchaseId ?? undefined,
      }, ...prev]);
      // A payment linked to a purchase may have flipped that purchase's
      // Pending/Partial/Paid status server-side (PurchasesService.
      // recomputeStatus) — the cached purchase list doesn't know that yet.
      if (created.purchaseId) {
        void qc.invalidateQueries({ queryKey: PURCHASES_KEY });
      }
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

  const addSupplier = (s: Omit<Supplier, "id" | "initials">) => addSupplierMutation.mutate(s);
  const updateSupplier = (id: string, patch: Partial<Supplier>) => updateSupplierMutation.mutate({ id, patch });
  const deleteSupplier = (id: string) => deleteSupplierMutation.mutateAsync(id).then(() => undefined);

  const addPurchase = (p: Omit<Purchase, "id">) => addPurchaseMutation.mutate(p);
  const updatePurchase = (id: string, patch: Partial<Purchase>) => updatePurchaseMutation.mutate({ id, patch });
  const deletePurchase = (id: string) => deletePurchaseMutation.mutate(id);
  const getPurchaseDetail = async (id: string) =>
    toPurchase(
      await qc.fetchQuery({
        queryKey: [...PURCHASES_KEY, "detail", id],
        queryFn: () => purchasesApi.getOne(id),
        staleTime: 60_000,
      }),
    );

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
    addSupplier, updateSupplier, deleteSupplier, getSupplier,
    addPurchase, updatePurchase, deletePurchase, getPurchaseDetail,
    addPayment, raiseRequest, decideRequest, statsFor,
    isError, error, isLoading,
    refetch: () => {
      void refetchSuppliers();
      void refetchPurchases();
      void refetchPayments();
      void refetchRequests();
    },
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}
