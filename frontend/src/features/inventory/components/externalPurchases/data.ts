import { FormState } from "./types";

export const EMPTY_FORM: FormState = {
  supplierId: "",
  supplier: "",
  location: "",
  date: "",
  gstNumber: "",
  invoiceNumber: "",
  billAmount: "",
  status: "Pending",
  notes: "",
  invoiceFileName: "",
  invoiceFileUrl: "",
};
