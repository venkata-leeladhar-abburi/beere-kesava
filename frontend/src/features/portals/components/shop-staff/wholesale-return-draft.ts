import type { ReturnedSareeItem } from "@/shared/api/sales";

/**
 * One saree being registered on a wholesale return, as the form holds it.
 *
 * A consignment is many of these under one vendor, so everything physical
 * lives per-draft while the vendor lives on the parent flow. Fields are
 * strings because they come straight out of inputs — `toItem` below is the
 * single place they become the numbers the API wants.
 */
export interface WholesaleReturnDraft {
  /** Stable row key. Not the tag id — that is typed in and may be blank. */
  key: string;
  /** The tag id being attached to this piece; becomes the Saree id. */
  sareeId: string;
  /** No physical tag to attach — the server generates an id instead. */
  noTagId: boolean;
  /** A SareeTypeRate code. */
  sareeType: string;
  color: string;
  weight: string;
  price: string;
  reason: string | null;
  /** Required when `reason` is "Other" — the only record of why. */
  reasonNote: string;
  /** Server-relative path from POST /uploads/photo, once uploaded. */
  photoUrl: string | null;
  /** Local object URL, shown while and after uploading. */
  photoPreview: string | null;
  photoUploading: boolean;
  photoError: string | null;
}

export const WS_RETURN_REASONS = [
  "Defective",
  "Quality Issue",
  "Overstock",
  "Wrong Design",
  "Damaged in Transit",
  "Other",
] as const;

let seq = 0;
const nextKey = () => `draft-${++seq}`;

export function emptyDraft(): WholesaleReturnDraft {
  return {
    key: nextKey(),
    sareeId: "",
    noTagId: false,
    sareeType: "",
    color: "",
    weight: "",
    price: "",
    reason: null,
    reasonNote: "",
    photoUrl: null,
    photoPreview: null,
    photoUploading: false,
    photoError: null,
  };
}

/**
 * Copies everything about a piece except its identity: a vendor sending back
 * eight of the same design gets seven duplicates and only has to scan a new
 * tag onto each. The photo is carried over deliberately — it is a photo of
 * that design, and it can be replaced per row.
 */
export function duplicateDraft(d: WholesaleReturnDraft): WholesaleReturnDraft {
  return { ...d, key: nextKey(), sareeId: "" };
}

/** Why this row cannot be submitted yet, or null when it is complete. */
export function draftProblem(
  d: WholesaleReturnDraft,
  allDrafts: WholesaleReturnDraft[],
): string | null {
  if (d.noTagId) {
    if (!d.sareeType.trim()) return "Pick a saree type — needed to generate an id without a tag";
  } else {
    const id = d.sareeId.trim();
    if (!id) return "Scan or type the tag id";
    if (allDrafts.some(o => o.key !== d.key && !o.noTagId && o.sareeId.trim() === id)) {
      return "This tag id is used on another row";
    }
  }
  if (!d.weight.trim() || Number(d.weight) <= 0) return "Enter the weight in grams";
  if (!d.reason) return "Pick a return reason";
  if (d.reason === "Other" && !d.reasonNote.trim()) return "Describe the reason";
  if (d.photoUploading) return "Wait for the photo to finish uploading";
  return null;
}

/** The draft as the API wants it. Only call on a draft with no problem. */
export function toItem(d: WholesaleReturnDraft): ReturnedSareeItem {
  return {
    sareeId: d.noTagId ? undefined : d.sareeId.trim(),
    reason: d.reason ?? "Wholesale Return",
    reasonNote: d.reason === "Other" ? d.reasonNote.trim() : undefined,
    weightG: Number(d.weight),
    costPrice: d.price.trim() ? Number(d.price) : undefined,
    sareeType: d.sareeType || undefined,
    color: d.color.trim() || undefined,
    photoUrl: d.photoUrl ?? undefined,
  };
}
