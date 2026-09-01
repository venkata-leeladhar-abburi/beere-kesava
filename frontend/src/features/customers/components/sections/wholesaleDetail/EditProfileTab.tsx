import React from "react";
import { T } from "../../theme";
import { WholesaleCustomer, WholesaleTab } from "../../types";
import { Button, Field, Input, PhoneInput, Textarea } from "../../../../../shared/ui/primitives";
import { VisitingCardUploadField } from "../../../../../shared/ui/VisitingCardUploadField";

export function EditProfileTab({ customer, setWholesaleTab, onSave }: {
  customer: WholesaleCustomer;
  setWholesaleTab: (t: WholesaleTab) => void;
  onSave: (updated: WholesaleCustomer) => void;
}) {
  const [cardUrl, setCardUrl] = React.useState<string | null>(customer.visitingCard || null);
  const [name, setName] = React.useState(customer.name);
  const [contactName, setContactName] = React.useState(customer.contactName);
  const [phone, setPhone] = React.useState(customer.phone);
  const [whatsapp, setWhatsapp] = React.useState(customer.whatsapp || "");
  const [city, setCity] = React.useState(customer.city);
  const [state, setState] = React.useState(customer.state || "Andhra Pradesh");
  const [address, setAddress] = React.useState(customer.address);
  const [terms, setTerms] = React.useState(customer.terms || "30 days");
  const [bankName, setBankName] = React.useState(customer.bankName);
  const [accountNumber, setAccountNumber] = React.useState(customer.accountNumber);
  const [ifscCode, setIfscCode] = React.useState(customer.ifscCode);
  const [gstNumber, setGstNumber] = React.useState(customer.gstNumber || "");
  const [notes, setNotes] = React.useState(customer.notes || "");

  const handleSave = () => {
    onSave({
      ...customer,
      name,
      contactName,
      phone,
      whatsapp,
      city,
      state,
      address,
      terms,
      bankName,
      accountNumber,
      ifscCode,
      gstNumber,
      notes,
      visitingCard: cardUrl || "",
    });
    setWholesaleTab("Overview");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32 }}>
        {/* Col 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Business Name *">
            <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name of the business or shop" />
          </Field>
          <Field label="Owner / Contact Name *">
            <Input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Who to speak to at this business" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            <Field label="Phone Number *">
              <PhoneInput value={phone} onValueChange={setPhone} />
            </Field>
            <Field label="WhatsApp Number">
              <Input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="If different" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            <Field label="City *">
              <Input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
            </Field>
            <Field label="State *">
              <Input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="State" />
            </Field>
          </div>
        </div>

        {/* Col 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Business Address">
            <Textarea placeholder="Full address for delivery and billing" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
          </Field>
          <Field label="Payment Terms *">
            <Input type="text" value={terms} onChange={e => setTerms(e.target.value)} placeholder="e.g. 30 days" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            <Field label="Bank Name">
              <Input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="For any refunds" />
            </Field>
            <Field label="Account Number">
              <Input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account No." />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            <Field label="IFSC Code">
              <Input type="text" value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="e.g. HDFC0001842" />
            </Field>
            <Field label="GST Number">
              <Input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" />
            </Field>
          </div>
          <VisitingCardUploadField cardUrl={cardUrl} onChange={setCardUrl} />
          <Field label="Notes">
            <Input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderDef}` }}>
        <Button onClick={() => setWholesaleTab("Overview")} variant="tertiary">Cancel</Button>
        <Button onClick={handleSave} variant="primary">✓ Save Changes</Button>
      </div>
    </div>
  );
}
