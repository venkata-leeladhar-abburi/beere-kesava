import { CameraScannerModal } from "../../../../shared/ui/CameraScannerModal";

/**
 * Live camera GRN-batch scanner behind the QR icon on the Issue Material
 * form. Thin wrapper around the shared CameraScannerModal (same one the
 * shop-staff saree scanner uses) so this gets the same reliability fixes —
 * a higher-resolution camera request, a TRY_HARDER decode hint, and a
 * fallback to the plain default camera — instead of drifting out of sync
 * with a second hand-maintained copy of the same scanning code.
 */
export function GrnBarcodeScannerModal({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (text: string) => void;
}) {
  return (
    <CameraScannerModal
      open={open}
      onClose={onClose}
      onDetected={onDetected}
      title="Scan GRN Batch Barcode"
      hint="Hold the GRN batch tag steady inside the frame — it'll be picked up automatically."
    />
  );
}
