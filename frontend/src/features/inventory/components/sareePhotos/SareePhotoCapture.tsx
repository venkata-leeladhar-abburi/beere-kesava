import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { resolveAssetUrl } from "@/shared/api/uploads";
import type { SareePhotoRecord } from "@/shared/api/saree-photos";
import { IMAGE_ACCEPT_ATTR } from "@/shared/lib/imageTypes";
import { Button } from "../../../../shared/ui/primitives";
import { T, F } from "../theme";
import { useSaveSareePhoto } from "./useSaveSareePhoto";

interface Draft { file: File; previewUrl: string }

/**
 * The photo the inventory currently shows for a saree, if any. A purchased
 * piece with no photo of its own is shown with its purchase line's photo —
 * the same fallback as the inventory table — so it counts as photographed.
 */
function currentPhoto(record: SareePhotoRecord): { url: string; note: string | null } | null {
  if (record.photo) {
    return {
      url: record.photo.url,
      note: record.photo.source === "qc" ? "This is the photo taken at QC inspection." : null,
    };
  }
  const line = record.purchase;
  if (line?.linePhotoUrl) {
    return {
      url: line.linePhotoUrl,
      note: line.lineQuantity > 1
        ? `This is the purchase photo, shared by all ${line.lineQuantity} pieces of serial ${line.lineCode}.`
        : "This is the photo taken at purchase.",
    };
  }
  return null;
}

/**
 * Take (or pick) a photo of one saree, check it, retake if needed, and save it
 * to inventory. When the saree already has a photo it is shown instead, with
 * nothing more to do — replacing it is a deliberate, secondary action.
 */
export function SareePhotoCapture({
  record,
  onSaved,
  frameHeight = 320,
}: {
  record: SareePhotoRecord;
  onSaved: (updated: SareePhotoRecord) => void;
  frameHeight?: number;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [replacing, setReplacing] = useState(false);
  const { save, saving, error, clearError } = useSaveSareePhoto();

  const existing = currentPhoto(record);
  const capturing = !existing || replacing;

  // A different saree starts clean.
  useEffect(() => {
    setDraft(null);
    setReplacing(false);
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.sareeId]);

  // Release the preview's object URL whenever it is replaced or unmounted.
  useEffect(() => () => { if (draft) URL.revokeObjectURL(draft.previewUrl); }, [draft]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still fires
    if (!file) return;
    clearError();
    setDraft({ file, previewUrl: URL.createObjectURL(file) });
  };

  const onSave = async () => {
    if (!draft) return;
    const updated = await save(record.sareeId, draft.file);
    if (!updated) return;
    setDraft(null);
    setReplacing(false);
    toast.success(`Photo saved for ${updated.sareeId}`, { description: "It now shows in inventory." });
    onSaved(updated);
  };

  const cancelReplace = () => { setDraft(null); setReplacing(false); clearError(); };

  const frame = (src: string | null, alt: string) => (
    <div style={{ height: frameHeight, borderRadius: 14, overflow: "hidden", border: src ? `1px solid ${T.borderGold}` : `1.5px dashed ${T.borderMed}`, background: src ? "#1A0A0F" : T.silkCream, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src ? (
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Camera size={34} color={T.antiqueGold} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>No photo yet</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4, maxWidth: 280 }}>
            Lay the saree flat in good light, with the pallu and border in view.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <input ref={cameraRef} type="file" accept={IMAGE_ACCEPT_ATTR} capture="environment" onChange={onPick} style={{ display: "none" }} aria-label={`Take a photo of ${record.sareeId}`} />
      <input ref={galleryRef} type="file" accept={IMAGE_ACCEPT_ATTR} onChange={onPick} style={{ display: "none" }} aria-label={`Choose a photo of ${record.sareeId}`} />

      {!capturing && existing ? (
        <>
          {frame(resolveAssetUrl(existing.url), `Saree ${record.sareeId}`)}
          <div role="status" style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start", background: T.greenBg, borderRadius: 10, padding: "10px 12px" }}>
            <CheckCircle2 size={18} color={T.green} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.5 }}>
              <strong style={{ color: T.green }}>Photo already in inventory</strong> — no need to upload again.
              {existing.note && <div style={{ fontSize: 12, color: T.taupe }}>{existing.note}</div>}
            </div>
          </div>
          <Button variant="secondary" iconLeft={RefreshCw} fullWidth onClick={() => setReplacing(true)} className="mt-3 h-11 rounded-[12px]">
            {record.photo?.source === "inventory" ? "Replace photo" : "Take this saree's own photo"}
          </Button>
        </>
      ) : (
        <>
          {frame(draft?.previewUrl ?? null, `New picture of saree ${record.sareeId}`)}
          {draft && (
            <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe, textAlign: "center" }}>
              Check the photo is sharp and shows the whole saree, then save it.
            </div>
          )}

          {error && (
            <div role="alert" style={{ marginTop: 10, fontFamily: F.ui, fontSize: 12.5, color: T.crimson, background: T.crimsonBg, borderRadius: 8, padding: "8px 10px" }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5" style={{ marginTop: 12 }}>
            {draft ? (
              <>
                <Button variant="secondary" iconLeft={RefreshCw} disabled={saving} onClick={() => cameraRef.current?.click()} className="h-11 rounded-[12px]">
                  Retake
                </Button>
                <Button variant="secondary" iconLeft={ImagePlus} disabled={saving} onClick={() => galleryRef.current?.click()} className="h-11 rounded-[12px]">
                  Gallery
                </Button>
                <Button variant="primary" iconLeft={Save} disabled={saving} onClick={() => void onSave()} className="col-span-2 h-12 rounded-[12px]">
                  {saving ? "Saving photo…" : "Save photo to inventory"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" iconLeft={Camera} onClick={() => cameraRef.current?.click()} className="col-span-2 h-12 rounded-[12px]">
                  Take photo
                </Button>
                <Button variant="secondary" iconLeft={ImagePlus} onClick={() => galleryRef.current?.click()} className="col-span-2 h-11 rounded-[12px]">
                  Choose from gallery
                </Button>
              </>
            )}
            {replacing && (
              <Button variant="ghost" iconLeft={X} disabled={saving} onClick={cancelReplace} className="col-span-2 h-10 rounded-[12px]">
                Keep the current photo
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
