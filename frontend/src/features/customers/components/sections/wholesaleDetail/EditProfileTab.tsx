import React from "react";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { Button, Field, Input, Select, SelectItem, Textarea } from "../../../../../shared/ui/primitives";

export function EditProfileTab({ customer, setWholesaleTab, onSave }: {
  customer: WholesaleCustomer;
  setWholesaleTab: (t: WholesaleTab) => void;
  onSave: (updated: WholesaleCustomer) => void;
}) {
  const [terms, setTerms] = React.useState(customer.terms);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Edit Customer Profile</h3>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Business Name">
            <Input type="text" defaultValue={customer.name} id="edit-biz-name" />
          </Field>
          <Field label="Owner / Contact Name">
            <Input type="text" defaultValue={customer.contactName} id="edit-owner-name" />
          </Field>
          <Field label="Phone Number">
            <Input type="text" defaultValue={customer.phone} id="edit-phone" />
          </Field>
          <Field label="GST Number">
            <Input type="text" defaultValue={customer.gstNumber || ""} id="edit-gst-number" />
          </Field>
          <Field label="Business Address">
            <Textarea rows={2} defaultValue={customer.address} id="edit-address" />
          </Field>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="City">
            <Input type="text" defaultValue={customer.city} id="edit-city" />
          </Field>
          <Field label="Credit Terms">
            <Select value={terms} onValueChange={setTerms}>
              <SelectItem value="30 days">30 days</SelectItem>
              <SelectItem value="45 days">45 days</SelectItem>
              <SelectItem value="60 days">60 days</SelectItem>
              <SelectItem value="90 days">90 days</SelectItem>
            </Select>
          </Field>
          <Field label="Bank Name">
            <Input type="text" defaultValue={customer.bankName} id="edit-bank-name" />
          </Field>
          <Field label="Account Number">
            <Input type="text" defaultValue={customer.accountNumber} id="edit-account-number" />
          </Field>
          <Field label="IFSC Code">
            <Input type="text" defaultValue={customer.ifscCode} id="edit-ifsc-code" />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderDef}` }}>
        <Button onClick={() => setWholesaleTab("Overview")} variant="tertiary">Cancel</Button>
        <Button
          onClick={() => {
            const name = (document.getElementById("edit-biz-name") as HTMLInputElement)?.value;
            const contactName = (document.getElementById("edit-owner-name") as HTMLInputElement)?.value;
            const phone = (document.getElementById("edit-phone") as HTMLInputElement)?.value;
            const city = (document.getElementById("edit-city") as HTMLInputElement)?.value;
            const gst = (document.getElementById("edit-gst-number") as HTMLInputElement)?.value;
            const address = (document.getElementById("edit-address") as HTMLTextAreaElement)?.value;
            const bankName = (document.getElementById("edit-bank-name") as HTMLInputElement)?.value;
            const accountNumber = (document.getElementById("edit-account-number") as HTMLInputElement)?.value;
            const ifscCode = (document.getElementById("edit-ifsc-code") as HTMLInputElement)?.value;

            const updated = {
              ...customer,
              name, contactName, phone, city, gstNumber: gst, address, terms,
              bankName, accountNumber, ifscCode,
            };

            onSave(updated);
            setWholesaleTab("Overview");
          }}
          variant="primary"
        >
          ✓ Save Changes
        </Button>
      </div>
    </div>
  );
}
