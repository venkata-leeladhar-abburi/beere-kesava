import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
export * from "./finishing-types";
import { ReadySaree, FinishingAssignment, FinishingReturn, DispatchRecord, Quotation, QuotationSaree, FinishingContextValue } from "./finishing-types";
import { useRatesPricing } from "@/features/pricing";
import { type SareeTypeRecord } from "@/features/pricing";
import {
  BackendFinishingAssignment,
  BackendFinishingCondition,
  BackendDamageSeverity,
  finishingAssignmentsApi,
} from "../../../shared/api/finishing";
import { qcApi } from "../../../shared/api/qc";
import { BackendDispatchRecord, BackendDispatchType, dispatchApi } from "../../../shared/api/dispatch";
import { BackendQuotation, quotationsApi } from "../../../shared/api/quotations";
import { batchesApi, BackendBatchSareeRow } from "../../../shared/api/batches";
import { weaversApi } from "../../../shared/api/weavers";
import { STOPGAP_ACTING_USER_ID } from "../../../shared/api/purchase-requests";
import { useAuth, useAuthGate } from "../../../contexts/AuthContext";
import { upsertInList } from "../../../lib/cacheUpdates";

const FinishingContext = createContext<FinishingContextValue | null>(null);

const READY_KEY = ["finishing", "readySarees"] as const;
const ASSIGNMENTS_KEY = ["finishing", "assignments"] as const;
const DISPATCHES_KEY = ["finishing", "dispatches"] as const;
/** Shop-floor stock (GET /inventory/shop) — owned by the shop portal, but a
 *  dispatch from here is what changes it, so it is invalidated from here too. */
const SHOP_STOCK_KEY = ["shop-stock"] as const;
/** Factory stock (GET /inventory) — owned by the Inventory > All Stock page,
 *  but a dispatch is what flips a saree out of "available", so it too has to
 *  be invalidated from here or that page shows stale rows until a hard reload. */
const STOCK_LIST_KEY = ["stock-list"] as const;
const QUOTATIONS_KEY = ["finishing", "quotations"] as const;

const DAMAGE_SEVERITY_TO_BACKEND: Record<"Minor" | "Moderate" | "Severe", BackendDamageSeverity> = {
  Minor: "MINOR", Moderate: "MODERATE", Severe: "SEVERE",
};

/** A saree type is stored as a rate-card code; the readable name comes from the
 *  rate card, falling back to the raw code when the card has no entry yet. */
function resolveSareeType(
  code: string | null | undefined,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): string {
  if (!code) return "—";
  return getSareeTypeByCode(code)?.type ?? code;
}

function backendAssignmentToFrontend(
  a: BackendFinishingAssignment,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): FinishingAssignment {
  return {
    id: a.id,
    sareeId: a.sareeId,
    designCode: a.designCode ?? a.batchSareeRow.designCode ?? a.batchSareeRow.design?.code ?? "—",
    sareeTypeCode: a.sareeType ?? a.batchSareeRow.sareeTypeCode ?? undefined,
    sareeType: resolveSareeType(a.sareeType ?? a.batchSareeRow.sareeTypeCode, getSareeTypeByCode),
    weaverName: a.batchSareeRow.weaver?.name ?? "—",
    // Backend doesn't track the QC-pass date separately on the assignment —
    // assignedDate is the closest available timestamp.
    qcPassDate: a.assignedDate,
    finishingStaffId: a.finishingStaffId,
    finishingStaffName: `${a.finishingStaff.firstName} ${a.finishingStaff.lastName}`,
    assignedDate: a.assignedDate,
    assignedBy: a.assignedBy ? `${a.assignedBy.firstName} ${a.assignedBy.lastName}` : "—",
    batchId: a.batchSareeRow.batchId,
    status: a.status === "AWAITING_RETURN" ? "awaiting-return" : "returned",
    // `quotationRef` is the frontend's human-readable quotation number
    // (matches DispatchRecord/InventoryRecord convention) — never the raw
    // Quotation.id FK the backend calls `quotationRef` on this model.
    quotationRef: a.quotation?.quotationNumber ?? undefined,
  };
}

// A "return" isn't a separate backend record — it's a RETURNED-status
// assignment carrying its own condition/damage fields. Derived here instead
// of fetched, since the backend merges the two concepts onto one row.
function assignmentToReturn(
  a: BackendFinishingAssignment,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): FinishingReturn {
  return {
    id: a.id,
    assignmentId: a.id,
    sareeId: a.sareeId,
    // The assignment's own copies of design/type are only filled in when the
    // assign form captured them, so the woven row is the fallback — without
    // it the dispatch queue showed "—" for design and type on most sarees.
    designCode: a.designCode ?? a.batchSareeRow.designCode ?? a.batchSareeRow.design?.code ?? "—",
    sareeTypeCode: a.sareeType ?? a.batchSareeRow.sareeTypeCode ?? undefined,
    sareeType: resolveSareeType(a.sareeType ?? a.batchSareeRow.sareeTypeCode, getSareeTypeByCode),
    weaverName: a.batchSareeRow.weaver?.name ?? "—",
    batchId: a.batchSareeRow.batchId,
    condition: a.condition === "DAMAGED" ? "damaged" : "perfect",
    damageType: a.damageType ?? undefined,
    damageSeverity: a.damageSeverity === "MINOR" ? "Minor" : a.damageSeverity === "MODERATE" ? "Moderate" : a.damageSeverity === "SEVERE" ? "Severe" : undefined,
    damageNotes: a.damageNotes ?? undefined,
    damagePhotoUrl: a.damagePhotoUrl ?? undefined,
    receivedBy: a.finishingStaff ? `${a.finishingStaff.firstName} ${a.finishingStaff.lastName}`.trim() : "Worker Staff",
    // Backend doesn't store a separate returned-at timestamp — the row's last
    // write is the closest available, and for a RETURNED assignment that write
    // *is* the receipt. assignedDate was used before, so every finished saree
    // read as having come back on the day it was sent out.
    receivedDate: a.updatedAt ?? a.assignedDate,
    inventoryStatus: a.condition === "DAMAGED" ? "Damaged — Review Needed" : "Ready for Dispatch",
    quotationRef: a.quotation?.quotationNumber ?? undefined,
  };
}

function backendDispatchToFrontend(d: BackendDispatchRecord): DispatchRecord {
  return {
    id: d.id,
    type: d.type === "WHOLESALE" ? "wholesale" : "shop",
    sareeIds: d.sarees.map(s => s.sareeId),
    dispatchDate: d.dispatchDate,
    lrNumber: d.lrNumber ?? "",
    transportCompany: d.transportCompany ?? "",
    vehicleNumber: d.vehicleNumber ?? "",
    driverName: d.driverName ?? undefined,
    notes: d.notes ?? undefined,
    customerId: d.customerId ?? undefined,
    customerName: d.customer?.name ?? undefined,
    customerPhone: d.customer?.phone ?? undefined,
    invoiceNumber: d.invoiceNumber ?? undefined,
    challanNumber: d.challanNumber ?? undefined,
    invoiceDate: d.invoiceDate ?? undefined,
    pricePerSaree: d.pricePerSaree ? Number(d.pricePerSaree) : undefined,
    totalAmount: Number(d.totalAmount),
    gstPct: d.gstPct ? Number(d.gstPct) : undefined,
    grandTotal: Number(d.grandTotal),
    firmId: d.firmId ?? undefined,
    firmName: d.firm?.firmName ?? undefined,
    paymentDueDate: d.paymentDueDate ?? undefined,
    bulkOrderRef: d.bulkOrderRef ?? undefined,
    pendingTransport: d.pendingTransport,
    pendingReceipt: d.pendingReceipt,
    receiptUrl: d.receiptUrl,
    quotationRef: d.quotationRef ?? undefined,
    expectedDelivery: d.expectedDelivery ?? undefined,
    specialInstructions: d.specialInstructions ?? undefined,
    receiptStatus: d.receiptStatus,
    dispatchedByName: d.dispatchedBy ? `${d.dispatchedBy.firstName} ${d.dispatchedBy.lastName}`.trim() : undefined,
  };
}

const QUOTATION_STATUS_FROM_BACKEND: Record<BackendQuotation["status"], Quotation["status"]> = {
  RAISED: "raised",
  IN_FINISHING: "in-finishing",
  PARTIALLY_RECEIVED: "partially-received",
  RECEIVED: "received",
  DISPATCHED: "dispatched",
};

function backendQuotationToFrontend(
  q: BackendQuotation,
  rowLookup: Map<string, BackendBatchSareeRow>,
  weaverLookup: Map<string, string>,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): Quotation {
  const sarees: QuotationSaree[] = q.sarees.map((s) => {
    const row = rowLookup.get(s.sareeId);
    // Find the latest finishing assignment for this saree, if any.
    // If the saree is in multiple states, we pick the first match (typically there's only one per quotation)
    const assignment = q.finishingAssignments?.find(a => a.sareeId === s.sareeId);
    return {
      sareeId: s.sareeId,
      designCode: row?.designCode ?? "—",
      sareeTypeCode: row?.sareeTypeCode ?? undefined,
      sareeType: row?.sareeTypeCode ? (getSareeTypeByCode(row.sareeTypeCode)?.type ?? row.sareeTypeCode) : "—",
      weaverName: (row?.weaverId ? weaverLookup.get(row.weaverId) : undefined) ?? "—",
      finishingStatus: s.finishingStatus === "PENDING" ? "pending" : s.finishingStatus === "IN_FINISHING" ? "in-finishing" : "received",
      finishingStaffName: assignment ? `${assignment.finishingStaff.firstName} ${assignment.finishingStaff.lastName}` : undefined,
    };
  });
  return {
    id: q.id,
    quotationNumber: q.quotationNumber,
    quotationDate: q.quotationDate,
    customerId: q.customerId ?? "",
    customerName: q.customer?.name ?? "—",
    customerCity: q.customer?.city ?? undefined,
    customerPhone: q.customer?.phone ?? undefined,
    customerAddress: q.customer?.address ?? undefined,
    customerGst: q.customer?.gstCode ?? undefined,
    bulkOrderRef: q.bulkOrderRef ?? undefined,
    sarees,
    prices: Object.fromEntries(q.sarees.map(s => [s.sareeId, s.price])),
    applyGst: q.applyGst,
    gstPct: q.gstPct ?? "0",
    firmId: q.firmId ?? undefined,
    notes: undefined,
    subtotal: Number(q.subtotal),
    grandTotal: Number(q.grandTotal),
    raisedBy: q.raisedBy ? `${q.raisedBy.firstName} ${q.raisedBy.lastName}` : "—",
    status: QUOTATION_STATUS_FROM_BACKEND[q.status],
    finishingStaffName: sarees.find(s => s.finishingStaffName)?.finishingStaffName,
    createdAt: new Date(q.createdAt).getTime(),
  };
}

export function FinishingProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  // Mounted globally (App.tsx) for every role. The backend restricts write
  // access to WORKER (ADMIN/SUPERADMIN bypass every role check), but the
  // read-only ready-for-finishing/assignments/dispatch endpoints also allow
  // SHOP — the shop-staff portal's Finished Goods & Dispatch page reuses
  // this same InventoryPage component and needs to show the identical
  // Total/Pending/Ready/Dispatched stats as the admin portal, not zeros.
  // Skip the fetch for roles that would just get a 403.
  const { user } = useAuth();
  const workerScoped = useAuthGate("worker", "admin", "superadmin");
  const readScoped = useAuthGate("worker", "admin", "superadmin", "shop");
  const dispatchEnabled = readScoped;
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;
  const { getSareeTypeByCode } = useRatesPricing();

  const { data: readySarees = [], isError: isReadyError, error: readyError, isLoading: isReadyLoading, refetch: refetchReady } = useQuery({
    queryKey: READY_KEY,
    enabled: readScoped,
    queryFn: async () => {
      const records = await qcApi.readyForFinishing();
      return records.map((r): ReadySaree => ({
        id: r.sareeId,
        designCode: r.batchSareeRow.designCode ?? r.batchSareeRow.design?.code ?? "—",
        sareeType: r.batchSareeRow.sareeType?.type ?? "—",
        sareeTypeCode: r.batchSareeRow.sareeTypeCode ?? undefined,
        weaverName: r.batchSareeRow.weaver?.name ?? "Factory Loom",
        weaverId: r.weaverId ?? undefined,
        bulkOrderRef: r.batchSareeRow.bulkOrderRef ?? undefined,
        batchId: r.batchId ?? undefined,
        qcPassDate: r.qcDate,
        status: "qc-passed-pending-finishing",
      }));
    },
  });
  const { data: backendAssignments = [], isError: isAssignmentsError, error: assignmentsError, isLoading: isAssignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ASSIGNMENTS_KEY,
    enabled: readScoped,
    queryFn: async () => (await finishingAssignmentsApi.list()).items,
  });
  const { data: dispatches = [], isError: isDispatchesError, error: dispatchesError, isLoading: isDispatchesLoading, refetch: refetchDispatches } = useQuery({
    queryKey: DISPATCHES_KEY,
    enabled: dispatchEnabled,
    queryFn: async () => (await dispatchApi.list()).items.map(backendDispatchToFrontend),
  });
  const { data: quotations = [], isError: isQuotationsError, error: quotationsError, isLoading: isQuotationsLoading, refetch: refetchQuotations } = useQuery({
    queryKey: QUOTATIONS_KEY,
    enabled: workerScoped,
    queryFn: async () => {
      const [quotationsRes, batchesRes, weaversRes] = await Promise.all([
        quotationsApi.list(),
        batchesApi.list(),
        weaversApi.list(),
      ]);
      const rowLookup = new Map(
        batchesRes.items.flatMap(b => b.rows.filter(r => r.sareeId).map(r => [r.sareeId as string, r] as const)),
      );
      const weaverLookup = new Map(weaversRes.items.map(w => [w.id, w.name]));
      return quotationsRes.items.map(q => backendQuotationToFrontend(q, rowLookup, weaverLookup, getSareeTypeByCode));
    },
  });
  const isError = isReadyError || isAssignmentsError || isDispatchesError || isQuotationsError;
  const error = readyError ?? assignmentsError ?? dispatchesError ?? quotationsError ?? null;
  const isLoading = isReadyLoading || isAssignmentsLoading || isDispatchesLoading || isQuotationsLoading;
  const refetch = () => {
    void refetchReady();
    void refetchAssignments();
    void refetchDispatches();
    void refetchQuotations();
  };

  const assignments = useMemo(
    () => backendAssignments
      // A saree that's SEMI or DEFECTIVE should never have reached finishing
      // in the first place — hide any such legacy/bad assignment from the
      // queue rather than surface it as something to receive back.
      .filter(a => a.batchSareeRow.qcRecords.length === 0 || a.batchSareeRow.qcRecords[0].result === "PASSED")
      .map(a => backendAssignmentToFrontend(a, getSareeTypeByCode)),
    [backendAssignments, getSareeTypeByCode],
  );
  const returns = useMemo(() => {
    const dispatchedSareeIds = new Set(dispatches.flatMap(d => d.sareeIds));
    return backendAssignments
      .filter(a => a.status === "RETURNED")
      .map(a => assignmentToReturn(a, getSareeTypeByCode))
      .map(r => dispatchedSareeIds.has(r.sareeId) ? { ...r, inventoryStatus: "Dispatched" as const } : r);
  }, [backendAssignments, dispatches, getSareeTypeByCode]);

    const setQuotations = (updater: (prev: Quotation[]) => Quotation[]) =>
    qc.setQueryData<Quotation[]>(QUOTATIONS_KEY, prev => (prev ? updater(prev) : prev));

  const setDispatches = (updater: (prev: DispatchRecord[]) => DispatchRecord[]) =>
    qc.setQueryData<DispatchRecord[]>(DISPATCHES_KEY, prev => updater(prev ?? []));

  const assignSareesMutation = useMutation({
    mutationFn: (args: { sareeIds: string[]; staff: { id: string; name: string }; assignedBy: string }) =>
      finishingAssignmentsApi.create({
        sareeIds: args.sareeIds,
        finishingStaffId: args.staff.id,
        assignedById: actingUserId,
      }),
    onSuccess: (_created, args) => {
      // READY_KEY is "QC-passed but not yet assigned", so the sarees just
      // assigned are no longer part of it. Dropping them locally makes them
      // leave the ready list on the click instead of one refetch later —
      // otherwise they linger, and a second assign against the same rows looks
      // like a valid action right up until it fails.
      const assigned = new Set(args.sareeIds);
      qc.setQueryData<ReadySaree[]>(READY_KEY, prev => prev?.filter(s => !assigned.has(s.id)));
      void qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
      void qc.invalidateQueries({ queryKey: READY_KEY });
    },
    onError: (err) => {
      console.error("Failed to assign sarees to finishing:", err);
    },
  });

  // readySarees is now always derived from the backend's QC-passed-but-
  // unassigned query, so there's nothing local left to insert — this just
  // re-triggers that query (e.g. right after a QC record was just saved).
  const addReadySareeMutation = useMutation({
    mutationFn: (_saree: ReadySaree) => Promise.resolve(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: READY_KEY });
    },
  });

  const receiveReturnMutation = useMutation({
    mutationFn: (params: {
      assignmentId: string; sareeId: string; condition: "perfect" | "damaged";
      damageType?: string; damageSeverity?: "Minor" | "Moderate" | "Severe";
      damageNotes?: string; damagePhotoUrl?: string; receivedBy: string; receivedDate: string;
    }) => {
      const condition: BackendFinishingCondition = params.condition === "damaged" ? "DAMAGED" : "PERFECT";
      return finishingAssignmentsApi.receiveReturn(params.assignmentId, {
        condition,
        damageType: params.damageType,
        damageSeverity: params.damageSeverity ? DAMAGE_SEVERITY_TO_BACKEND[params.damageSeverity] : undefined,
        damageNotes: params.damageNotes,
        damagePhotoUrl: params.damagePhotoUrl,
      });
    },
    onSuccess: (updated) => {
      // ASSIGNMENTS_KEY caches raw BackendFinishingAssignment rows (queryFn
      // does no mapping) and the receive endpoint returns exactly that, so the
      // response can go straight in.
      upsertInList<BackendFinishingAssignment>(qc, ASSIGNMENTS_KEY, updated);
      void qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
    },
    onError: (err) => {
      console.error("Failed to record finishing return:", err);
    },
  });

  // NOTE(backend precondition): POST /dispatch only accepts sareeIds that
  // already have an InventoryRecord with status FINISHING_COMPLETE — i.e.
  // sarees that went through a real finishing receive. A saree dispatched
  // directly from readySarees (skipping finishing) has no InventoryRecord
  // yet and the real call will 404; that mismatch is a genuine gap between
  // this UI's "skip finishing" shortcut and the backend's business rule,
  // not something to paper over here.
  const dispatchSareesMutation = useMutation({
    mutationFn: (args: { sareeIds: string[]; record: Omit<DispatchRecord, "id">; optimisticId: string }) => {
      const type: BackendDispatchType = args.record.type === "wholesale" ? "WHOLESALE" : "SHOP";
      return dispatchApi.create({
        type,
        actorId: user?.id,
        sareeIds: args.sareeIds,
        dispatchDate: args.record.dispatchDate || undefined,
        lrNumber: args.record.lrNumber || undefined,
        transportCompany: args.record.transportCompany || undefined,
        vehicleNumber: args.record.vehicleNumber || undefined,
        driverName: args.record.driverName,
        notes: args.record.notes,
        expectedDelivery: args.record.expectedDelivery,
        specialInstructions: args.record.specialInstructions,
        bulkOrderRef: args.record.bulkOrderRef,
        quotationRef: args.record.quotationRef,
        pendingTransport: args.record.pendingTransport,
        pendingReceipt: args.record.pendingReceipt,
        receiptUrl: args.record.receiptUrl ?? undefined,
        customerId: args.record.customerId,
        // Wholesale dispatches always raise an invoice; the number comes back
        // from the server rather than being sent up.
        raiseInvoice: type === "WHOLESALE",
        pricePerSaree: args.record.pricePerSaree,
        gstPct: args.record.gstPct,
        firmId: args.record.firmId,
        paymentDueDate: args.record.paymentDueDate,
      });
    },
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: DISPATCHES_KEY });
      const previous = qc.getQueryData<DispatchRecord[]>(DISPATCHES_KEY);
      const newDispatch: DispatchRecord = {
        ...args.record,
        id: args.optimisticId,
        sareeIds: args.sareeIds,
      };
      qc.setQueryData<DispatchRecord[]>(DISPATCHES_KEY, old => [newDispatch, ...(old || [])]);
      return { previous };
    },
    onError: (err, _args, context) => {
      console.error("Failed to dispatch sarees:", err);
      if (context?.previous) {
        qc.setQueryData(DISPATCHES_KEY, context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: DISPATCHES_KEY });
      void qc.invalidateQueries({ queryKey: READY_KEY });
      void qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
      // A SHOP dispatch is what puts stock on the shop floor, so the shop
      // portal's inventory and its New Sale picker both have to pick it up
      // rather than waiting out their own staleTime.
      void qc.invalidateQueries({ queryKey: SHOP_STOCK_KEY });
      void qc.invalidateQueries({ queryKey: STOCK_LIST_KEY });
    },
  });

  const updateDispatchMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<DispatchRecord> }) =>
      dispatchApi.update(args.id, {
        lrNumber: args.patch.lrNumber,
        transportCompany: args.patch.transportCompany,
        vehicleNumber: args.patch.vehicleNumber,
        driverName: args.patch.driverName,
        dispatchDate: args.patch.dispatchDate,
        notes: args.patch.notes,
        expectedDelivery: args.patch.expectedDelivery,
        specialInstructions: args.patch.specialInstructions,
        pendingTransport: args.patch.pendingTransport,
        pendingReceipt: args.patch.pendingReceipt,
        receiptUrl: args.patch.receiptUrl ?? undefined,
      }).then(() => args),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: DISPATCHES_KEY });
      const previous = qc.getQueryData<DispatchRecord[]>(DISPATCHES_KEY);
      setDispatches(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
      return { previous };
    },
    onError: (err, _args, context) => {
      console.error("Failed to update dispatch:", err);
      if (context?.previous) {
        qc.setQueryData(DISPATCHES_KEY, context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: DISPATCHES_KEY });
    },
  });

  const raiseQuotationMutation = useMutation({
    mutationFn: (q: Omit<Quotation, "id" | "createdAt">) =>
      quotationsApi.create({
        customerId: q.customerId,
        bulkOrderRef: q.bulkOrderRef,
        applyGst: q.applyGst,
        gstPct: q.applyGst ? Number(q.gstPct) : undefined,
        firmId: q.firmId,
        raisedById: actingUserId,
        sarees: q.sarees.map(s => ({ sareeId: s.sareeId, price: Number(q.prices[s.sareeId] ?? 0) })),
      }),
    onSuccess: (created, q) => {
      // Built from the submitted quotation rather than the response: the cached
      // row joins batch rows and weaver names (see queryFn) that POST
      // /quotations doesn't return, and the form that raised this already holds
      // every one of those display fields. Only the server-assigned identity
      // comes off the response.
      setQuotations(prev => [{
        ...q,
        id: created.id,
        quotationNumber: created.quotationNumber,
        createdAt: new Date(created.createdAt).getTime(),
        status: "raised",
      }, ...prev]);
      void qc.invalidateQueries({ queryKey: QUOTATIONS_KEY });
    },
    onError: (err) => {
      console.error("Failed to raise quotation:", err);
    },
  });

  const assignQuotationFinishingMutation = useMutation({
    mutationFn: (args: { quotationId: string; sareeIds: string[]; staff: { id: string; name: string }; assignedBy: string }) =>
      quotationsApi.assignFinishing(args.quotationId, {
        sareeIds: args.sareeIds,
        staffId: args.staff.id,
        assignedById: args.assignedBy,
      }),
    onSuccess: (_result, args) => {
      // A cached Quotation is joined against batch rows and weaver names (see
      // queryFn) that this endpoint doesn't return, so patch the fields the
      // assignment actually moves rather than reseeding the row.
      const assigned = new Set(args.sareeIds);
      setQuotations(prev => prev.map(q => q.id !== args.quotationId ? q : {
        ...q,
        status: "in-finishing",
        finishingStaffId: args.staff.id,
        finishingStaffName: args.staff.name,
        sarees: q.sarees.map(s => assigned.has(s.sareeId)
          ? { ...s, finishingStatus: "in-finishing" as const, finishingStaffName: args.staff.name }
          : s),
      }));
      void qc.invalidateQueries({ queryKey: QUOTATIONS_KEY });
    },
    onError: (err) => {
      console.error("Failed to assign quotation to finishing:", err);
    },
  });

  const receiveQuotationSareesMutation = useMutation({
    mutationFn: (args: { quotationId: string; sareeIds: string[]; receivedBy: string }) =>
      quotationsApi.receiveSarees(args.quotationId, args.sareeIds),
    onSuccess: (_result, args) => {
      const received = new Set(args.sareeIds);
      setQuotations(prev => prev.map(q => {
        if (q.id !== args.quotationId) return q;
        const sarees = q.sarees.map(s =>
          received.has(s.sareeId) ? { ...s, finishingStatus: "received" as const } : s);
        // Mirrors the backend's own roll-up (QuotationsService.receiveSarees):
        // the quotation is only "received" once every saree on it is.
        return {
          ...q,
          sarees,
          status: sarees.every(s => s.finishingStatus === "received") ? "received" : "partially-received",
        };
      }));
      void qc.invalidateQueries({ queryKey: QUOTATIONS_KEY });
    },
    onError: (err) => {
      console.error("Failed to receive quotation sarees:", err);
    },
  });

  const markQuotationDispatchedMutation = useMutation({
    mutationFn: (quotationId: string) => quotationsApi.dispatch(quotationId),
    onSuccess: (_result, quotationId) => {
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: "dispatched" } : q));
      void qc.invalidateQueries({ queryKey: QUOTATIONS_KEY });
    },
    onError: (err) => {
      console.error("Failed to mark quotation dispatched:", err);
    },
  });

  const deleteDispatchMutation = useMutation({
    mutationFn: (args: { id: string; actorId: string }) => dispatchApi.delete(args.id, args.actorId),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: DISPATCHES_KEY });
      const previous = qc.getQueryData<DispatchRecord[]>(DISPATCHES_KEY);
      qc.setQueryData<DispatchRecord[]>(DISPATCHES_KEY, old => (old || []).filter(d => d.id !== id));
      return { previous };
    },
    onError: (err, _variables, context) => {
      console.error("Failed to delete dispatch:", err);
      if (context?.previous) {
        qc.setQueryData(DISPATCHES_KEY, context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: DISPATCHES_KEY });
      // READY_KEY, not ["finishing", "ready"]: React Query matches key prefixes
      // segment by segment, so "ready" never matched "readySarees" and deleting
      // a dispatch left the ready-for-finishing list stale until a page reload.
      void qc.invalidateQueries({ queryKey: READY_KEY });
      // The backend reverts any quotation this dispatch was raised from back
      // to RECEIVED (see DispatchService.remove) — that's stale here until
      // refetched, or the quotation (and its bulk order's Quotations tab)
      // keeps showing DISPATCHED with no dispatch record to back it.
      void qc.invalidateQueries({ queryKey: QUOTATIONS_KEY });
    },
  });

  const assignSarees = (sareeIds: string[], staff: { id: string; name: string }, assignedBy: string) =>
    assignSareesMutation.mutate({ sareeIds, staff, assignedBy });
  const addReadySaree = (saree: ReadySaree) => addReadySareeMutation.mutate(saree);
  const receiveReturn = (params: Parameters<FinishingContextValue["receiveReturn"]>[0]) => receiveReturnMutation.mutate(params);

  // Awaits the real record so callers surface the backend's own id and invoice
  // number. The optimistic cache entry uses a throwaway key (not a business id)
  // that is replaced when the query is invalidated onSettled.
  const dispatchSarees = async (sareeIds: string[], record: Omit<DispatchRecord, "id">) => {
    const created = await dispatchSareesMutation.mutateAsync({
      sareeIds,
      record,
      optimisticId: `pending-${crypto.randomUUID()}`,
    });
    return { id: created.id, invoiceNumber: created.invoiceNumber ?? undefined };
  };
  const updateDispatch = (id: string, patch: Partial<DispatchRecord>) => updateDispatchMutation.mutate({ id, patch });

  const raiseQuotation = async (q: Omit<Quotation, "id" | "createdAt">) => {
    const created = await raiseQuotationMutation.mutateAsync(q);
    return { id: created.id, quotationNumber: created.quotationNumber };
  };
  const assignQuotationFinishing = (quotationId: string, sareeIds: string[], staff: { id: string; name: string }, assignedBy: string) =>
    assignQuotationFinishingMutation.mutate({ quotationId, sareeIds, staff, assignedBy });
  const receiveQuotationSarees = (quotationId: string, sareeIds: string[], receivedBy: string) =>
    receiveQuotationSareesMutation.mutate({ quotationId, sareeIds, receivedBy });
  const markQuotationDispatched = (quotationId: string) => markQuotationDispatchedMutation.mutate(quotationId);
  const deleteDispatch = (id: string, actorId: string) => deleteDispatchMutation.mutate({ id, actorId });

  return (
    <FinishingContext.Provider value={{ readySarees, assignments, returns, dispatches, assignSarees, addReadySaree, receiveReturn, dispatchSarees, updateDispatch, deleteDispatch, quotations, raiseQuotation, assignQuotationFinishing, receiveQuotationSarees, markQuotationDispatched, isError, error, isLoading, refetch }}>
      {children}
    </FinishingContext.Provider>
  );
}

const FALLBACK_FINISHING: FinishingContextValue = {
  readySarees: [],
  assignments: [],
  returns: [],
  dispatches: [],
  quotations: [],
  assignSarees: () => {},
  addReadySaree: () => {},
  receiveReturn: () => {},
  dispatchSarees: async () => ({ id: "", invoiceNumber: "" }),
  updateDispatch: () => {},
  deleteDispatch: () => {},
  raiseQuotation: async () => ({ id: "", quotationNumber: "" }),
  assignQuotationFinishing: () => {},
  receiveQuotationSarees: () => {},
  markQuotationDispatched: () => {},
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useFinishing(): FinishingContextValue {
  return useContext(FinishingContext) ?? FALLBACK_FINISHING;
}
