import React, { useState } from "react";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X as LucideX } from "lucide-react";
import { BulkOrder } from "../contexts/BulkOrderContext";
import { WholesaleCustomerSelectSection, useAllWholesaleCustomers } from "./WholesaleCustomerSelectSection";
import { Button, IconButton, Field, Input, NumberInput, Textarea } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";
import { DatePicker, formatDate } from "../../../shared/ui/date";

// Validation schema for the raw string form fields (inputs are all `type="text"`-shaped
// under the hood, so numeric/date fields are validated as strings and coerced on submit).
const bulkOrderFormSchema = z.object({
  customerId: z.string().min(1, "Please select a wholesale customer"),
  quantity: z
    .string()
    .refine(v => parseInt(v, 10) >= 1, "Quantity must be at least 1"),
  deliveryDate: z.string().min(1, "Please select a delivery deadline"),
});

const T = {
  royalBurgundy: "#6E0F2D", darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47", luxuryBrown: "#3B2314",
  taupe: "#69635E", crimson: "#C0392B",
  warmIvory: "#FFFDF9",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

function formatDateLabel(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (order: BulkOrder) => void;
  nextRef: string;
  onAddCustomerClick?: () => void;
}

export function BulkOrderCreateModal({ open, onClose, onSubmit, nextRef, onAddCustomerClick }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [visitingCard, setVisitingCard] = useState<File | null>(null);
  const [gstCode, setGstCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [photos, setPhotos] = useState<File[]>([]);

  const wholesaleCustomersList = useAllWholesaleCustomers();

  const selectedCustomer = wholesaleCustomersList.find(c => c.id === customerId);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const selected = wholesaleCustomersList.find(c => c.id === id);
    if (selected) {
      setAddress(selected.address || "");
      setPhone(selected.phone || "");
      setGstCode(selected.gstCode || "");
    } else {
      setAddress("");
      setPhone("");
      setGstCode("");
    }
  };

  const validate = () => {
    const result = bulkOrderFormSchema.safeParse({ customerId, quantity, deliveryDate });
    if (result.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !e[field]) e[field] = issue.message;
    }
    setErrors(e);
    return false;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const customer = wholesaleCustomersList.find(c => c.id === customerId)!;
    const order: BulkOrder = {
      ref: nextRef,
      customer: customer.name,
      customerId: customer.id,
      due: formatDateLabel(deliveryDate),
      status: "on-track",
      sareeType: "",
      design: "",
      done: 0,
      total: parseInt(quantity, 10),
      instructions: instructions || undefined,
      createdDate: new Date().toISOString().split("T")[0],
      dispatchStatus: "pending",
      paymentStatus: "pending",
      amountDue: estimatedValue ? parseInt(estimatedValue, 10) : 0,
      amountPaid: 0,
      address: address || undefined,
      phone: phone || undefined,
      gstCode: gstCode || undefined,
      visitingCardUrl: visitingCard ? URL.createObjectURL(visitingCard) : undefined,
      visitingCardName: visitingCard ? visitingCard.name : undefined,
      photoUrls: photos.map(p => URL.createObjectURL(p)),
    };
    onSubmit(order);
    setCustomerId(""); setAddress(""); setPhone(""); setVisitingCard(null); setGstCode("");
    setPhotos([]);
    setQuantity(""); setDeliveryDate(""); setEstimatedValue(""); setInstructions(""); setPriority("Normal"); setErrors({});
  };

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  const labelStyle: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6, display: "block",
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe,
    textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16,
    paddingBottom: 8, borderBottom: `1px solid ${T.borderDef}`,
  };

  return (
    <Modal open={open} onOpenChange={o => !o && onClose()} size="lg">
            {/* Header */}
            <div style={{
              background: `linear-gradient(100deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`,
              padding: "22px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <Dialog.Title asChild>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9" }}>
                    Create Bulk Order
                  </div>
                </Dialog.Title>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, marginTop: 4 }}>
                  New wholesale customer order · {nextRef}
                </div>
              </div>
              <Dialog.Close asChild>
                <span style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8 }}>
                  <IconButton
                    icon={LucideX}
                    variant="ghost"
                    size="md"
                    label="Close"
                  />
                </span>
              </Dialog.Close>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: "28px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Section 1 — Customer */}
              <WholesaleCustomerSelectSection
                customerId={customerId}
                handleCustomerSelect={handleCustomerSelect}
                errors={errors}
                selectedCustomer={selectedCustomer}
                onClose={onClose}
                onAddCustomerClick={onAddCustomerClick}
                wholesaleCustomersList={wholesaleCustomersList}
              />

              {/* Section 2 — Order Details */}
              <div>
                <div style={sectionLabel}>2 · Order Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Order Photos (Multiple allowed)</label>
                    <div style={{ border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, padding: "14px 16px", background: T.warmIvory, display: "flex", flexDirection: "column", gap: 12 }}>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        id="bulk-order-photos-upload"
                        containerClassName="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          setPhotos(prev => [...prev, ...files]);
                        }}
                      />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {photos.map((file, idx) => (
                          <div key={idx} style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
                            <img src={URL.createObjectURL(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <span style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "rgba(61,14,26,0.8)", color: "#FFF", display: "inline-flex" }}>
                              <IconButton
                                type="button"
                                onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                                icon={LucideX}
                                variant="ghost"
                                size="sm"
                                label="Remove photo"
                              />
                            </span>
                          </div>
                        ))}
                        <label htmlFor="bulk-order-photos-upload" style={{ width: 72, height: 72, borderRadius: 10, border: `1.5px dashed ${T.borderDef}`, background: "rgba(110,15,45,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <span style={{ fontSize: 20, color: T.royalBurgundy, fontWeight: 300 }}>+</span>
                          <span style={{ fontSize: 12, color: T.taupe, fontWeight: 600 }}>Add Photo</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <Field label="Quantity (sarees)" error={errors.quantity} id="quantity-sarees">
                    <Input id="quantity-sarees"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder="e.g. 40"
                      invalid={!!errors.quantity}
                    />
                  </Field>

                  <Field label="Delivery Deadline" error={errors.deliveryDate} id="delivery-deadline">
                    <DatePicker
                      id="delivery-deadline"
                      min={today}
                      value={deliveryDate ? new Date(deliveryDate) : null}
                      onChange={date => setDeliveryDate(date ? formatDate(date, "iso") : "")}
                    />
                  </Field>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Estimated Value (₹)" id="estimated-value">
                      <Input id="estimated-value"
                        type="number"
                        min="0"
                        value={estimatedValue}
                        onChange={e => setEstimatedValue(e.target.value)}
                        placeholder="Enter estimated value"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Section 3 — Additional */}
              <div>
                <div style={sectionLabel}>3 · Additional</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Special Instructions (Optional)" id="special-instructions-optional">
                    <Textarea
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      placeholder="Any special production or packaging instructions..."
                      rows={3}
                    />
                  </Field>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <div style={{ display: "flex", gap: 16 }}>
                      {(["Normal", "Urgent"] as const).map(p => (
                        <Button
                          key={p}
                          onClick={() => setPriority(p)}
                          variant={priority === p ? (p === "Urgent" ? "danger-subtle" : "primary") : "tertiary"}
                          size="md"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: "20px 28px", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <Button
                onClick={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
              >
                ✓ Create Bulk Order
              </Button>
              <Button
                onClick={onClose}
                variant="tertiary"
                size="md"
                fullWidth
              >
                × Cancel
              </Button>
            </div>
    </Modal>
  );
}
