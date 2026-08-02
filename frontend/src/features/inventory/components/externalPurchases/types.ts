import type { SareeTag } from "../../../suppliers/contexts/SupplierContext";

export interface FormState {
  /** Registered supplier this purchase is against — empty for a one-off supplier typed by hand. */
  supplierId: string;
  supplier: string;
  location: string;
  date: string;
  gstNumber: string;
  invoiceNumber: string;
  billAmount: string;
  status: string;
  notes: string;
  invoiceFileName: string;
}

// Internal per-row state for the saree details editor — carries a stable key
// (_uid) separate from the auto-generated saree code, which is recomputed
// live from the supplier/invoice number as the admin types.
export type SareeRow = Omit<SareeTag, "id"> & { _uid: string };
