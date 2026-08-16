import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, X } from "lucide-react";
import { T, F } from "../theme";
import { Button, Field, Input, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { useCustomers } from "@/features/customers";
import type { Customer } from "@/features/customers";

// ── Edit Wholesale Customer Modal ──────────────────────────────────────────
// Opened from a wholesale row in Dispatch History — edits the actual Customer
// record this dispatch's customerId points to, not the dispatch record
// itself. Since Customer is shared master data, this change is visible
// everywhere that customer appears (other orders, invoices, dispatches), not
// just the row it was opened from — that's the intended behavior, per
// product decision, rather than a per-dispatch snapshot.
export function EditWholesaleCustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { updateCustomer } = useCustomers();
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone ?? "",
    city: customer.city ?? "",
    address: customer.address ?? "",
    gstCode: customer.gstCode ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    updateCustomer(customer.id, {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      address: form.address.trim() || undefined,
      gstCode: form.gstCode.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="md">
      <div style={{ padding: 28, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={18} color={T.royalBurgundy} />
            </div>
            <div>
              <Dialog.Title asChild>
                <h3 style={{ fontFamily: F.display, fontSize: 19, color: T.luxuryBrown, margin: 0 }}>Edit Wholesale Customer</h3>
              </Dialog.Title>
              <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "3px 0 0" }}>
                Changes apply to this customer everywhere, not just this dispatch.
              </p>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} />
          </Dialog.Close>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Customer / Firm Name" required error={errors.name} id="edit-customer-name">
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            <Field label="Phone Number" id="edit-customer-phone">
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit mobile" />
            </Field>
            <Field label="City" id="edit-customer-city">
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
            </Field>
          </div>
          <Field label="Address" id="edit-customer-address">
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full delivery address" />
          </Field>
          <Field label="GST Number" id="edit-customer-gst">
            <Input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="GSTIN, if registered" />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}
