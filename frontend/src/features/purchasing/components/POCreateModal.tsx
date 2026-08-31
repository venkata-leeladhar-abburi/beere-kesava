import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, FileText, ClipboardList, Building2, Eye, EyeOff } from "lucide-react";
import { PurchaseOrder } from "../contexts/POContext";
import { useFirms } from "@/features/firms";
import { T, F, Vendor, ExtItem, emptyItem } from "./POTypesAndVendors";
import { PODocPreview } from "./PODocPreview";
import { POMaterialRow } from "./POMaterialRow";
import { POVendorDetailsSection } from "./POVendorDetailsSection";
import { Button, IconButton, Input, Textarea, Select, SelectItem, RadioGroup, RadioField } from "../../../shared/ui/primitives";
import { vendorsApi } from "../../../shared/api/vendors";
import { Modal } from "../../../shared/ui/overlay";

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
  // Stacked-layout only: from `lg` up the preview panel is always visible, so
  // this toggle exists purely so phones/tablets aren't forced to scroll past a
  // full A4 sheet to reach the form.
  const [showPreview, setShowPreview] = useState(false);

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
      setShowPreview(false);
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
    // Both ids are placeholders: PurchaseOrdersService assigns the real id and
    // poNumber on create and the values sent from here are discarded.
    const po: PurchaseOrder = {
      id: "",
      poNumber: nextPONumber || "",
      vendorId: vendor!.id,
      vendor: vendor!.name,
      vendorCity: vendor!.city || "",
      vendorContact: vendorContact || undefined,
      // firmId is the half that actually persists — POContext sends it to the
      // backend as PurchaseOrder.firmId. It was previously omitted here while
      // only the display-only `firmName` was set, so every order was saved
      // with firmId: null despite "Purchasing Firm" being a required field.
      // That broke the firm's ledger (the order never appeared against it)
      // and left Goods Receipt History's firm column blank.
      firmId: selectedFirmId,
      firmName: selectedFirm?.firmName,
      deliveryDate: deliveryDate || new Date().toISOString().split("T")[0],
      materials: materials.map(m => ({
        materialType: m.materialType,
        subtype: m.subtype,
        description: m.description,
        quantity: m.quantity,
        unit: m.unit,
        pricePerUnit: m.pricePerUnit || 0,
        subtotal: m.subtotal || (m.pricePerUnit || 0) * (m.quantity || 0),
      })),
      totalValue: materials.reduce((sum, m) => sum + (m.subtotal || (m.pricePerUnit || 0) * (m.quantity || 0)), 0),
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

  return (
    <Modal open={open} onOpenChange={o => !o && onClose()} size="xl">
      {/* Header */}
      <div
        className="flex shrink-0 items-start justify-between gap-3 px-[18px] py-[16px] sm:px-[26px] sm:py-[20px]"
        style={{ background: T.darkBurgundy }}
      >
        <div className="min-w-0">
          <Dialog.Title asChild>
            <div
              className="text-[17px] leading-tight sm:text-[20px]"
              style={{ fontFamily: F.display, fontWeight: 700, color: "#FFFDF9" }}
            >
              Create Purchase Order
            </div>
          </Dialog.Title>
          <Dialog.Description className="sr-only">Create a new purchase order</Dialog.Description>
          <div
            className="mt-[4px] text-[11px] leading-snug sm:text-[12px]"
            style={{ fontFamily: F.ui, color: T.antiqueGold, letterSpacing: "0.4px" }}
          >
            New material request to vendor — requires Superadmin approval
          </div>
        </div>
        <Dialog.Close asChild>
          <IconButton
            label="Close"
            icon={X}
            variant="secondary"
            size="md"
            shape="circle"
            className="shrink-0 bg-white/10 border-white/20 text-white"
          />
        </Dialog.Close>
      </div>

      {/* Body — two panels side by side from `lg` up. Below that the preview
          stacks under the form (collapsed by default) instead of squeezing
          both panels into a horizontally-scrolling strip, which is what made
          the fields overflow on narrow screens. */}
      {/* Below `lg` this whole body is ONE scroll region — giving the form and
          the stacked preview their own `overflow-y-auto` each put two
          scrollbars on top of each other, so a flick over the preview scrolled
          the sheet inside its box instead of the page. From `lg` up the two
          panels sit side by side and each scrolls independently, which is what
          you want when they're columns. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* LEFT — Form */}
        <div
          className="flex min-w-0 flex-col gap-[20px] px-[18px] py-[20px] sm:px-[26px] sm:py-[24px] lg:w-[56%] lg:overflow-y-auto lg:border-r"
          style={{ borderColor: T.borderDef }}
        >
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
                className="w-full"
              >
                {firms.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.firmName}</SelectItem>
                ))}
              </Select>
              {errors.firm && <div style={{ color: T.crimson, fontSize: 12, marginTop: 4 }}>{errors.firm}</div>}
              {selectedFirm && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.10)", padding: "3px 10px", borderRadius: 6 }}>{selectedFirm.firmName}</span>
                  {selectedFirm.gstNumber && (
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>GST: {selectedFirm.gstNumber}</span>
                  )}
                  {selectedFirm.bankName && (
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>{selectedFirm.bankName}</span>
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
              What materials are you ordering from this vendor? Rates are settled with the vendor separately — only the material and quantity are captured here.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {materials.map((m, i) => (
                <POMaterialRow
                  key={m._key}
                  item={m}
                  index={i + 1}
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

            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div>
                <label style={labelStyle} htmlFor="notes-for-vendor-optional">Notes for Vendor (optional)</label>
                <Textarea id="notes-for-vendor-optional"
                  value={notesVendor}
                  onChange={e => setNotesVendor(e.target.value)}
                  placeholder="Any special instructions for this order..."
                  rows={3}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="notes-for-superadmin-optional">Notes for Superadmin (optional)</label>
                <Textarea id="notes-for-superadmin-optional"
                  value={notesAdmin}
                  onChange={e => setNotesAdmin(e.target.value)}
                  placeholder="Why is this order needed..."
                  rows={3}
                />
              </div>
            </div>

            {/* Urgency */}
            <div style={{ marginTop: 14 }}>
              <div id="urgency-group-label" style={labelStyle}>Urgency</div>
              <RadioGroup aria-labelledby="urgency-group-label" value={urgency} onValueChange={v => setUrgency(v as "Normal" | "Urgent")} className="flex flex-wrap gap-3">
                {(["Normal", "Urgent"] as const).map(u => (
                  <RadioField key={u} value={u} label={u === "Normal" ? "Normal" : "🔴 Urgent — Low Stock"} />
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Preview toggle — stacked layout only. */}
          <Button
            onClick={() => setShowPreview(p => !p)}
            variant="secondary" size="md" fullWidth
            className="lg:hidden"
            iconLeft={showPreview ? EyeOff : Eye}
          >
            {showPreview ? "Hide document preview" : "Preview PO document"}
          </Button>
        </div>

        {/* RIGHT — Preview */}
        <div
          className={`${showPreview ? "flex" : "hidden"} min-w-0 flex-col px-[14px] pb-[20px] lg:flex lg:w-[46%] lg:overflow-y-auto`}
          style={{ background: T.silkCream }}
        >
          {/* Sticky label: the sheet is taller than the panel, so a static
              caption scrolls out of view and the pane loses its title. */}
          <div
            className="sticky top-0 z-[1] -mx-[14px] mb-[12px] px-[14px] pb-[10px] pt-[16px] text-center text-[11px] font-semibold uppercase"
            style={{ fontFamily: F.ui, color: T.taupe, letterSpacing: "0.5px", background: T.silkCream }}
          >
            PO Document Preview
          </div>
          {/* No width cap — the sheet is scaled to fit, so every pixel of
              panel width is a pixel of legibility. */}
          <div className="mx-auto w-full">
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
          </div>
          <div
            className="mt-[12px] text-center text-[11px] italic"
            style={{ fontFamily: F.ui, color: T.taupe }}
          >
            This preview updates live as you fill the form
          </div>
        </div>
      </div>

      {/* Footer — pinned, so the primary action stays reachable without
          scrolling to the bottom of a long form. */}
      <div
        className="flex shrink-0 flex-col-reverse gap-[8px] border-t px-[18px] py-[14px] sm:flex-row sm:justify-end sm:px-[26px]"
        style={{ borderColor: T.borderDef, background: T.warmIvory }}
      >
        <Button onClick={onClose} variant="secondary" size="md" fullWidth className="sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={() => { void handleSubmit(); }}
          variant="primary" size="md" fullWidth className="sm:w-auto"
          iconLeft={ClipboardList}
        >
          Submit for Superadmin Approval
        </Button>
      </div>
    </Modal>
  );
}
