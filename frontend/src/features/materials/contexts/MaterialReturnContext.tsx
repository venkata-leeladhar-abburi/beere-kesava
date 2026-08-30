import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BackendMaterialReturnRecord,
  CreateMaterialReturnPayload,
  materialReturnsApi,
  OutstandingMaterialGroup,
} from "../../../shared/api/material-returns";
import { BackendWeaver, weaversApi } from "../../../shared/api/weavers";
import { BackendFactoryLoom, factoryLoomsApi } from "../../../shared/api/factory-looms";
import { STOPGAP_ACTING_USER_ID } from "../../../shared/api/purchase-requests";
import { useAuth, useAuthGate } from "../../../contexts/AuthContext";
import {
  JARI_GRADE_FROM_BACKEND,
  MATERIAL_TYPE_FROM_BACKEND,
  MATERIAL_TYPE_TO_BACKEND,
  WARP_SUBTYPE_FROM_BACKEND,
} from "./MaterialIssueContext";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface ReturnedMaterialItem {
  materialType: "Warp" | "Resham" | "Jari";
  description?: string;
  quantity: number;
  unit: string;
}

export interface MaterialReturnRecord {
  id: string;               // auto-generated e.g. "MRR-2026-001"
  weaverId?: string;
  weaverName?: string;
  loomNumber?: number;
  batchId?: string;
  factoryLoomId?: string;
  factoryLoomNumber?: string;
  receivedBy: string;
  receivedAt: string;
  materials: ReturnedMaterialItem[];
  signatureMethod: "here" | "remote";
  signatureCaptured: boolean;
  signatureTimestamp?: string;
  signatureUrl?: string;
  deductionAmount?: number;
  deductionReason?: string;
  notes?: string;
  status: "pending-signature" | "approved" | "cancelled";
}

export interface WeaverOutstandingLine {
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype?: "Resham Warp" | "Jari Warp";
  jariType?: string;
  jariGrade?: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor?: string;
  // Where the still-outstanding material came from — the GRN receipt and the
  // exact line within it. Undefined for material issued before GRN linkage
  // was recorded.
  grnBatchId?: string;
  grnItemCode?: string;
  description?: string;
  /** Unit the material was issued in ("KG", "REELS", …). */
  unit: string;
  /** Material-issue record ids (MIR-…) that contributed to this line. */
  issueIds: string[];
  issuedGrams: number;
  returnedGrams: number;
  outstandingGrams: number;
}

/** Narrows an outstanding lookup to one loom and/or one batch of the recipient. */
export interface OutstandingScope {
  loomNumber?: number | string;
  batchId?: string;
}

function backendItemToFrontend(item: BackendMaterialReturnRecord["items"][number]): ReturnedMaterialItem {
  return {
    materialType: MATERIAL_TYPE_FROM_BACKEND[item.materialType],
    quantity: Number(item.quantity),
    unit: item.unit,
  };
}

function backendRecordToFrontend(
  r: BackendMaterialReturnRecord,
  weaverLookup: Map<string, string>,
  loomLookup: Map<string, string>,
): MaterialReturnRecord {
  return {
    id: r.id,
    weaverId: r.weaverId ?? undefined,
    weaverName: r.weaverId ? weaverLookup.get(r.weaverId) : undefined,
    loomNumber: r.loomNumber ? Number(r.loomNumber) : undefined,
    batchId: r.batchId ?? undefined,
    factoryLoomId: r.factoryLoomId ?? undefined,
    factoryLoomNumber: r.factoryLoomId ? loomLookup.get(r.factoryLoomId) : undefined,
    receivedBy: "Admin (Kesava Rao)",
    receivedAt: r.receivedAt,
    materials: r.items.map(backendItemToFrontend),
    signatureMethod: r.signatureMethod === "REMOTE" ? "remote" : "here",
    signatureCaptured: r.signatureCaptured,
    signatureTimestamp: r.signatureTimestamp ?? undefined,
    signatureUrl: r.signatureUrl ?? undefined,
    deductionAmount: r.deductionAmount ? Number(r.deductionAmount) : undefined,
    deductionReason: r.deductionReason ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status === "PENDING_SIGNATURE" ? "pending-signature" : r.status === "APPROVED" ? "approved" : "cancelled",
  };
}

function frontendItemToPayload(m: ReturnedMaterialItem): CreateMaterialReturnPayload["items"][number] {
  return {
    materialType: MATERIAL_TYPE_TO_BACKEND[m.materialType],
    quantity: m.quantity,
    unit: m.unit,
  };
}

function outstandingGroupToLine(g: OutstandingMaterialGroup): WeaverOutstandingLine {
  return {
    materialType: MATERIAL_TYPE_FROM_BACKEND[g.materialType],
    warpSubtype: g.warpSubtype ? WARP_SUBTYPE_FROM_BACKEND[g.warpSubtype] : undefined,
    jariType: g.jariType ?? undefined,
    jariGrade: g.jariGrade ? JARI_GRADE_FROM_BACKEND[g.jariGrade] : undefined,
    jariColor: g.jariColor ?? undefined,
    grnBatchId: g.grnBatchId ?? undefined,
    grnItemCode: g.grnItemCode ?? undefined,
    description: g.description ?? undefined,
    unit: g.unit,
    issueIds: g.issueIds ?? [],
    issuedGrams: g.issuedGrams,
    returnedGrams: g.returnedGrams,
    outstandingGrams: g.outstandingGrams,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
export interface AddReturnRecordInput {
  weaverId?: string;
  weaverName?: string;
  loomNumber?: number;
  factoryLoomId?: string;
  factoryLoomNumber?: string;
  batchId?: string;
  materials: ReturnedMaterialItem[];
  signatureMethod: "here" | "remote";
  deductionAmount?: number;
  deductionReason?: string;
  notes?: string;
  signatureBlob?: Blob | null;
}

interface MaterialReturnContextValue {
  returnRecords: MaterialReturnRecord[];
  addReturnRecord: (input: AddReturnRecordInput) => Promise<MaterialReturnRecord>;
  deleteReturnRecord: (id: string) => Promise<void>;
  getRecordsForWeaver: (weaverId: string) => MaterialReturnRecord[];
  getOutstandingForRecipient: (weaverId?: string, factoryLoomId?: string, scope?: OutstandingScope) => Promise<WeaverOutstandingLine[]>;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

const MaterialReturnContext = createContext<MaterialReturnContextValue | null>(null);

const RETURN_RECORDS_KEY = ["materialReturn", "returnRecords"] as const;

export function MaterialReturnProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;

  // /material-returns is ADMIN/SUPERADMIN-only on the backend — no other
  // role has a route override there. This provider is shared across every
  // portal, so an unscoped gate fired this for SHOP/WORKER/WEAVER/ACCOUNTANT
  // too and they got back nothing but a "your role is not permitted" 403.
  const enabled = useAuthGate("admin", "superadmin");

  const { data: returnRecords = [], isError, error, isLoading, refetch } = useQuery({
    queryKey: RETURN_RECORDS_KEY,
    enabled,
    queryFn: async () => {
      const [returnsRes, weaversRes, loomsRes] = await Promise.all([
        materialReturnsApi.list(),
        weaversApi.list().catch(() => ({ items: [] as BackendWeaver[] })),
        factoryLoomsApi.list().catch(() => ({ items: [] as BackendFactoryLoom[] })),
      ]);
      const weaverLookup = new Map(weaversRes.items.map((w: BackendWeaver) => [w.id, w.name]));
      const loomLookup = new Map(loomsRes.items.map((l: BackendFactoryLoom) => [l.id, l.code || l.loomNumber]));
      return returnsRes.items.map(r => backendRecordToFrontend(r, weaverLookup, loomLookup));
    },
  });

  const addReturnRecordMutation = useMutation({
    mutationFn: async (input: AddReturnRecordInput) => {
      const created = await materialReturnsApi.create({
        weaverId: input.weaverId,
        factoryLoomId: input.factoryLoomId,
        loomNumber: input.loomNumber,
        batchId: input.batchId,
        receivedById: actingUserId,
        signatureMethod: input.signatureMethod === "remote" ? "REMOTE" : "HERE",
        deductionAmount: input.deductionAmount,
        deductionReason: input.deductionReason,
        notes: input.notes,
        items: input.materials.map(frontendItemToPayload),
      });

      if (input.signatureMethod === "here" && input.signatureBlob) {
        return materialReturnsApi.sign(created.id, input.signatureBlob);
      }
      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RETURN_RECORDS_KEY });
      toast.success("Materials received back");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to record return");
    },
  });

  const deleteReturnRecordMutation = useMutation({
    mutationFn: (id: string) => materialReturnsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RETURN_RECORDS_KEY });
    },
  });

  const addReturnRecord = async (input: AddReturnRecordInput): Promise<MaterialReturnRecord> => {
    const created = await addReturnRecordMutation.mutateAsync(input);
    const weaverLookup = new Map(input.weaverId && input.weaverName ? [[input.weaverId, input.weaverName]] : []);
    const loomLookup = new Map(
      input.factoryLoomId && input.factoryLoomNumber ? [[input.factoryLoomId, input.factoryLoomNumber]] : [],
    );
    return backendRecordToFrontend(created, weaverLookup, loomLookup);
  };

  const deleteReturnRecord = (id: string): Promise<void> =>
    deleteReturnRecordMutation.mutateAsync(id).then(() => undefined);

  const getRecordsForWeaver = useCallback((weaverId: string) => {
    return returnRecords.filter(r => r.weaverId === weaverId);
  }, [returnRecords]);

  const getOutstandingForRecipient = useCallback(async (weaverId?: string, factoryLoomId?: string, scope?: OutstandingScope) => {
    if (!weaverId && !factoryLoomId) return [];
    const groups = await materialReturnsApi.getOutstanding({
      weaverId,
      factoryLoomId,
      loomNumber: scope?.loomNumber !== undefined && scope.loomNumber !== "" ? String(scope.loomNumber) : undefined,
      batchId: scope?.batchId || undefined,
    });
    return groups.map(outstandingGroupToLine);
  }, []);

  return (
    <MaterialReturnContext.Provider value={{ returnRecords, addReturnRecord, deleteReturnRecord, getRecordsForWeaver, getOutstandingForRecipient, isError, error, isLoading, refetch: () => void refetch() }}>
      {children}
    </MaterialReturnContext.Provider>
  );
}

const FALLBACK_MATERIAL_RETURN: MaterialReturnContextValue = {
  returnRecords: [],
  addReturnRecord: async () => ({
    id: "",
    receivedBy: "",
    receivedAt: "",
    materials: [],
    signatureMethod: "here",
    signatureCaptured: false,
    status: "approved",
  }),
  deleteReturnRecord: async () => {},
  getRecordsForWeaver: () => [],
  getOutstandingForRecipient: async () => [],
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useMaterialReturn(): MaterialReturnContextValue {
  const ctx = useContext(MaterialReturnContext);
  return ctx ?? FALLBACK_MATERIAL_RETURN;
}
