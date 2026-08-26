import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackendDesign, designLibraryApi } from "../../../shared/api/design-library";
import { designDispatchesApi, BackendDesignDispatch } from "../../../shared/api/design-dispatches";
import { resolveAssetUrl } from "../../../shared/api/uploads";

function backendDesignToEntry(d: BackendDesign): DesignEntry {
  return {
    code: d.code,
    name: d.name,
    typeCode: d.typeCode,
    typeName: d.typeName,
    desc: d.description ?? "",
    color: d.color ?? "",
    weaverName: "",
    notesForWeaver: d.notesForWeaver ?? "",
    colorSlipPhoto: resolveAssetUrl(d.colorSlipPhotoUrl),
    designGraph: resolveAssetUrl(d.designGraphUrl),
    batches: 0,
    total: 0,
    hasColorSlip: Boolean(d.colorSlipPhotoUrl),
    hasGraph: Boolean(d.designGraphUrl),
  };
}

function backendDispatchToRecord(d: BackendDesignDispatch): DispatchRecord {
  return {
    id: d.id,
    recipientType: d.recipientType === "WEAVER" ? "weaver" : "loom",
    recipientId: d.recipientId,
    recipientName: d.recipientName,
    batches: d.batches,
    instructions: d.instructions,
    // Stored as a server-relative upload path; resolveAssetUrl prefixes the API
    // origin (and passes through legacy inline data: URLs untouched).
    colorSlipImage: resolveAssetUrl(d.colorSlipImageUrl),
    designGraphImage: resolveAssetUrl(d.designGraphImageUrl),
    sentAt: new Date(d.sentAt).toLocaleString("en-US", {
      day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
    }),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DesignEntry {
  code: string;           // mandatory, unique
  name: string;           // design name / label
  typeCode: string;       // saree type code e.g. "HZ-003"
  typeName: string;       // saree type name e.g. "Heavy Zari"
  desc: string;           // description
  color: string;          // body colour of the saree, shown in saree listings
  weaverName: string;     // optional weaver name
  notesForWeaver: string; // optional weaver notes
  colorSlipPhoto: string | null;  // url/dataURL or null
  designGraph: string | null;     // url/dataURL or null
  batches: number;
  total: number;
  hasColorSlip: boolean;
  hasGraph: boolean;
}

export interface DispatchRecord {
  id: string;
  recipientType: "weaver" | "loom";
  recipientId: string;      // weaver id (e.g. "b5f9178c-b1b9-4871-a7c3-0d68a462d57a") or loom label (e.g. "Loom 3")
  recipientName: string;
  batches: string[];        // linked batch IDs
  instructions: string;
  colorSlipImage: string | null;
  designGraphImage: string | null;
  sentAt: string;
}

interface DesignLibraryContextValue {
  designs: DesignEntry[];
  addDesign: (d: DesignEntry) => void;
  updateDesign: (code: string, patch: Partial<DesignEntry>) => void;
  getDesign: (code: string) => DesignEntry | undefined;
  dispatches: DispatchRecord[];
  addDispatch: (d: Omit<DispatchRecord, "id" | "sentAt">) => DispatchRecord;
  getDispatchesForWeaver: (weaverId: string) => DispatchRecord[];
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const DesignLibraryContext = createContext<DesignLibraryContextValue | null>(null);

const DESIGNS_KEY = ["designLibrary", "designs"] as const;
const DISPATCHES_KEY = ["designLibrary", "dispatches"] as const;

export function DesignLibraryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: designs = [], isError, error, isLoading, refetch } = useQuery({
    queryKey: DESIGNS_KEY,
    queryFn: async () => (await designLibraryApi.list()).items.map(backendDesignToEntry),
  });

  const { data: dispatches = [] } = useQuery({
    queryKey: DISPATCHES_KEY,
    queryFn: async () => (await designDispatchesApi.list()).items.map(backendDispatchToRecord),
  });

  // Real backend create — the design library is a real Phase 2 module, so
  // codes created here must exist server-side for batch-row assignment to
  // later succeed (see BatchContext / assignRow validation).
  const addDesignMutation = useMutation({
    mutationFn: (d: DesignEntry) =>
      designLibraryApi.create({
        code: d.code,
        name: d.name || d.code,
        typeCode: d.typeCode || "GEN",
        typeName: d.typeName || "General",
        description: d.desc || undefined,
        color: d.color || undefined,
        notesForWeaver: d.notesForWeaver || undefined,
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<DesignEntry[]>(DESIGNS_KEY, prev => {
        const list = prev ?? [];
        const entry = backendDesignToEntry(created);
        if (list.some(x => x.code === entry.code)) return list;
        return [entry, ...list];
      });
      toast.success("Design added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add design");
    },
  });

  // Local-only: notesForWeaver/weaverName patches used for the design-detail
  // UI don't have a backend PATCH surface wired yet, so keep this optimistic
  // and client-side (matches the previous mock behaviour) rather than
  // silently failing against the API.
  const updateDesignMutation = useMutation({
    mutationFn: (args: { code: string; patch: Partial<DesignEntry> }) => Promise.resolve(args),
    onSuccess: ({ code, patch }) => {
      queryClient.setQueryData<DesignEntry[]>(DESIGNS_KEY, prev =>
        (prev ?? []).map(d => d.code === code ? { ...d, ...patch } : d)
      );
      toast.success("Design updated");
    },
  });

  const addDispatchMutation = useMutation({
    mutationFn: (d: Omit<DispatchRecord, "id" | "sentAt">) =>
      designDispatchesApi.create({
        recipientType: d.recipientType === "weaver" ? "WEAVER" : "FACTORY_LOOM",
        recipientId: d.recipientId,
        recipientName: d.recipientName,
        instructions: d.instructions,
        colorSlipImageUrl: d.colorSlipImage,
        designGraphImageUrl: d.designGraphImage,
        batches: d.batches,
      }),
    onSuccess: (created: BackendDesignDispatch) => {
      queryClient.setQueryData<DispatchRecord[]>(DISPATCHES_KEY, prev => {
        const list = prev ?? [];
        return [backendDispatchToRecord(created), ...list];
      });
      toast.success("Design dispatched");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to dispatch design");
    },
  });

  const addDesign = (d: DesignEntry) => addDesignMutation.mutate(d);
  const updateDesign = (code: string, patch: Partial<DesignEntry>) => updateDesignMutation.mutate({ code, patch });
  const getDesign = useCallback((code: string) => designs.find(d => d.code === code), [designs]);

  const addDispatch = (d: Omit<DispatchRecord, "id" | "sentAt">): DispatchRecord => {
    const created: DispatchRecord = {
      ...d,
      id: `DISP-${String(dispatches.length + 1).padStart(3, "0")}`,
      sentAt: new Date().toLocaleString("en-US", {
        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
      }),
    };
    addDispatchMutation.mutate(d);
    return created;
  };

  const getDispatchesForWeaver = useCallback(
    (weaverId: string) => dispatches.filter(d => d.recipientType === "weaver" && d.recipientId === weaverId),
    [dispatches]
  );

  return (
    <DesignLibraryContext.Provider value={{ designs, addDesign, updateDesign, getDesign, dispatches, addDispatch, getDispatchesForWeaver, isError, error, isLoading, refetch: () => void refetch() }}>
      {children}
    </DesignLibraryContext.Provider>
  );
}

const FALLBACK_DESIGN_LIBRARY: DesignLibraryContextValue = {
  designs: [],
  addDesign: () => {},
  updateDesign: () => {},
  getDesign: () => undefined,
  dispatches: [],
  addDispatch: (d) => ({ id: "", sentAt: "", ...d } as DispatchRecord),
  getDispatchesForWeaver: () => [],
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useDesignLibrary(): DesignLibraryContextValue {
  const ctx = useContext(DesignLibraryContext);
  return ctx ?? FALLBACK_DESIGN_LIBRARY;
}
