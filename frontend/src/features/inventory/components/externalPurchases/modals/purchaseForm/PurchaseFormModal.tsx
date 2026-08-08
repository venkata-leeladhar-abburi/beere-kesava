import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save } from "lucide-react";
import {
  useSuppliers, SareeTag,
  buildSareeCode, computeFinalAmount, purchaseTotals,
} from "../../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../../theme";
import { Button, IconButton } from "../../../../../../shared/ui/primitives";
import { FormState } from "../../types";
import { nextRowUid, toSareeRow } from "../../utils";
import { SupplierSection } from "./SupplierSection";
import { SareeDetailsEditor } from "./SareeDetailsEditor";

/**
 * Add/Edit External Purchase modal — composition of the supplier/basic-fields
 * section and the per-saree details editor, both extracted alongside this
 * file under modals/purchaseForm/.
 */
export function PurchaseFormModal({
  mode,
  initial,
  initialSarees,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit" | "request" | "request";
  initial: FormState;
  initialSarees: SareeTag[];
  onClose: () => void;
  onSubmit: (data: FormState, sarees: SareeTag[]) => void;
}) {
  const { suppliers } = useSuppliers();
  const [form, setForm] = useState<FormState>(initial);
  const [sareeDetails, setSareeDetails] = useState(() => initialSarees.map(toSareeRow));
  // Declared for a not-yet-wired "request" flow — kept for parity with the
  // pre-split file rather than pruned; unused in the current render.
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [reason, setReason] = useState("");

  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId) ?? null;

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addSareeRow = () => {
    setSareeDetails((prev) => [
      ...prev,
      {
        _uid: nextRowUid(),
        weight: "",
        date: form.date || "—",
        // Default the type to what this supplier normally supplies — still editable.
        sareeType: selectedSupplier?.specialty ?? "",
        color: "",
        price: 0,
        sellPercent: 20,
        quantity: 1,
        finalAmount: 0,
        notes: "",
        imageUrl: undefined,
      },
    ]);
  };
  const removeSareeRow = (uid: string) =>
    setSareeDetails((prev) => prev.filter((s) => s._uid !== uid));
  const updateSareeRow = (uid: string, patch: Partial<typeof sareeDetails[number]>) =>
    setSareeDetails((prev) =>
      prev.map((s) => (s._uid === uid ? { ...s, ...patch } : s))
    );

  const handleInvoiceFile = (file: File | null) => {
    if (file) set("invoiceFileName", file.name);
  };

  const totals = purchaseTotals(sareeDetails);
  const pieceCount = totals.pieces;

  const valid =
    form.supplier.trim() !== "" &&
    form.location.trim() !== "" &&
    form.date.trim() !== "" &&
    sareeDetails.length > 0;

  const buildFinalSarees = (): SareeTag[] =>
    sareeDetails.map((s, idx) => {
      const price = Number(s.price) || 0;
      const sellPercent = Number(s.sellPercent) || 0;
      const quantity = Number(s.quantity) || 1;
      return {
        id: buildSareeCode(form.supplier, idx + 1, form.invoiceNumber),
        weight: s.weight,
        date: s.date,
        sareeType: s.sareeType,
        color: s.color,
        price,
        sellPercent,
        quantity,
        finalAmount: computeFinalAmount(price, sellPercent, quantity),
        notes: s.notes,
        imageUrl: s.imageUrl,
      };
    });

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: "var(--z-modal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(27,12,8,0.55)",
            backdropFilter: "blur(4px)",
          }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(92vw, 620px)",
            maxHeight: "88vh",
            background: "#FFFFFF",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "18px 26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>
              {mode === "add" ? "Add External Purchase" : `Edit Purchase — ${initial.supplier}`}
            </div>
            <IconButton
              icon={X}
              label="Close"
              onClick={onClose}
              className="rounded-full bg-white/12 text-white hover:bg-white/20"
            />
          </div>

          <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1 }}>
            <SupplierSection
              form={form}
              setForm={setForm}
              set={set}
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              pieceCount={pieceCount}
              sareeDetailsCount={sareeDetails.length}
              handleInvoiceFile={handleInvoiceFile}
            />

            <SareeDetailsEditor
              sareeDetails={sareeDetails}
              supplier={form.supplier}
              invoiceNumber={form.invoiceNumber}
              addSareeRow={addSareeRow}
              updateSareeRow={updateSareeRow}
              removeSareeRow={removeSareeRow}
            />
          </div>

          <div
            style={{
              padding: "16px 26px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Button
              variant="primary"
              disabled={!valid}
              onClick={() => valid && onSubmit(form, buildFinalSarees())}
              iconLeft={Save}
              fullWidth
              className="rounded-full"
            >
              {mode === "add" ? "Add Purchase & Generate Barcodes" : "Save Changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-none rounded-full"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
