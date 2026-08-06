import { apiClient } from "./client";

export interface RawMaterialStockItem {
  id: string;
  materialType: "WARP" | "RESHAM" | "JARI";
  name: string;
  grade?: string | null;
  color?: string | null;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  vendorId?: string | null;
  vendor?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrnItemInput {
  materialType: "WARP" | "RESHAM" | "JARI";
  name: string;
  grade?: string;
  color?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
}

export interface CreateGrnPayload {
  vendorId?: string;
  supplierName: string;
  invoiceNo?: string;
  invoiceDate?: string;
  notes?: string;
  items: GrnItemInput[];
}

export interface GrnReceiptItem {
  id: string;
  vendorId?: string | null;
  supplierName: string;
  invoiceNo?: string | null;
  invoiceDate?: string | null;
  receivedDate: string;
  notes?: string | null;
  items: {
    id: string;
    materialType: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export const rawMaterialsApi = {
  listStock: () => apiClient.get<{ items: RawMaterialStockItem[] }>("/materials/stock"),
  listGrns: () => apiClient.get<{ items: GrnReceiptItem[] }>("/materials/grn"),
  createGrn: (payload: CreateGrnPayload) => apiClient.post<GrnReceiptItem>("/materials/grn", payload),
};
