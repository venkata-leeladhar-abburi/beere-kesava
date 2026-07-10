import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface POItem {
  materialType: "Warp" | "Resham" | "Jari";
  subtype: string;
  description?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  vendorCity: string;
  vendorContact?: string;
  deliveryDate: string;
  materials: POItem[];
  totalValue: number;
  poNumber: string;
  firmName?: string;
  notesVendor?: string;
  notesAdmin?: string;
  urgency: "Normal" | "Urgent";
  status: "pending" | "approved" | "rejected" | "received";
  submittedDate: string;
  approvedDate?: string;
  rejectionReason?: string;
  grnId?: string;
  raisedBy: string;
}

// ─── Sample PO data ───────────────────────────────────────────────────────────
const INITIAL_POS: PurchaseOrder[] = [
  {
    id: "PO-2026-020",
    poNumber: "PO-2026-020",
    vendor: "Surat Zari Works",
    vendorCity: "Surat, GJ",
    deliveryDate: "2026-06-25",
    materials: [
      { materialType: "Jari", subtype: "Polyester 2G Gold", quantity: 6, unit: "Buns", pricePerUnit: 32000, subtotal: 192000 },
    ],
    totalValue: 192000,
    urgency: "Normal",
    status: "received",
    submittedDate: "2026-06-10",
    approvedDate: "2026-06-11",
    grnId: "GRN-2026-031",
    raisedBy: "Admin (MK)",
  },
  {
    id: "PO-2026-021",
    poNumber: "PO-2026-021",
    vendor: "Kanchipuram Silks",
    vendorCity: "Kanchipuram, TN",
    deliveryDate: "2026-06-28",
    materials: [
      { materialType: "Resham", subtype: "Red", quantity: 30, unit: "kg", pricePerUnit: 7500, subtotal: 225000 },
      { materialType: "Resham", subtype: "Gold", quantity: 25, unit: "kg", pricePerUnit: 6000, subtotal: 150000 },
    ],
    totalValue: 375000,
    urgency: "Normal",
    status: "approved",
    submittedDate: "2026-06-15",
    approvedDate: "2026-06-16",
    raisedBy: "Admin (RK)",
  },
  {
    id: "PO-2026-022",
    poNumber: "PO-2026-022",
    vendor: "Sri Venkateswara Textiles",
    vendorCity: "Ongole, AP",
    deliveryDate: "2026-06-30",
    materials: [
      { materialType: "Warp", subtype: "Cotton/Silk", quantity: 50, unit: "kg", pricePerUnit: 2800, subtotal: 140000 },
    ],
    totalValue: 140000,
    urgency: "Normal",
    status: "approved",
    submittedDate: "2026-06-19",
    approvedDate: "2026-06-20",
    raisedBy: "Admin (BK)",
  },
  {
    id: "PO-2026-023",
    poNumber: "PO-2026-023",
    vendor: "Sri Venkateswara Textiles",
    vendorCity: "Ongole, AP",
    deliveryDate: "2026-07-05",
    materials: [
      { materialType: "Warp", subtype: "Cotton/Silk", quantity: 50, unit: "kg", pricePerUnit: 2800, subtotal: 140000 },
    ],
    totalValue: 140000,
    urgency: "Normal",
    status: "pending",
    submittedDate: "2026-06-21",
    raisedBy: "Admin (BK)",
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface POContextValue {
  pos: PurchaseOrder[];
  addPO: (po: PurchaseOrder) => void;
  approvePO: (id: string) => void;
  rejectPO: (id: string, reason?: string) => void;
  nextPONumber: string;
}

const POContext = createContext<POContextValue | null>(null);

export function POProvider({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);

  const addPO = useCallback((po: PurchaseOrder) => {
    setPos(prev => [po, ...prev]);
  }, []);

  const approvePO = useCallback((id: string) => {
    setPos(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: "approved" as const, approvedDate: new Date().toISOString().split("T")[0] }
          : p
      )
    );
  }, []);

  const rejectPO = useCallback((id: string, reason?: string) => {
    setPos(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: "rejected" as const, rejectionReason: reason }
          : p
      )
    );
  }, []);

  // Compute next PO number based on existing POs
  const allNums = pos
    .map(p => {
      const m = p.poNumber.match(/PO-\d{4}-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);
  const maxNum = allNums.length > 0 ? Math.max(...allNums) : 22;
  const nextPONumber = `PO-2026-${String(maxNum + 1).padStart(3, "0")}`;

  return (
    <POContext.Provider value={{ pos, addPO, approvePO, rejectPO, nextPONumber }}>
      {children}
    </POContext.Provider>
  );
}

export function usePO(): POContextValue {
  const ctx = useContext(POContext);
  if (!ctx) throw new Error("usePO must be used inside POProvider");
  return ctx;
}
