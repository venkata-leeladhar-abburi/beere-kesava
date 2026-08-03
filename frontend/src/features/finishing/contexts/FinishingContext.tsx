import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
export * from "./finishing-types";
import { ReadySaree, FinishingAssignment, FinishingReturn, DispatchRecord, Quotation, QuotationSaree, FinishingContextValue } from "./finishing-types";
import { SEED_READY, SEED_ASSIGNMENTS, SEED_RETURNS, SEED_DISPATCHES, SEED_QUOTATIONS } from "./finishing-seed";

const FinishingContext = createContext<FinishingContextValue | null>(null);

const READY_KEY = ["finishing", "readySarees"] as const;
const ASSIGNMENTS_KEY = ["finishing", "assignments"] as const;
const RETURNS_KEY = ["finishing", "returns"] as const;
const DISPATCHES_KEY = ["finishing", "dispatches"] as const;
const QUOTATIONS_KEY = ["finishing", "quotations"] as const;

const todayLabel = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function FinishingProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: readySarees = SEED_READY } = useQuery({
    queryKey: READY_KEY, queryFn: () => Promise.resolve(SEED_READY), initialData: SEED_READY,
  });
  const { data: assignments = SEED_ASSIGNMENTS } = useQuery({
    queryKey: ASSIGNMENTS_KEY, queryFn: () => Promise.resolve(SEED_ASSIGNMENTS), initialData: SEED_ASSIGNMENTS,
  });
  const { data: returns = SEED_RETURNS } = useQuery({
    queryKey: RETURNS_KEY, queryFn: () => Promise.resolve(SEED_RETURNS), initialData: SEED_RETURNS,
  });
  const { data: dispatches = SEED_DISPATCHES } = useQuery({
    queryKey: DISPATCHES_KEY, queryFn: () => Promise.resolve(SEED_DISPATCHES), initialData: SEED_DISPATCHES,
  });
  const { data: quotations = SEED_QUOTATIONS } = useQuery({
    queryKey: QUOTATIONS_KEY, queryFn: () => Promise.resolve(SEED_QUOTATIONS), initialData: SEED_QUOTATIONS,
  });

  const setReadySarees = (updater: (prev: ReadySaree[]) => ReadySaree[]) =>
    qc.setQueryData<ReadySaree[]>(READY_KEY, prev => updater(prev ?? []));
  const setAssignments = (updater: (prev: FinishingAssignment[]) => FinishingAssignment[]) =>
    qc.setQueryData<FinishingAssignment[]>(ASSIGNMENTS_KEY, prev => updater(prev ?? []));
  const setReturns = (updater: (prev: FinishingReturn[]) => FinishingReturn[]) =>
    qc.setQueryData<FinishingReturn[]>(RETURNS_KEY, prev => updater(prev ?? []));
  const setDispatches = (updater: (prev: DispatchRecord[]) => DispatchRecord[]) =>
    qc.setQueryData<DispatchRecord[]>(DISPATCHES_KEY, prev => updater(prev ?? []));
  const setQuotations = (updater: (prev: Quotation[]) => Quotation[]) =>
    qc.setQueryData<Quotation[]>(QUOTATIONS_KEY, prev => updater(prev ?? []));

  const assignSareesMutation = useMutation({
    mutationFn: (args: { sareeIds: string[]; staff: { id: string; name: string }; assignedBy: string }) => Promise.resolve(args),
    onSuccess: ({ sareeIds, staff, assignedBy }) => {
      const today = todayLabel();
      const selected = readySarees.filter(s => sareeIds.includes(s.id));
      const newAssignments: FinishingAssignment[] = selected.map((s, i) => ({
        id: `FA-${Date.now()}-${i}`,
        sareeId: s.id,
        designCode: s.designCode,
        sareeTypeCode: s.sareeTypeCode,
        sareeType: s.sareeType,
        weaverName: s.weaverName,
        qcPassDate: s.qcPassDate,
        finishingStaffId: staff.id,
        finishingStaffName: staff.name,
        assignedDate: today,
        assignedBy,
        status: "awaiting-return",
      }));
      setAssignments(prev => [...prev, ...newAssignments]);
      setReadySarees(prev => prev.filter(s => !sareeIds.includes(s.id)));
    },
  });

  const addReadySareeMutation = useMutation({
    mutationFn: (saree: ReadySaree) => Promise.resolve(saree),
    onSuccess: (saree) => setReadySarees(prev => prev.some(s => s.id === saree.id) ? prev : [saree, ...prev]),
  });

  const receiveReturnMutation = useMutation({
    mutationFn: (params: {
      assignmentId: string; sareeId: string; condition: "perfect" | "damaged";
      damageType?: string; damageSeverity?: "Minor" | "Moderate" | "Severe";
      damageNotes?: string; damagePhotoUrl?: string; receivedBy: string; receivedDate: string;
    }) => Promise.resolve(params),
    onSuccess: (params) => {
      const assignment = assignments.find(a => a.id === params.assignmentId)
        ?? SEED_ASSIGNMENTS.find(a => a.id === params.assignmentId);
      const ret: FinishingReturn = {
        id: `FR-${Date.now()}`,
        assignmentId: params.assignmentId,
        sareeId: params.sareeId,
        designCode: assignment?.designCode ?? "—",
        sareeTypeCode: assignment?.sareeTypeCode,
        sareeType: assignment?.sareeType ?? "—",
        weaverName: assignment?.weaverName ?? "—",
        condition: params.condition,
        damageType: params.damageType,
        damageSeverity: params.damageSeverity,
        damageNotes: params.damageNotes,
        damagePhotoUrl: params.damagePhotoUrl,
        receivedBy: params.receivedBy,
        receivedDate: params.receivedDate,
        inventoryStatus: params.condition === "perfect" ? "Ready for Dispatch" : "Damaged — Review Needed",
      };
      setReturns(prev => [...prev, ret]);
      setAssignments(prev => prev.map(a => a.id === params.assignmentId ? { ...a, status: "returned" } : a));
    },
  });

  const dispatchSareesMutation = useMutation({
    mutationFn: (args: { id: string; sareeIds: string[]; record: Omit<DispatchRecord, "id"> }) => Promise.resolve(args),
    onSuccess: ({ id, sareeIds, record }) => {
      const fullRecord: DispatchRecord = { ...record, id, sareeIds };
      setDispatches(prev => [...prev, fullRecord]);

      // Move any dispatched sarees that are currently in readySarees to returns
      const currentReady = qc.getQueryData<ReadySaree[]>(READY_KEY) ?? [];
      const remaining = currentReady.filter(s => !sareeIds.includes(s.id));
      const moved = currentReady.filter(s => sareeIds.includes(s.id));
      qc.setQueryData<ReadySaree[]>(READY_KEY, remaining);
      if (moved.length > 0) {
        setReturns(oldReturns => [
          ...oldReturns,
          ...moved.map((s, idx) => ({
            id: `FR-${Date.now()}-${idx}`,
            assignmentId: "DIRECT-DISPATCH",
            sareeId: s.id,
            designCode: s.designCode,
            sareeType: s.sareeType,
            weaverName: s.weaverName,
            condition: "perfect" as const,
            receivedBy: "Admin Direct Dispatch",
            receivedDate: todayLabel(),
            inventoryStatus: "Dispatched" as const,
            dispatchId: id,
          })),
        ]);
      }

      setAssignments(prev => prev.map(a =>
        sareeIds.includes(a.sareeId) ? { ...a, status: "returned" } : a
      ));

      setReturns(prev => prev.map(r =>
        sareeIds.includes(r.sareeId)
          ? { ...r, inventoryStatus: "Dispatched", dispatchId: id }
          : r
      ));
    },
  });

  const updateDispatchMutation = useMutation({
    mutationFn: (args: { id: string; patch: Partial<DispatchRecord> }) => Promise.resolve(args),
    onSuccess: ({ id, patch }) => setDispatches(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d)),
  });

  const raiseQuotationMutation = useMutation({
    mutationFn: (args: { id: string; q: Omit<Quotation, "id" | "createdAt"> }) => Promise.resolve(args),
    onSuccess: ({ id, q }) => setQuotations(prev => [{ ...q, id, createdAt: Date.now() }, ...prev]),
  });

  const assignQuotationFinishingMutation = useMutation({
    mutationFn: (args: { quotationId: string; sareeIds: string[]; staff: { id: string; name: string }; assignedBy: string }) => Promise.resolve(args),
    onSuccess: ({ quotationId, sareeIds, staff, assignedBy }) => {
      const today = todayLabel();
      const q = quotations.find(x => x.id === quotationId);
      if (!q) return;
      const toAssign = q.sarees.filter(s => sareeIds.includes(s.sareeId) && s.finishingStatus === "pending");
      if (toAssign.length === 0) return;

      setQuotations(prev => prev.map(x => {
        if (x.id !== quotationId) return x;
        const sarees = x.sarees.map(s =>
          sareeIds.includes(s.sareeId) && s.finishingStatus === "pending"
            ? { ...s, finishingStatus: "in-finishing" as const, finishingStaffName: staff.name }
            : s
        );
        const allAssignedOrBeyond = sarees.every(s => s.finishingStatus !== "pending");
        const anyReceived = sarees.some(s => s.finishingStatus === "received");
        const status = anyReceived
          ? (allAssignedOrBeyond && sarees.every(s => s.finishingStatus === "received") ? "received" : "partially-received")
          : allAssignedOrBeyond ? "in-finishing" : x.status === "raised" ? "in-finishing" : x.status;
        return { ...x, status, finishingStaffId: staff.id, finishingStaffName: staff.name, assignedDate: today, sarees };
      }));

      const stamp = Date.now();
      const newAssignments: FinishingAssignment[] = toAssign.map((s, i) => ({
        id: `FA-QT-${stamp}-${i}`,
        sareeId: s.sareeId,
        designCode: s.designCode,
        sareeTypeCode: s.sareeTypeCode,
        sareeType: s.sareeType,
        weaverName: s.weaverName,
        qcPassDate: q.quotationDate,
        finishingStaffId: staff.id,
        finishingStaffName: staff.name,
        assignedDate: today,
        assignedBy,
        status: "awaiting-return",
        quotationRef: q.quotationNumber,
      }));
      setAssignments(a => [...a, ...newAssignments]);
    },
  });

  const receiveQuotationSareesMutation = useMutation({
    mutationFn: (args: { quotationId: string; sareeIds: string[]; receivedBy: string }) => Promise.resolve(args),
    onSuccess: ({ quotationId, sareeIds, receivedBy }) => {
      const today = todayLabel();
      const q = quotations.find(x => x.id === quotationId);
      if (!q) return;

      setQuotations(prev => prev.map(x => {
        if (x.id !== quotationId) return x;
        const sarees = x.sarees.map(s =>
          sareeIds.includes(s.sareeId) ? { ...s, finishingStatus: "received" as const } : s
        );
        const allReceived = sarees.every(s => s.finishingStatus === "received");
        const anyReceived = sarees.some(s => s.finishingStatus === "received");
        return { ...x, sarees, status: allReceived ? "received" : anyReceived ? "partially-received" : x.status };
      }));

      const stamp = Date.now();
      const newReturns: FinishingReturn[] = q.sarees
        .filter(s => sareeIds.includes(s.sareeId))
        .map((s, i) => ({
          id: `FR-QT-${stamp}-${i}`,
          assignmentId: `QT:${quotationId}`,
          sareeId: s.sareeId,
          designCode: s.designCode,
          sareeTypeCode: s.sareeTypeCode,
          sareeType: s.sareeType,
          weaverName: s.weaverName,
          condition: "perfect" as const,
          receivedBy,
          receivedDate: today,
          inventoryStatus: "Ready for Dispatch" as const,
          quotationRef: q.quotationNumber,
        }));
      setReturns(r => [...r, ...newReturns]);
      setAssignments(a => a.map(as => sareeIds.includes(as.sareeId) ? { ...as, status: "returned" as const } : as));
    },
  });

  const markQuotationDispatchedMutation = useMutation({
    mutationFn: (quotationId: string) => Promise.resolve(quotationId),
    onSuccess: (quotationId) => setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: "dispatched" } : q)),
  });

  const assignSarees = (sareeIds: string[], staff: { id: string; name: string }, assignedBy: string) =>
    assignSareesMutation.mutate({ sareeIds, staff, assignedBy });
  const addReadySaree = (saree: ReadySaree) => addReadySareeMutation.mutate(saree);
  const receiveReturn = (params: Parameters<FinishingContextValue["receiveReturn"]>[0]) => receiveReturnMutation.mutate(params);

  const dispatchSarees = (sareeIds: string[], record: Omit<DispatchRecord, "id">): string => {
    const id = `DISP-${Date.now()}`;
    dispatchSareesMutation.mutate({ id, sareeIds, record });
    return id;
  };
  const updateDispatch = (id: string, patch: Partial<DispatchRecord>) => updateDispatchMutation.mutate({ id, patch });

  const raiseQuotation = (q: Omit<Quotation, "id" | "createdAt">): string => {
    const id = `QT-${Date.now()}`;
    raiseQuotationMutation.mutate({ id, q });
    return id;
  };
  const assignQuotationFinishing = (quotationId: string, sareeIds: string[], staff: { id: string; name: string }, assignedBy: string) =>
    assignQuotationFinishingMutation.mutate({ quotationId, sareeIds, staff, assignedBy });
  const receiveQuotationSarees = (quotationId: string, sareeIds: string[], receivedBy: string) =>
    receiveQuotationSareesMutation.mutate({ quotationId, sareeIds, receivedBy });
  const markQuotationDispatched = (quotationId: string, _dispatchId: string) => markQuotationDispatchedMutation.mutate(quotationId);

  return (
    <FinishingContext.Provider value={{ readySarees, assignments, returns, dispatches, assignSarees, addReadySaree, receiveReturn, dispatchSarees, updateDispatch, quotations, raiseQuotation, assignQuotationFinishing, receiveQuotationSarees, markQuotationDispatched }}>
      {children}
    </FinishingContext.Provider>
  );
}

export function useFinishing(): FinishingContextValue {
  const ctx = useContext(FinishingContext);
  if (!ctx) throw new Error("useFinishing must be used inside FinishingProvider");
  return ctx;
}
