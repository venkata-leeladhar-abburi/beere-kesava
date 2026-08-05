import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BackendDesign, designLibraryApi } from "../../../shared/api/design-library";

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
    colorSlipPhoto: d.colorSlipPhotoUrl,
    designGraph: d.designGraphUrl,
    batches: 0,
    total: 0,
    hasColorSlip: Boolean(d.colorSlipPhotoUrl),
    hasGraph: Boolean(d.designGraphUrl),
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
  recipientId: string;      // weaver id (e.g. "WV-001") or loom label (e.g. "Loom 3")
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
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const imgWarp     = "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgResham   = "https://images.unsplash.com/photo-1542044211-723ee4dada2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgJari     = "https://images.unsplash.com/photo-1643766882273-335aae5a9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgSaree    = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const INITIAL_DESIGNS: DesignEntry[] = [
  { code: "BKB-045", name: "Cream Zari Border Saree",  typeCode: "HZ-003", typeName: "Heavy Zari",     color: "Cream",  desc: "Cream body, gold zari border, pallu with lotus motif",         weaverName: "Ravi Kumar",   notesForWeaver: "Keep border width consistent at 5cm. Lotus motif on pallu only.", colorSlipPhoto: imgWarp,     designGraph: null,     batches: 3, total: 284, hasColorSlip: true,  hasGraph: true  },
  { code: "BKB-031", name: "Maroon Heavy Border",       typeCode: "HZ-003", typeName: "Heavy Zari",     color: "Maroon", desc: "Dark maroon with heavy gold border, traditional pallu",        weaverName: "Padma Veni",   notesForWeaver: "Gold jari border — minimum 3 passes each edge.", colorSlipPhoto: imgResham,   designGraph: null,     batches: 2, total: 196, hasColorSlip: true,  hasGraph: false },
  { code: "BKB-022", name: "Cream Plain Silk",          typeCode: "PS-002", typeName: "Plain Silk",     color: "Cream",  desc: "Plain cream silk, minimal zari, lightweight",                  weaverName: "",             notesForWeaver: "",                                                 colorSlipPhoto: imgJari,     designGraph: imgWarp,  batches: 1, total: 312, hasColorSlip: true,  hasGraph: true  },
  { code: "BKB-038", name: "Blue Zari Checks",          typeCode: "SB-001", typeName: "Self Brocade",   color: "Blue",   desc: "Blue body with gold zari check pattern",                       weaverName: "Meena R.",     notesForWeaver: "Check spacing: 2cm x 2cm throughout body.",        colorSlipPhoto: imgJari,     designGraph: null,     batches: 2, total: 148, hasColorSlip: true,  hasGraph: false },
  { code: "BKB-019", name: "Red Bridal Zari",           typeCode: "BS-004", typeName: "Bridal Special", color: "Red",    desc: "Deep red with heavy gold zari, bridal pallu, temple border",   weaverName: "Anand K.",     notesForWeaver: "Temple border on all four edges. Pallu: peacock motif.", colorSlipPhoto: imgSaree,  designGraph: imgResham, batches: 1, total: 84,  hasColorSlip: true,  hasGraph: true  },
  { code: "BKB-052", name: "Pochampally Ikat",          typeCode: "BS-004", typeName: "Bridal Special", color: "Indigo", desc: "Indigo ikat body with contrast temple border",                weaverName: "Padma Veni",   notesForWeaver: "Keep ikat alignment tight across the pallu join.", colorSlipPhoto: imgResham,   designGraph: null,     batches: 1, total: 96,  hasColorSlip: true,  hasGraph: false },
  { code: "BKB-012", name: "Green Checks",              typeCode: "SB-001", typeName: "Self Brocade",   color: "Green",  desc: "Green with small gold checks throughout",                      weaverName: "",             notesForWeaver: "",                                                 colorSlipPhoto: null,        designGraph: null,     batches: 0, total: 220, hasColorSlip: false, hasGraph: false },
];

const INITIAL_DISPATCHES: DispatchRecord[] = [
  {
    id: "DISP-001",
    recipientType: "weaver",
    recipientId: "WV-002",
    recipientName: "Padma Veni",
    batches: ["BATCH-086"],
    instructions: "Maintain light warp tension in the borders. Ensure Resham thread transition is smooth in pallu section.",
    colorSlipImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    designGraphImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    sentAt: "15 Jul 2026, 09:30 AM",
  },
  {
    id: "DISP-002",
    recipientType: "loom",
    recipientId: "Loom 3",
    recipientName: "Loom 3",
    batches: ["BATCH-OWN"],
    instructions: "Run at standard speed. Check for any zari threads snapping before finalizing the border weave.",
    colorSlipImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    designGraphImage: null,
    sentAt: "14 Jul 2026, 04:15 PM",
  },
  {
    id: "DISP-005",
    recipientType: "loom",
    recipientId: "Loom F-01",
    recipientName: "Loom F-01",
    batches: ["BATCH-090"],
    instructions: "Keep the pallu motif centred — this run is for general stock, so match the BKB-045 reference slip exactly.",
    colorSlipImage: "https://images.unsplash.com/photo-1542044211-723ee4dada2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    designGraphImage: null,
    sentAt: "24 Jun 2026, 10:05 AM",
  },
  {
    id: "DISP-006",
    recipientType: "loom",
    recipientId: "Loom F-01",
    recipientName: "Loom F-01",
    batches: ["BATCH-088"],
    instructions: "Heavy Zari piece in this batch needs a 6cm border. Other two stay on the standard Self Brocade setting.",
    colorSlipImage: "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    designGraphImage: "https://images.unsplash.com/photo-1643766882273-335aae5a9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    sentAt: "20 Jun 2026, 09:20 AM",
  },
  {
    id: "DISP-003",
    recipientType: "weaver",
    recipientId: "WV-001",
    recipientName: "Ravi Kumar",
    batches: ["BATCH-094"],
    instructions: "Keep border width consistent at 5cm. Lotus motif on pallu only — double-check alignment before starting each saree.",
    colorSlipImage: "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    designGraphImage: null,
    sentAt: "01 Jul 2026, 08:45 AM",
  },
  {
    id: "DISP-004",
    recipientType: "weaver",
    recipientId: "WV-001",
    recipientName: "Ravi Kumar",
    batches: ["BATCH-078"],
    instructions: "Check spacing: 2cm x 2cm throughout body. Keep zari check pattern even across all four sarees.",
    colorSlipImage: "https://images.unsplash.com/photo-1643766882273-335aae5a9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    designGraphImage: null,
    sentAt: "10 May 2026, 09:10 AM",
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const DesignLibraryContext = createContext<DesignLibraryContextValue | null>(null);

const DESIGNS_KEY = ["designLibrary", "designs"] as const;
const DISPATCHES_KEY = ["designLibrary", "dispatches"] as const;

export function DesignLibraryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: designs = [] } = useQuery({
    queryKey: DESIGNS_KEY,
    queryFn: async () => (await designLibraryApi.list()).items.map(backendDesignToEntry),
  });

  const { data: dispatches = INITIAL_DISPATCHES } = useQuery({
    queryKey: DISPATCHES_KEY,
    queryFn: () => Promise.resolve(INITIAL_DISPATCHES),
    initialData: INITIAL_DISPATCHES,
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
    onSuccess: (created) =>
      queryClient.setQueryData<DesignEntry[]>(DESIGNS_KEY, prev => {
        const list = prev ?? [];
        const entry = backendDesignToEntry(created);
        if (list.some(x => x.code === entry.code)) return list;
        return [entry, ...list];
      }),
  });

  // Local-only: notesForWeaver/weaverName patches used for the design-detail
  // UI don't have a backend PATCH surface wired yet, so keep this optimistic
  // and client-side (matches the previous mock behaviour) rather than
  // silently failing against the API.
  const updateDesignMutation = useMutation({
    mutationFn: (args: { code: string; patch: Partial<DesignEntry> }) => Promise.resolve(args),
    onSuccess: ({ code, patch }) =>
      queryClient.setQueryData<DesignEntry[]>(DESIGNS_KEY, prev =>
        (prev ?? []).map(d => d.code === code ? { ...d, ...patch } : d)
      ),
  });

  const addDispatchMutation = useMutation({
    mutationFn: (d: Omit<DispatchRecord, "id" | "sentAt">) => Promise.resolve(d),
    onSuccess: (d) =>
      queryClient.setQueryData<DispatchRecord[]>(DISPATCHES_KEY, prev => {
        const list = prev ?? [];
        const created: DispatchRecord = {
          ...d,
          id: `DISP-${String(list.length + 1).padStart(3, "0")}`,
          sentAt: new Date().toLocaleString("en-US", {
            day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
          }),
        };
        return [created, ...list];
      }),
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
    <DesignLibraryContext.Provider value={{ designs, addDesign, updateDesign, getDesign, dispatches, addDispatch, getDispatchesForWeaver }}>
      {children}
    </DesignLibraryContext.Provider>
  );
}

export function useDesignLibrary(): DesignLibraryContextValue {
  const ctx = useContext(DesignLibraryContext);
  if (!ctx) throw new Error("useDesignLibrary must be used inside DesignLibraryProvider");
  return ctx;
}
