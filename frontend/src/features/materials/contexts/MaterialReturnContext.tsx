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
import { useAuth } from "../../../contexts/AuthContext";
import {
  JARI_GRADE_FROM_BACKEND,
  JARI_GRADE_TO_BACKEND,
  MATERIAL_TYPE_FROM_BACKEND,
  MATERIAL_TYPE_TO_BACKEND,
  WARP_SUBTYPE_FROM_BACKEND,
  WARP_SUBTYPE_TO_BACKEND,
} from "./MaterialIssueContext";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface ReturnedMaterialItem {
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype?: "Resham Warp" | "Jari Warp";
  description?: string;
  quantity: number;
  unit: string;
  jariType?: "Polyester" | "Silk Fast";
  jariGrade?: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor?: string;
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
  outstandingGrams: number;
}

function backendItemToFrontend(item: BackendMaterialReturnRecord["items"][number]): ReturnedMaterialItem {
  return {
    materialType: MATERIAL_TYPE_FROM_BACKEND[item.materialType],
    warpSubtype: item.warpSubtype ? WARP_SUBTYPE_FROM_BACKEND[item.warpSubtype] : undefined,
    quantity: Number(item.quantity),
    unit: item.unit,
    jariType: item.jariType === "Polyester" || item.jariType === "Silk Fast" ? item.jariType : undefined,
    jariGrade: item.jariGrade ? JARI_GRADE_FROM_BACKEND[item.jariGrade] : undefined,
    jariColor: item.jariColor ?? undefined,
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
    warpSubtype: m.warpSubtype ? WARP_SUBTYPE_TO_BACKEND[m.warpSubtype] : undefined,
    quantity: m.quantity,
    unit: m.unit,
    jariType: m.jariType,
    jariGrade: m.jariGrade ? JARI_GRADE_TO_BACKEND[m.jariGrade] : undefined,
    jariColor: m.jariColor,
  };
}

function outstandingGroupToLine(g: OutstandingMaterialGroup): WeaverOutstandingLine {
  return {
    materialType: MATERIAL_TYPE_FROM_BACKEND[g.materialType],
    warpSubtype: g.warpSubtype ? WARP_SUBTYPE_FROM_BACKEND[g.warpSubtype] : undefined,
    jariType: g.jariType ?? undefined,
    jariGrade: g.jariGrade ? JARI_GRADE_FROM_BACKEND[g.jariGrade] : undefined,
    jariColor: g.jariColor ?? undefined,
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
  getOutstandingForRecipient: (weaverId?: string, factoryLoomId?: string) => Promise<WeaverOutstandingLine[]>;
  isError: boolean;
  error: unknown;
}

const MaterialReturnContext = createContext<MaterialReturnContextValue | null>(null);

const RETURN_RECORDS_KEY = ["materialReturn", "returnRecords"] as const;

export function MaterialReturnProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;

  const { data: returnRecords = [], isError, error } = useQuery({
    queryKey: RETURN_RECORDS_KEY,
    queryFn: async () => {
      const [returnsRes, weaversRes, loomsRes] = await Promise.all([
        materialReturnsApi.list(),
        weaversApi.list().catch(() => ({ items: [] as BackendWeaver[] })),
        factoryLoomsApi.list().catch(() => ({ items: [] as BackendFactoryLoom[] })),
      ]);
      const weaverLookup = new Map(weaversRes.items.map((w: BackendWeaver) => [w.id, w.name]));
      const loomLookup = new Map(loomsRes.items.map((l: BackendFactoryLoom) => [l.id, l.loomNumber]));
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

  const getOutstandingForRecipient = useCallback(async (weaverId?: string, factoryLoomId?: string) => {
    if (!weaverId && !factoryLoomId) return [];
    const groups = await materialReturnsApi.getOutstanding({ weaverId, factoryLoomId });
    return groups.map(outstandingGroupToLine);
  }, []);

  return (
    <MaterialReturnContext.Provider value={{ returnRecords, addReturnRecord, deleteReturnRecord, getRecordsForWeaver, getOutstandingForRecipient, isError, error }}>
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
};

export function useMaterialReturn(): MaterialReturnContextValue {
  const ctx = useContext(MaterialReturnContext);
  return ctx ?? FALLBACK_MATERIAL_RETURN;
}
