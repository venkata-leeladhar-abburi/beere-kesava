import { CameraScannerModal } from "../../../../shared/ui/CameraScannerModal";
import type { FlowAccent } from "./flow-kit";

/**
 * Live camera saree-barcode scanner behind every "Open Camera" button in the
 * shop-staff flows.
 *
 * Now a thin wrapper over the shared CameraScannerModal rather than its own
 * copy of the ZXing plumbing. The copy it replaced called
 * `decodeFromVideoDevice` with no hints, no resolution constraints and no
 * region of interest, which meant: a camera stream the browser was free to
 * negotiate down to 640x480, and the whole frame — tag border, printed code,
 * price, background — handed to a MultiFormat reader that then had to guess
 * at every symbology it knows. The live view looked perfectly fine and
 * nothing ever decoded. The shared scanner asks for 1080p off the rear
 * camera, restricts the reader to Code128/QR with TRY_HARDER, and decodes an
 * upscaled crop of just the guide box.
 *
 * It also unwraps the QR form of a tag ("<FRONTEND_URL>/scan?id=<id>") down
 * to the bare saree id, so a caller here gets the same string whichever of
 * the two codes on the tag was scanned.
 */
export function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (text: string) => void;
  accent: FlowAccent;
}) {
  return (
    <CameraScannerModal
      open={open}
      onClose={onClose}
      onDetected={onDetected}
      title="Scan Saree Barcode"
      accentColor={accent.base}
    />
  );
}
