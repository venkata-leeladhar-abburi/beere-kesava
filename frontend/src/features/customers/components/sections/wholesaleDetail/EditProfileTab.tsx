import React from "react";
import { T, F } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { Button, Field, Input, Select, SelectItem } from "../../../../../shared/ui/primitives";

export function EditProfileTab({ customer, setWholesaleTab, onSave }: {
  customer: WholesaleCustomer;
  setWholesaleTab: (t: WholesaleTab) => void;
  onSave: (updated: WholesaleCustomer) => void;
}) {
  const [terms, setTerms] = React.useState(customer.terms);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Edit Customer Profile</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Business Name">
            <Input type="text" defaultValue={customer.name} id="edit-biz-name" />
          </Field>
          <Field label="Owner Name">
            <Input type="text" defaultValue="Ramesh Rao" id="edit-owner-name" />
          </Field>
          <Field label="GST Number">
            <Input type="text" defaultValue={customer.gstNumber || ""} id="edit-gst-number" />
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
          <Field label="Outstanding Amount (₹)">
            <Input type="text" defaultValue={customer.out} id="edit-out" />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderDef}` }}>
        <Button onClick={() => setWholesaleTab("Overview")} variant="tertiary">Cancel</Button>
        <Button
          onClick={() => {
            const name = (document.getElementById("edit-biz-name") as HTMLInputElement)?.value;
            const city = (document.getElementById("edit-city") as HTMLInputElement)?.value;
            const gst = (document.getElementById("edit-gst-number") as HTMLInputElement)?.value;
            const out = (document.getElementById("edit-out") as HTMLInputElement)?.value;

            const updated = {
              ...customer,
              name, city, gstNumber: gst, terms, out,
              status: out === "0" ? "clear" : customer.status
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
