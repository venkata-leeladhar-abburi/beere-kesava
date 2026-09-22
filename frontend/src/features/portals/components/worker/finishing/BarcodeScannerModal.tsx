import { CameraScannerModal } from "../../../../../shared/ui/CameraScannerModal";

/**
 * Live camera saree-barcode scanner behind the "Scan Barcode" button in the
 * Finishing section.
 *
 * A thin wrapper over the shared CameraScannerModal — see the shop-staff
 * wrapper of the same name for why the hand-rolled ZXing version this
 * replaced never decoded a real printed tag. Hands the caller the bare saree
 * id (the QR form's "/scan?id=" wrapper is stripped for it), which is
 * resolved against the sarees on screen exactly as a typed ID is.
 */
export function BarcodeScannerModal({
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
      title="Scan Saree Barcode"
      accentColor="#6E0F2D"
    />
  );
}
