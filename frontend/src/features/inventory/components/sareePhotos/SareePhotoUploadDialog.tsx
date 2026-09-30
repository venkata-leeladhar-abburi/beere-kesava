import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { sareePhotosApi } from "@/shared/api/saree-photos";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { T, F } from "../theme";
import { SareeDetailsCard } from "./SareeDetailsCard";
import { SareePhotoCapture } from "./SareePhotoCapture";

/**
 * Add or replace one saree's inventory photo from a table row. Loads the
 * saree fresh by id rather than trusting the row, so a photo added by Worker
 * Staff since the table loaded is shown instead of being overwritten blind.
 */
export function SareePhotoUploadDialog({ sareeId, onClose }: { sareeId: string; onClose: () => void }) {
  const { data: record, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["saree-photo", sareeId],
    queryFn: () => sareePhotosApi.lookup(sareeId),
    staleTime: 0,
    retry: false,
  });

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="md">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <Dialog.Title asChild>
            <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.deepWine, margin: 0 }}>Saree photo</h3>
          </Dialog.Title>
          <Dialog.Description asChild>
            <p style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, margin: "2px 0 0" }}>
              Take or pick a photo — it shows in inventory as soon as it is saved.
            </p>
          </Dialog.Description>
        </div>
        <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} />
      </div>

      <div style={{ padding: 20, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "40px 0", textAlign: "center" }}>Loading {sareeId}…</div>
        ) : isError || !record ? (
          <div role="alert" style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, background: T.crimsonBg, borderRadius: 10, padding: "12px 14px" }}>
            {error instanceof Error ? error.message : `Couldn't load ${sareeId}.`}{" "}
            <button type="button" onClick={() => void refetch()} style={{ background: "none", border: 0, padding: 0, color: T.royalBurgundy, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 14 }}>
              <SareeDetailsCard record={record} compact />
            </div>
            <SareePhotoCapture record={record} onSaved={onClose} frameHeight={280} />
          </div>
        )}
      </div>
    </Modal>
  );
}
