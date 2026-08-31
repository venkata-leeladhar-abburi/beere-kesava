import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackendPurchaseOrder, purchaseOrdersApi } from "../../../shared/api/purchase-orders";
import { vendorsApi } from "../../../shared/api/vendors";
import { useAuth, useAuthGate } from "../../../contexts/AuthContext";
import type { DocumentStatus } from "@/lib/domain/status";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface POItem {
  /** Real PurchaseOrderItem.id — needed to save a per-material invoice amount against it. */
  id?: string;
  materialType: "Warp" | "Resham" | "Jari";
  subtype: string;
  description?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
  invoiceAmount?: number;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendor: string;
  vendorCode?: string;
  vendorCity: string;
  vendorContact?: string;
  deliveryDate: string;
  materials: POItem[];
  totalValue: number;
  poNumber: string;
  firmId?: string;
  firmName?: string;
  notesVendor?: string;
  notesAdmin?: string;
  urgency: "Normal" | "Urgent";
  status: DocumentStatus;
  submittedDate: string;
  approvedDate?: string;
  rejectionReason?: string;
  grnId?: string;
  raisedBy: string;
  receivedBy?: { id: string; firstName: string; lastName: string };
}

// A PO raised without a price entered stays at ₹0 on its own line items
// forever — but once it's received, the real price actually paid is known
// from the GRN receipt. Receipts recorded since GrnItem.poItemId exists say
// outright which ordered line each price belongs to, so those are read back
// exactly; see grnPriceByPoItem below.
function grnPriceByPoItem(grnReceipt: BackendPurchaseOrder["grnReceipt"]): Map<string, number> {
  const totals = new Map<string, { qty: number; price: number }>();
  for (const item of grnReceipt?.items ?? []) {
    if (!item.poItemId) continue;
    const entry = totals.get(item.poItemId) ?? { qty: 0, price: 0 };
    // Summed rather than assigned: one ordered line can arrive across
    // several deliveries, and the price is a weighted average of them.
    entry.qty += Number(item.quantity) || 0;
    entry.price += Number(item.totalPrice) || 0;
    totals.set(item.poItemId, entry);
  }
  const unitPriceByPoItem = new Map<string, number>();
  for (const [poItemId, { qty, price }] of totals) {
    if (qty > 0) unitPriceByPoItem.set(poItemId, price / qty);
  }
  return unitPriceByPoItem;
}

// The fallback for receipts predating that column: a weighted average across
// every GRN line of the same material type. Blunt where one order carried two
// lines of a type, but the only thing recoverable after the fact.
function grnPriceByMaterialType(grnReceipt: BackendPurchaseOrder["grnReceipt"]): Map<string, number> {
  const totals = new Map<string, { qty: number; price: number }>();
  for (const item of grnReceipt?.items ?? []) {
    const entry = totals.get(item.materialType) ?? { qty: 0, price: 0 };
    entry.qty += Number(item.quantity) || 0;
    entry.price += Number(item.totalPrice) || 0;
    totals.set(item.materialType, entry);
  }
  const avgPricePerUnit = new Map<string, number>();
  for (const [materialType, { qty, price }] of totals) {
    if (qty > 0) avgPricePerUnit.set(materialType, price / qty);
  }
  return avgPricePerUnit;
}

// materials[] line items are populated from backend `items` relation if present.
function toPurchaseOrder(po: BackendPurchaseOrder, materials: POItem[] = []): PurchaseOrder {
  const grnPricesByPoItem = grnPriceByPoItem(po.grnReceipt);
  const grnPrices = grnPriceByMaterialType(po.grnReceipt);
  const mappedMaterials: POItem[] = (po.items && po.items.length > 0) ? po.items.map(item => {
    let pricePerUnit = Number(item.unitPrice || 0);
    let subtotal = Number(item.totalPrice || 0);
    if (subtotal === 0) {
      // Prefer the vendor's actual invoiced amount for this line (real
      // committed billing — see VendorBill) over the GRN's own recorded
      // price: a GRN can be receipted before pricing is known and stays at
      // ₹0 itself, same as the PO, while invoicedAmount is filled in once
      // the bill actually arrives.
      const invoicedAmount = item.invoicedAmount ? Number(item.invoicedAmount) : 0;
      const grnUnitPrice = grnPricesByPoItem.get(item.id) ?? grnPrices.get(item.materialType);
      if (invoicedAmount > 0) {
        subtotal = invoicedAmount;
        pricePerUnit = Number(item.quantity) > 0 ? invoicedAmount / Number(item.quantity) : 0;
      } else if (grnUnitPrice !== undefined) {
        pricePerUnit = grnUnitPrice;
        subtotal = grnUnitPrice * Number(item.quantity);
      }
    }
    return {
      id: item.id,
      materialType: (item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari") as "Warp" | "Resham" | "Jari",
      subtype: item.name,
      description: item.description ?? undefined,
      quantity: Number(item.quantity),
      unit: item.unit,
      pricePerUnit,
      subtotal,
      invoiceAmount: item.invoicedAmount ? Number(item.invoicedAmount) : undefined,
    };
  }) : materials;
  // Same fallback at the order level — a totalValue of 0 with real GRN
  // pricing recovered above would otherwise still show "Estimated Total ₹0".
  const totalValue = Number(po.totalValue) || mappedMaterials.reduce((sum, m) => sum + m.subtotal, 0);

  return {
    id: po.id,
    poNumber: po.poNumber,
    firmId: po.firmId ?? undefined,
    firmName: po.firm?.firmName ?? undefined,
    vendorId: po.vendorId,
    vendor: po.vendor.name,
    vendorCode: po.vendor.code ?? undefined,
    vendorCity: po.vendor.city ?? "",
    vendorContact: po.vendor.contactName ?? undefined,
    deliveryDate: po.deliveryDate ?? "",
    materials: mappedMaterials,
    totalValue,
    urgency: (po.urgency as PurchaseOrder["urgency"]) ?? "Normal",
    status: (po.status === "PENDING" ? "pending" : po.status === "APPROVED" ? "approved" : po.status === "REJECTED" ? "rejected" : "received") as DocumentStatus,
    submittedDate: po.createdAt,
    approvedDate: undefined,
    rejectionReason: po.rejectionReason ?? undefined,
    grnId: po.grnId ?? undefined,
    raisedBy: po.createdBy ? `${po.createdBy.firstName} ${po.createdBy.lastName}` : "Admin",
    receivedBy: po.grnReceipt?.receivedBy ? po.grnReceipt.receivedBy : undefined,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface POContextValue {
  pos: PurchaseOrder[];
  addPO: (po: PurchaseOrder) => Promise<void>;
  approvePO: (id: string) => void;
  rejectPO: (id: string, reason?: string) => void;
  deletePO: (id: string) => Promise<void>;
  nextPONumber: string;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

const POContext = createContext<POContextValue | null>(null);

const QUERY_KEY = ["purchaseOrders"] as const;

export function POProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // GET /purchase-orders is overridden on the backend to WORKER/ACCOUNTANT
  // only (ADMIN/SUPERADMIN bypass every role check). This provider is
  // shared across every portal, so an unscoped gate fired this for
  // SHOP/WEAVER too and they got back nothing but a "your role is not
  // permitted" 403.
  const enabled = useAuthGate("worker", "accountant", "admin", "superadmin");

  const { data: pos = [], isError, error, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await purchaseOrdersApi.list()).items.map(po => toPurchaseOrder(po)),
    enabled,
  });

  const setPos = (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => {
    queryClient.setQueryData<PurchaseOrder[]>(QUERY_KEY, prev => updater(prev ?? []));
  };

  const addPOMutation = useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      let vendorId = po.vendorId;
      if (!vendorId) {
        const vendorsRes = await vendorsApi.list(100);
        const match = vendorsRes.items.find(v => v.name.toLowerCase() === po.vendor.toLowerCase());
        vendorId = match?.id ?? vendorsRes.items[0]?.id;
      }
      if (!vendorId) {
        throw new Error(`Could not find vendor "${po.vendor}" to create the purchase order.`);
      }
      const created = await purchaseOrdersApi.create({
        actorId: user?.id,
        vendorId,
        // The create form has always collected a purchasing firm, but it was
        // never sent — which is why Goods Receipt History's Firm Name column
        // was blank for every order.
        firmId: po.firmId || undefined,
        deliveryDate: po.deliveryDate || undefined,
        totalValue: po.totalValue || 0,
        urgency: po.urgency,
        items: po.materials.map(m => ({
          materialType: m.materialType.toUpperCase(),
          name: m.subtype,
          description: m.description || undefined,
          quantity: m.quantity,
          unit: m.unit,
          unitPrice: m.pricePerUnit || 0,
        })),
      });
      return toPurchaseOrder(created, po.materials);
    },
    onSuccess: (po) => {
      setPos(prev => [po, ...prev.filter(p => p.id !== po.id)]);
      toast.success("Purchase order created");
    },
  });

  const approvePOMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.approve(id, user?.id),
    onSuccess: (updated) => {
      setPos(prev =>
        prev.map(p =>
          p.id === updated.id
            ? { ...p, status: "approved" as const, approvedDate: new Date().toISOString().split("T")[0] }
            : p
        )
      );
      toast.success("Purchase order approved");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to approve purchase order");
    },
  });

  const rejectPOMutation = useMutation({
    mutationFn: (args: { id: string; reason?: string }) => purchaseOrdersApi.reject(args.id, args.reason, user?.id),
    onSuccess: (updated) => {
      setPos(prev =>
        prev.map(p =>
          p.id === updated.id
            ? { ...p, status: "rejected" as const, rejectionReason: updated.rejectionReason ?? undefined }
            : p
        )
      );
      toast.success("Purchase order rejected");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to reject purchase order");
    },
  });

  const deletePOMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.remove(id),
    onSuccess: (_void, id) => setPos(prev => prev.filter(p => p.id !== id)),
  });

  const addPO = (po: PurchaseOrder): Promise<void> => addPOMutation.mutateAsync(po).then(() => undefined);
  const approvePO = (id: string) => approvePOMutation.mutate(id);
  const rejectPO = (id: string, reason?: string) => rejectPOMutation.mutate({ id, reason });
  const deletePO = (id: string): Promise<void> => deletePOMutation.mutateAsync(id).then(() => undefined);

  // Compute next PO number based on existing POs
  const nextPONumber = useMemo(() => {
    const allNums = pos
      .map(p => {
        const m = p.poNumber.match(/PO-\d{4}-(\d+)/);
        return m ? parseInt(m[1] ?? "0", 10) : 0;
      })
      .filter(n => n > 0);
    // Preview only — PurchaseOrdersService assigns the authoritative poNumber on
    // create. Starts from 0 on an empty database; it previously seeded from 22,
    // which invented "PO-2026-023" as the very first PO number.
    const maxNum = allNums.length > 0 ? Math.max(...allNums) : 0;
    return `PO-2026-${String(maxNum + 1).padStart(3, "0")}`;
  }, [pos]);

  return (
    <POContext.Provider value={{ pos, addPO, approvePO, rejectPO, deletePO, nextPONumber, isError, error, isLoading, refetch: () => void refetch() }}>
      {children}
    </POContext.Provider>
  );
}

const FALLBACK_PO: POContextValue = {
  pos: [],
  addPO: async () => {},
  approvePO: () => {},
  rejectPO: () => {},
  deletePO: async () => {},
  nextPONumber: "PO-2026-001",
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function usePO(): POContextValue {
  const ctx = useContext(POContext);
  return ctx ?? FALLBACK_PO;
}
