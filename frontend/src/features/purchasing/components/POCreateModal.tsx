import React, { useState, useEffect } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { X, Plus, FileText, ClipboardList, Building2 } from "lucide-react";
import { PurchaseOrder } from "../contexts/POContext";
import { useFirms } from "../../firms/contexts/FirmsContext";
import { T, F, Vendor, ExtItem, emptyItem } from "./POTypesAndVendors";
import { PODocPreview } from "./PODocPreview";
import { POMaterialRow } from "./POMaterialRow";
import { POVendorDetailsSection } from "./POVendorDetailsSection";
import { Button, IconButton, Input, Textarea, Select, SelectItem, RadioGroup, RadioField } from "../../../shared/ui/primitives";
import { vendorsApi } from "../../../shared/api/vendors";
import { purchaseOrdersApi } from "../../../shared/api/purchase-orders";

const poFormSchema = z
  .object({
    firm: z.string().min(1, "Please select a purchasing firm"),
    vendor: z.string().min(1, "Please select a vendor"),
    deliveryDate: z.string().min(1, "Please select a delivery date"),
    materials: z.array(z.object({ _key: z.union([z.string(), z.number()]), quantity: z.number() })),
  })
  .superRefine((data, ctx) => {
    data.materials.forEach((m, i) => {
      if (!m.quantity || m.quantity <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["materials", i, "quantity"] });
      }
    });
  });

interface POCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (po: PurchaseOrder) => void;
  nextPONumber: string;
}

export function POCreateModal({ open, onClose, onSubmit, nextPONumber }: POCreateModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const todayDisplay = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const { firms } = useFirms();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  useEffect(() => {
    if (!open) return;
    vendorsApi.list().then(res => setVendors(res.items.map(v => ({
      id: v.id, name: v.name, city: v.city ?? "", type: v.specialty ?? "",
      phone: v.phone ?? "", terms: v.terms ?? "", gstCode: v.gstCode ?? "",
      address: v.address ?? "", contactName: v.contactName ?? "",
    })))).catch(() => setVendors([]));
  }, [open]);

  const [selectedFirmId, setSelectedFirmId] = useState("");
  const [selectedVendorIdx, setSelectedVendorIdx] = useState<number>(-1);
  const [vendorContact, setVendorContact] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [materials, setMaterials] = useState<ExtItem[]>([{ ...emptyItem() }]);
  const [poNumber, setPoNumber] = useState(nextPONumber);
  const [notesVendor, setNotesVendor] = useState("");
  const [notesAdmin, setNotesAdmin] = useState("");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddVendor, setShowAddVendor] = useState(false);

  // Sync PO number when prop changes
  useEffect(() => {
    setPoNumber(nextPONumber);
  }, [nextPONumber]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedFirmId("");
      setSelectedVendorIdx(-1);
      setVendorContact("");
      setDeliveryDate("");
      setMaterials([{ ...emptyItem() }]);
      setPoNumber(nextPONumber);
      setNotesVendor("");
      setNotesAdmin("");
      setUrgency("Normal");
      setErrors({});
      setShowAddVendor(false);
    }
  }, [open, nextPONumber]);

  const vendor = selectedVendorIdx >= 0 ? vendors[selectedVendorIdx] : null;
  const selectedFirm = firms.find(f => f.id === selectedFirmId) ?? null;

  const validate = (): boolean => {
    const result = poFormSchema.safeParse({
      firm: selectedFirmId,
      vendor: vendor?.name ?? "",
      deliveryDate,
      materials: materials.map(m => ({ _key: m._key, quantity: m.quantity })),
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    const missing: string[] = [];
    for (const issue of result.error.issues) {
      if (issue.path[0] === "materials" && typeof issue.path[1] === "number") {
        const key = materials[issue.path[1]]?._key;
        if (key) e[`mat-${key}-qty`] = issue.message;
        if (!missing.includes("material quantity")) missing.push("material quantity");
        continue;
      }
      const field = issue.path[0];
      if (typeof field === "string") {
        if (!e[field]) e[field] = issue.message;
        const label = field === "firm" ? "Purchasing Firm" : field === "vendor" ? "Vendor" : field === "deliveryDate" ? "Expected Delivery Date" : field;
        if (!missing.includes(label)) missing.push(label);
      }
    }
    setErrors(e);
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const po: PurchaseOrder = {
      id: "temp-" + Date.now().toString(),
      poNumber: nextPONumber || `PO-${new Date().getFullYear()}-XXX`,
      vendorId: vendor!.id,
      vendor: vendor!.name,
      vendorCity: vendor!.city || "",
      vendorContact: vendorContact || undefined,
      firmName: selectedFirm?.firmName,
      deliveryDate: deliveryDate || new Date().toISOString().split("T")[0],
      materials: materials.map(m => ({
        materialType: m.materialType as any,
        subtype: m.subtype,
        description: m.description,
        quantity: m.quantity,
        unit: m.unit,
        pricePerUnit: 0,
        subtotal: 0,
      })),
      totalValue: 0,
      notesVendor: notesVendor || undefined,
      notesAdmin: notesAdmin || undefined,
      urgency,
      status: "pending",
      submittedDate: today,
      raisedBy: "Admin (BK)",
    };
    onSubmit(po);
    onClose();
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe,
    letterSpacing: "0.3px", marginBottom: 6, display: "block",
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown,
    marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.borderDef}`,
    display: "flex", alignItems: "center", gap: 8,
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFDF9",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              width: "100%",
              maxWidth: 920,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              background: T.darkBurgundy,
              padding: "20px 28px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", marginBottom: 4 }}>
                  Create Purchase Order
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, letterSpacing: "0.5px" }}>
                  New material request to vendor — requires Superadmin approval
                </div>
              </div>
              <IconButton
                onClick={onClose}
                label="Close"
                icon={X}
                variant="secondary"
                size="md"
                shape="circle"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* Body: two panels */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* LEFT PANEL — Form */}
              <div style={{
                width: "55%",
                overflowY: "auto",
                padding: "24px 28px",
                borderRight: `1px solid ${T.borderDef}`,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}>

                {/* PURCHASING FIRM */}
                <div>
                  <div style={sectionTitleStyle}><Building2 size={15} color={T.royalBurgundy} /> Purchasing Firm</div>
                  <div>
                    <label style={labelStyle} htmlFor="firm-name">Firm Name *</label>
                    <Select
                      value={selectedFirmId}
                      onValueChange={v => {
                        setSelectedFirmId(v);
                        setErrors(prev => ({ ...prev, firm: "" }));
                      }}
                      placeholder="Select purchasing firm…"
                    >
                      {firms.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.firmName}</SelectItem>
                      ))}
                    </Select>
                    {errors.firm && <div style={{ color: T.crimson, fontSize: 12, marginTop: 4 }}>{errors.firm}</div>}
                    {selectedFirm && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.10)", padding: "3px 10px", borderRadius: 6 }}>{selectedFirm.firmName}</span>
                        {selectedFirm.gstNumber && (
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>GST: {selectedFirm.gstNumber}</span>
                        )}
                        {selectedFirm.bankName && (
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>{selectedFirm.bankName}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* VENDOR DETAILS */}
                <POVendorDetailsSection
                  vendors={vendors}
                  selectedVendorIdx={selectedVendorIdx}
                  setSelectedVendorIdx={setSelectedVendorIdx}
                  vendorContact={vendorContact}
                  setVendorContact={setVendorContact}
                  vendor={vendor}
                  deliveryDate={deliveryDate}
                  setDeliveryDate={setDeliveryDate}
                  showAddVendor={showAddVendor}
                  setShowAddVendor={setShowAddVendor}
                  errors={errors}
                  setErrors={setErrors}
                  labelStyle={labelStyle}
                  sectionTitleStyle={sectionTitleStyle}
                />

                {/* MATERIALS */}
                <div>
                  <div style={sectionTitleStyle}><FileText size={15} color={T.royalBurgundy} /> Materials to Order</div>
                  <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 14px", lineHeight: 1.5 }}>
                    What materials are you ordering from this vendor?
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {materials.map(m => (
                      <POMaterialRow
                        key={m._key}
                        item={m}
                        onChange={updated => setMaterials(prev => prev.map(x => x._key === m._key ? updated : x))}
                        onRemove={() => setMaterials(prev => prev.filter(x => x._key !== m._key))}
                        canRemove={materials.length > 1}
                        errors={errors}
                      />
                    ))}
                  </div>
                  <Button
                    onClick={() => setMaterials(prev => [...prev, { ...emptyItem(), _key: Date.now() }])}
                    variant="secondary" size="lg" fullWidth className="mt-3 border-dashed" iconLeft={Plus}
                  >
                    Add Another Material
                  </Button>
                </div>

                {/* ADDITIONAL DETAILS */}
                <div>
                  <div style={sectionTitleStyle}><ClipboardList size={15} color={T.royalBurgundy} /> Additional Details</div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle} htmlFor="po-number">PO Number</label>
                    <Input id="po-number" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="font-mono" />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle} htmlFor="notes-for-vendor-optional">Notes for Vendor (optional)</label>
                    <Textarea id="notes-for-vendor-optional"
                      value={notesVendor}
                      onChange={e => setNotesVendor(e.target.value)}
                      placeholder="Any special instructions for this order..."
                      rows={3}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle} htmlFor="notes-for-superadmin-optional">Notes for Superadmin (optional)</label>
                    <Textarea id="notes-for-superadmin-optional"
                      value={notesAdmin}
                      onChange={e => setNotesAdmin(e.target.value)}
                      placeholder="Why is this order needed..."
                      rows={3}
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label style={labelStyle}>Urgency</label>
                    <RadioGroup value={urgency} onValueChange={v => setUrgency(v as "Normal" | "Urgent")} className="flex gap-3">
                      {(["Normal", "Urgent"] as const).map(u => (
                        <RadioField key={u} value={u} label={u === "Normal" ? "Normal" : "🔴 Urgent — Low Stock"} />
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                {/* Footer buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                  <Button
                    onClick={() => { void handleSubmit(); }}
                    variant="primary" size="lg" fullWidth iconLeft={ClipboardList}
                  >
                    Submit for Superadmin Approval
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="secondary" size="md" fullWidth
                  >
                    × Cancel
                  </Button>
                </div>
              </div>

              {/* RIGHT PANEL — Preview */}
              <div style={{
                width: "45%",
                overflowY: "auto",
                padding: "24px 22px",
                background: T.silkCream,
              }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, textAlign: "center", marginBottom: 14, letterSpacing: "0.4px", textTransform: "uppercase" }}>
                  PO Document Preview
                </div>
                <PODocPreview
                  vendor={vendor?.name || ""}
                  vendorCity={vendor?.city || ""}
                  vendorContact={vendorContact}
                  firmName={selectedFirm?.firmName}
                  deliveryDate={deliveryDate}
                  materials={materials}
                  poNumber={poNumber}
                  notesVendor={notesVendor}
                  urgency={urgency}
                  today={todayDisplay}
                />
                <div style={{ marginTop: 14, fontFamily: F.ui, fontSize: 12, color: T.taupe, textAlign: "center", fontStyle: "italic" }}>
                  This preview updates live as you fill the form
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
