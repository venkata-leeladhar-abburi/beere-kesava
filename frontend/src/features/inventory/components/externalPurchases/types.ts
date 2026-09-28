import type { DiscountType, SareeTag } from "@/features/suppliers";

export interface FormState {
  /** Registered supplier this purchase is against — empty for a one-off supplier typed by hand. */
  supplierId: string;
  supplier: string;
  location: string;
  date: string;
  gstNumber: string;
  invoiceNumber: string;
  /** Whether discountValue is a % of the sarees' total or a flat ₹ amount. */
  discountType: DiscountType;
  discountValue: string;
  /** GST tax rate (%) charged on the total after discount. */
  gstPercent: string;
  notes: string;
  invoiceFileName: string;
  /** Uploaded invoice file's stored cloud path — set once handleInvoiceFile's upload resolves. */
  invoiceFileUrl: string;
}

// Internal per-row state for the saree details editor — carries a stable key
// (_uid) separate from the auto-generated saree code, which is recomputed
// live from the supplier/invoice number as the admin types.
export type SareeRow = Omit<SareeTag, "id"> & { _uid: string };
