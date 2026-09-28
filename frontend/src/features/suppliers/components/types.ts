// Shared TypeScript types for the Suppliers feature.

export interface SupplierFormValues {
  name: string; shortName: string; contactName: string; phone: string; whatsapp: string;
  city: string; state: string; address: string; terms: string;
  bankName: string; accountNo: string; ifscCode: string; gstCode: string;
  rating?: number; notes: string; specialty?: string;
  /** Firm.id this supplier is connected to — "" when not connected. */
  firmId: string;
}
