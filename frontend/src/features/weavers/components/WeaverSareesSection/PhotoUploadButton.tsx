import { Camera } from "lucide-react";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import type { WeaverSareeRow } from "./types";

/**
 * Only sarees whose photo has a home can be photographed: a woven saree (its
 * batch row) or a purchased piece (its purchase line). A hand-registered
 * wholesale return has neither — see backend SareePhotosService.
 */
export const canPhotograph = (r: WeaverSareeRow) => !!r.batchId || !!r.external;

/** Sits beside the photo thumbnail: "Upload" when there is none, a quiet camera icon to replace one. */
export function PhotoUploadButton({ row, hasPhoto, onUpload }: {
  row: WeaverSareeRow;
  hasPhoto: boolean;
  onUpload: (r: WeaverSareeRow) => void;
}) {
  if (!canPhotograph(row)) return null;
  return hasPhoto ? (
    <IconButton icon={Camera} label={`Replace photo of ${row.sareeId}`} variant="ghost" size="sm" onClick={() => onUpload(row)} />
  ) : (
    <Button variant="secondary" size="sm" iconLeft={Camera} onClick={() => onUpload(row)} aria-label={`Upload photo for ${row.sareeId}`} className="h-8 rounded-[8px] px-2.5 text-[12px] whitespace-nowrap">
      Upload
    </Button>
  );
}
