import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, UploadCloud, CheckCircle2 } from "lucide-react";
import { T, F, SareeItem } from "./WorkerQCTypes";
import { Button } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { useImageUpload } from "@/shared/hooks/useImageUpload";
import { resolveAssetUrl } from "@/shared/api/uploads";

/**
 * A Passed verdict now carries photographic evidence too: the inspector has to
 * shoot (or pick) a photo of the saree before the pass is recorded, so a
 * clean verdict is as auditable as a defective one.
 */
export function WorkerQCPassPhotoModal({
  saree,
  photoUrl,
  setPhotoUrl,
  onCancel,
  onConfirm,
  saving,
}: {
  saree: SareeItem;
  photoUrl: string | null;
  setPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const { upload, uploading, error: uploadError } = useImageUpload();
  const hasPhoto = photoUrl !== null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await upload(file);
    if (url) setPhotoUrl(url);
  };

  return (
    <Modal open onOpenChange={o => { if (!o && !saving) onCancel(); }} size="sm">
      <div style={{ padding: "22px 22px 18px" }}>
        <Dialog.Title asChild>
          <h3 style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: T.brown, margin: "0 0 4px" }}>Photo required to pass</h3>
        </Dialog.Title>
        <Dialog.Description asChild>
          <p style={{ fontFamily: F.u, fontSize: 13, color: T.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
            Capture a photo of <strong>{saree.id}</strong> before marking it Passed.
          </p>
        </Dialog.Description>

        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={e => void handlePhotoSelect(e)} aria-label="Camera photo input" />
        <input type="file" accept="image/*" ref={galleryInputRef} style={{ display: "none" }} onChange={e => void handlePhotoSelect(e)} aria-label="Gallery photo input" />

        {!hasPhoto ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="primary" fullWidth size="sm" iconLeft={Camera} disabled={uploading} onClick={() => cameraInputRef.current?.click()} className="h-11 rounded-[14px] bg-[#6E0F2D] hover:bg-[#4A061B]">
              {uploading ? "Uploading…" : "Camera"}
            </Button>
            <Button variant="secondary" fullWidth size="sm" iconLeft={UploadCloud} disabled={uploading} onClick={() => galleryInputRef.current?.click()} className="h-11 rounded-[14px] border-[#6E0F2D] text-[#6E0F2D]">
              Gallery
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ height: 168, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.gold}`, background: T.bgGold, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={resolveAssetUrl(photoUrl) ?? undefined} alt={`Saree ${saree.id}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: T.green }}>Photo captured</span>
              <Button variant="link" onClick={() => setPhotoUrl(null)} className="p-0 text-xs">Retake</Button>
            </div>
          </div>
        )}

        {uploadError && (
          <div style={{ fontFamily: F.u, fontSize: 12, color: T.crim, marginTop: 8 }}>{uploadError}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={saving} className="h-11 rounded-[14px]">
            Cancel
          </Button>
          <Button variant="primary" fullWidth iconLeft={CheckCircle2} disabled={!hasPhoto || uploading || saving} onClick={onConfirm} className="h-11 rounded-[14px]">
            {saving ? "Saving…" : "Confirm Passed"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
