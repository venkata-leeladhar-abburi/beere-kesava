import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DesignEntry {
  code: string;           // mandatory, unique
  name: string;           // design name / label
  typeCode: string;       // saree type code e.g. "HZ-003"
  typeName: string;       // saree type name e.g. "Heavy Zari"
  desc: string;           // description
  weaverName: string;     // optional weaver name
  notesForWeaver: string; // optional weaver notes
  colorSlipPhoto: string | null;  // url/dataURL or null
  designGraph: string | null;     // url/dataURL or null
  batches: number;
  total: number;
  hasColorSlip: boolean;
  hasGraph: boolean;
}

interface DesignLibraryContextValue {
  designs: DesignEntry[];
  addDesign: (d: DesignEntry) => void;
  updateDesign: (code: string, patch: Partial<DesignEntry>) => void;
  getDesign: (code: string) => DesignEntry | undefined;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const imgWarp     = "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgResham   = "https://images.unsplash.com/photo-1542044211-723ee4dada2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgJari     = "https://images.unsplash.com/photo-1643766882273-335aae5a9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgShowroom = "https://images.unsplash.com/photo-1756267318202-afebdffc107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgSaree    = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const INITIAL_DESIGNS: DesignEntry[] = [
  { code: "BKB-045", name: "Cream Zari Border Saree",  typeCode: "HZ-003", typeName: "Heavy Zari",     desc: "Cream body, gold zari border, pallu with lotus motif",         weaverName: "Ravi Kumar",   notesForWeaver: "Keep border width consistent at 5cm. Lotus motif on pallu only.", colorSlipPhoto: imgWarp,     designGraph: null,     batches: 3, total: 284, hasColorSlip: true,  hasGraph: true  },
  { code: "BKB-031", name: "Maroon Heavy Border",       typeCode: "HZ-003", typeName: "Heavy Zari",     desc: "Dark maroon with heavy gold border, traditional pallu",        weaverName: "Padma Veni",   notesForWeaver: "Gold jari border — minimum 3 passes each edge.", colorSlipPhoto: imgResham,   designGraph: null,     batches: 2, total: 196, hasColorSlip: true,  hasGraph: false },
  { code: "BKB-022", name: "Cream Plain Silk",          typeCode: "PS-002", typeName: "Plain Silk",     desc: "Plain cream silk, minimal zari, lightweight",                  weaverName: "",             notesForWeaver: "",                                                 colorSlipPhoto: imgJari,     designGraph: imgWarp,  batches: 1, total: 312, hasColorSlip: true,  hasGraph: true  },
  { code: "BKB-038", name: "Blue Zari Checks",          typeCode: "SB-001", typeName: "Self Brocade",   desc: "Blue body with gold zari check pattern",                       weaverName: "Meena R.",     notesForWeaver: "Check spacing: 2cm x 2cm throughout body.",        colorSlipPhoto: imgShowroom, designGraph: null,     batches: 2, total: 148, hasColorSlip: true,  hasGraph: false },
  { code: "BKB-019", name: "Red Bridal Zari",           typeCode: "BS-004", typeName: "Bridal Special", desc: "Deep red with heavy gold zari, bridal pallu, temple border",   weaverName: "Anand K.",     notesForWeaver: "Temple border on all four edges. Pallu: peacock motif.", colorSlipPhoto: imgSaree,  designGraph: imgResham, batches: 1, total: 84,  hasColorSlip: true,  hasGraph: true  },
  { code: "BKB-012", name: "Green Checks",              typeCode: "SB-001", typeName: "Self Brocade",   desc: "Green with small gold checks throughout",                      weaverName: "",             notesForWeaver: "",                                                 colorSlipPhoto: null,        designGraph: null,     batches: 0, total: 220, hasColorSlip: false, hasGraph: false },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const DesignLibraryContext = createContext<DesignLibraryContextValue | null>(null);

export function DesignLibraryProvider({ children }: { children: React.ReactNode }) {
  const [designs, setDesigns] = useState<DesignEntry[]>(INITIAL_DESIGNS);

  const addDesign = useCallback((d: DesignEntry) => {
    setDesigns(prev => {
      if (prev.some(x => x.code === d.code)) return prev;
      return [d, ...prev];
    });
  }, []);

  const updateDesign = useCallback((code: string, patch: Partial<DesignEntry>) => {
    setDesigns(prev => prev.map(d => d.code === code ? { ...d, ...patch } : d));
  }, []);

  const getDesign = useCallback((code: string) => {
    return designs.find(d => d.code === code);
  }, [designs]);

  return (
    <DesignLibraryContext.Provider value={{ designs, addDesign, updateDesign, getDesign }}>
      {children}
    </DesignLibraryContext.Provider>
  );
}

export function useDesignLibrary(): DesignLibraryContextValue {
  const ctx = useContext(DesignLibraryContext);
  if (!ctx) throw new Error("useDesignLibrary must be used inside DesignLibraryProvider");
  return ctx;
}
