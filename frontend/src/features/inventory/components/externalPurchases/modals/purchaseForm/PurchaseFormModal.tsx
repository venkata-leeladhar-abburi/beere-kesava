import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Save } from "lucide-react";
import {
  useSuppliers, SareeTag,
  buildSareeCode, computeFinalAmount, purchaseTotals,
} from "@/features/suppliers";
import { T, F } from "../../theme";
import { Button, IconButton } from "../../../../../../shared/ui/primitives";
import { FormState } from "../../types";
import { nextRowUid, toSareeRow } from "../../utils";
import { SupplierSection } from "./SupplierSection";
import { SareeDetailsEditor } from "./SareeDetailsEditor";
import { Modal } from "../../../../../../shared/ui/overlay";
import { useReceiptUpload } from "@/shared/hooks/useReceiptUpload";

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
  const { upload: uploadInvoiceFile, uploading: uploadingInvoice, error: invoiceUploadError } = useReceiptUpload();
  const [form, setForm] = useState<FormState>(initial);
  const [sareeDetails, setSareeDetails] = useState(() => initialSarees.map(toSareeRow));
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
    if (!file) return;
    set("invoiceFileName", file.name);
    void uploadInvoiceFile(file).then((url) => {
      if (url) set("invoiceFileUrl", url);
    });
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
    <Modal open onOpenChange={o => !o && onClose()} size="md">
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
        <Dialog.Title asChild>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>
            {mode === "add" ? "Add External Purchase" : `Edit Purchase — ${initial.supplier}`}
          </div>
        </Dialog.Title>
        <Dialog.Description className="sr-only">
          {mode === "add" ? "Record a new external purchase" : `Edit external purchase from ${initial.supplier}`}
        </Dialog.Description>
        <Dialog.Close asChild>
          <IconButton
            icon={X}
            label="Close"
            onClick={onClose}
            className="rounded-full bg-white/12 text-white hover:bg-white/20"
          />
        </Dialog.Close>
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
          uploadingInvoice={uploadingInvoice}
          invoiceUploadError={invoiceUploadError}
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
    </Modal>
  );
}
