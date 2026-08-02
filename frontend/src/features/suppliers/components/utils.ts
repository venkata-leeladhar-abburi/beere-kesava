// Pure helper functions for the Suppliers feature.

import { SupplierFormValues } from "./types";

export function emptyForm(): SupplierFormValues {
  return {
    name: "", contactName: "", phone: "", whatsapp: "",
    city: "", state: "Andhra Pradesh", address: "", terms: "30 days",
    bankName: "", accountNo: "", gstCode: "", rating: 3, notes: "",
  };
}
