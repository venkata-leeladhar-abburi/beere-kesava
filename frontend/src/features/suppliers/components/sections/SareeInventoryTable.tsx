// Flat saree inventory table, used inside the Overview tab and inside each
// expanded purchase row of the Order History tab. Each row is one purchase
// line (one serial number, possibly covering several physical pieces) and
// can be expanded to list every physical saree under that serial with a
// barcode "Print" action per piece, plus a "Print All" for the whole line.

import React, { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { ChevronRight, ChevronDown, Image as ImageIcon, Printer, Camera, Upload, Loader2, X as XIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { resolveAssetUrl, uploadsApi } from "@/shared/api/uploads";
import { T, F } from "../theme";
import { SareeTag, expandSareePieces } from "../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Modal } from "../../../../shared/ui/overlay";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { SariTagPrintModal } from "@/features/production";
import { useDocument } from "../../../../shared/ui/document";

export type SareeRow = SareeTag & { purchaseId: string; invoiceNumber: string; supplier: string };

/** Optional per-piece badge/selection, supplied by callers that track
 * return-request state (e.g. the External Purchases saree list) — Order
 * History omits this and gets the plain piece list it always has. */
export interface PieceExtra {
  badge?: { label: string; color: string; bg: string };
  selectable?: boolean;
}

type UploadTarget = { kind: "line"; row: SareeRow } | { kind: "piece"; row: SareeRow; pieceNo: number };

export function SareeInventoryTable({
  rows,
  onUploadPhoto,
  onUploadPieceImage,
  pieceExtra,
  selectedPieceIds,
  onTogglePieceSelect,
}: {
  rows: SareeRow[];
  /** When provided, a small upload badge appears on every line's photo cell.
   * The file is uploaded to cloud storage here; the callback receives the
   * displayable URL of the stored object, never inline image data. */
  onUploadPhoto?: (row: SareeRow, url: string) => void;
  /** When provided, each individual piece under an expanded line also gets
   * its own upload badge — for a photo distinct from the line's own. */
  onUploadPieceImage?: (row: SareeRow, pieceNo: number, url: string) => void;
  pieceExtra?: (pieceId: string) => PieceExtra | undefined;
  selectedPieceIds?: Set<string>;
  onTogglePieceSelect?: (pieceId: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [printSaree, setPrintSaree] = useState<{ row: SareeRow; pieceId: string } | null>(null);
  // Which tile is mid-upload, so its badge can show a spinner instead of the
  // camera and a second click can't fire a duplicate upload.
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  // Which tile has its "Take photo / Choose file" chooser open.
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const { print } = useDocument();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<UploadTarget | null>(null);

  const targetKey = (t: UploadTarget) =>
    t.kind === "line" ? `line:${t.row.purchaseId}:${t.row.id}` : `piece:${t.row.purchaseId}:${t.row.id}:${t.pieceNo}`;

  /** Opens the OS camera ("capture") or the file picker for the given tile. */
  const pickSource = (target: UploadTarget, source: "camera" | "gallery") => {
    uploadTargetRef.current = target;
    setPickerKey(null);
    (source === "camera" ? cameraInputRef : galleryInputRef).current?.click();
  };

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = uploadTargetRef.current;
    e.target.value = "";
    if (!file || !target) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const key = targetKey(target);
    setUploadingKey(key);
    try {
      // The bytes go to Cloudflare R2 and only the server-relative path is
      // kept on the row. Inlining the photo as a base64 data URL (what this
      // used to do) is what made saree photos both enormous in Postgres and
      // unreliable to load back.
      const { url } = await uploadsApi.uploadPhoto(file);
      const shown = resolveAssetUrl(url) ?? url;
      if (target.kind === "line") onUploadPhoto?.(target.row, shown);
      else onUploadPieceImage?.(target.row, target.pieceNo, shown);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload the photo");
    } finally {
      setUploadingKey(null);
    }
  };

  /** The small round camera badge sitting on a photo tile — tapping it offers
   * the camera or the file picker rather than assuming one of them. */
  const UploadBadge = ({ target, size }: { target: UploadTarget; size: number }) => {
    const key = targetKey(target);
    const busy = uploadingKey === key;
    const open = pickerKey === key;
    return (
      <>
        <button
          type="button"
          onClick={() => setPickerKey(open ? null : key)}
          disabled={busy}
          title="Add or replace photo"
          aria-label="Add or replace photo"
          style={{
            position: "absolute", bottom: -4, right: -4, width: size, height: size, borderRadius: "50%",
            background: T.royalBurgundy, border: "1.5px solid #FFF", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: busy ? "wait" : "pointer", padding: 0,
          }}
        >
          {busy
            ? <Loader2 size={size / 2} color="#FFF" className="animate-spin" />
            : <Camera size={size / 2} color="#FFF" />}
        </button>
        {open && !busy && <SourceMenu target={target} />}
      </>
    );
  };

  const SourceMenu = ({ target }: { target: UploadTarget }) => (
    <>
      {/* Click-away catcher, so the menu closes like a real popover. */}
      <button
        type="button"
        aria-label="Close photo menu"
        onClick={() => setPickerKey(null)}
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "transparent", border: 0, cursor: "default" }}
      />
      <div
        style={{
          position: "absolute", top: "100%", left: 0, zIndex: 41, marginTop: 6, minWidth: 152,
          background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10,
          boxShadow: "0 12px 30px rgba(0,0,0,0.16)", padding: 4,
        }}
      >
        {([
          { label: "Take photo", icon: Camera, source: "camera" as const },
          { label: "Choose file", icon: Upload, source: "gallery" as const },
        ]).map(({ label, icon: Icon, source }) => (
          <button
            key={source}
            type="button"
            onClick={() => pickSource(target, source)}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px",
              background: "transparent", border: 0, borderRadius: 7, cursor: "pointer",
              fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, textAlign: "left" as const,
            }}
          >
            <Icon size={13} color={T.royalBurgundy} />
            {label}
          </button>
        ))}
      </div>
    </>
  );

  if (rows.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No sarees match this filter.</div>;
  }

  const mono = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: "var(--font-mono)", fontSize: 12, color, ...extra,
  });

  const rowId = (s: SareeRow) => `${s.purchaseId}-${s.id}`;

  const toggle = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const printAllForRow = (s: SareeRow) => {
    const pieces = expandSareePieces([s]);
    const printTable = (
      <div style={{ padding: "16mm" }}>
        <div style={{ marginBottom: "4mm" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14pt", color: "var(--doc-burgundy)" }}>
            {s.id} — Saree Barcodes
          </div>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)" }}>{s.supplier}</div>
        </div>
        {/* eslint-disable-next-line no-restricted-syntax -- printable document template */}
        <table className="bk-doc__table">
          <thead>
            <tr>
              {/* eslint-disable-next-line no-restricted-syntax -- printable document template */}
              {["Saree Code", "Type", "Colour", "Weight"].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {pieces.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: "var(--font-code)" }}>{p.id}</td>
                <td>{p.sareeType || "—"}</td>
                <td>{p.color || "—"}</td>
                <td>{p.weight || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    print(printTable);
  };

  const columns: ColumnDef<SareeRow>[] = [
    {
      id: "expand", header: "", accessor: () => null,
      cell: (_v, s) => (
        <IconButton
          icon={expandedIds.has(rowId(s)) ? ChevronDown : ChevronRight}
          label={expandedIds.has(rowId(s)) ? "Collapse sarees" : "Expand sarees"}
          variant="ghost" size="sm"
          onClick={() => toggle(rowId(s))}
        />
      ),
    },
    {
      id: "photo", header: "Photo", accessor: s => s.imageUrl,
      cell: (_v, s) => {
        const src = resolveAssetUrl(s.imageUrl);
        return (
          <div style={{ position: "relative", width: 40, height: 40 }}>
            {src ? (
              <button type="button" onClick={() => setPreview(src)} title={`View photo of ${s.id}`} className="p-0 border-0 bg-transparent cursor-pointer">
                <img src={src} alt={s.id}
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
              </button>
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImageIcon size={14} color={T.taupe} />
              </div>
            )}
            {onUploadPhoto && <UploadBadge target={{ kind: "line", row: s }} size={18} />}
          </div>
        );
      },
    },
    {
      id: "sareeId", header: "Saree ID", accessor: s => s.id,
      cell: (_v, s) => <span style={mono(T.royalBurgundy, { fontWeight: 600 })}>{s.id}</span>,
    },
    {
      id: "serial", header: "Serial No.", accessor: s => s.id,
      cell: (_v, s) => <span style={mono(T.luxuryBrown, { fontWeight: 700 })}>{s.id.split("-").pop() || "—"}</span>,
    },
    {
      id: "po", header: "Purchase Order", accessor: s => s.purchaseId,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.purchaseId}</span>,
    },
    {
      id: "qty", header: "Quantity", accessor: s => s.quantity,
      cell: (_v, s) => <span style={mono(T.luxuryBrown)}>{s.quantity ?? 1} pcs</span>,
    },
    {
      id: "type", header: "Type", accessor: s => s.sareeType,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{s.sareeType || "—"}</span>,
    },
    {
      id: "colour", header: "Colour", accessor: s => s.color,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{s.color || "—"}</span>,
    },
    {
      id: "weight", header: "Weight", accessor: s => s.weight,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.weight || "—"}</span>,
    },
    {
      id: "date", header: "Purchase Date", accessor: s => s.date,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.date}</span>,
    },
    {
      id: "buying", header: "Buying Price", accessor: s => s.price,
      cell: (_v, s) => <span style={mono(T.luxuryBrown)}>{formatMoney(rupees(s.price))}</span>,
    },
    {
      id: "sellPct", header: "Sell %", accessor: s => s.sellPercent,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.sellPercent}%</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: s => s.finalAmount,
      cell: (_v, s) => <span style={mono("#8B6018", { fontWeight: 700 })}>{formatMoney(rupees(s.finalAmount))}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: s => (s.finalAmount - s.price) * (s.quantity ?? 1),
      cell: (_v, s) => <span style={mono(T.green, { fontWeight: 700 })}>{formatMoney(rupees((s.finalAmount - s.price) * (s.quantity ?? 1)))}</span>,
    },
    {
      id: "barcodes", header: "Barcodes", accessor: () => null, type: "actions",
      cell: (_v, s) => (
        <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => printAllForRow(s)} className="whitespace-nowrap">
          Print All
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={rowId}
        pagination
        emptyTitle="No sarees match this filter"
        expandedIds={expandedIds}
        renderExpandedRow={s => {
          const pieces = expandSareePieces([s]);
          return (
            <div style={{ padding: "10px 16px 16px 56px", background: "rgba(247,242,234,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>
                  {pieces.length} saree{pieces.length !== 1 ? "s" : ""} under serial {s.id.split("-").pop()}
                </div>
                <Button variant="primary" size="sm" iconLeft={Printer} onClick={() => printAllForRow(s)}>
                  Print All Barcodes
                </Button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pieces.map(p => {
                  const extra = pieceExtra?.(p.id);
                  const checked = selectedPieceIds?.has(p.id) ?? false;
                  const pieceSrc = resolveAssetUrl(p.imageUrl);
                  const pieceTarget: UploadTarget = { kind: "piece", row: s, pieceNo: p.pieceNo };
                  const pieceKey = targetKey(pieceTarget);
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {(pieceSrc || onUploadPieceImage) && (
                          <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                            {pieceSrc ? (
                              <button type="button" onClick={() => setPreview(pieceSrc)} title={`View photo of ${p.id}`} className="p-0 border-0 bg-transparent cursor-pointer">
                                <img src={pieceSrc} alt={p.id}
                                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
                              </button>
                            ) : onUploadPieceImage ? (
                              // No photo yet — the whole tile is the upload target, so the
                              // designer isn't hunting for a 14px badge.
                              <button
                                type="button"
                                onClick={() => setPickerKey(pieceKey === pickerKey ? null : pieceKey)}
                                title={`Upload photo for ${p.id}`}
                                disabled={uploadingKey === pieceKey}
                                style={{ width: 36, height: 36, borderRadius: 8, background: T.silkCream, border: `1px dashed ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                              >
                                {uploadingKey === pieceKey
                                  ? <Loader2 size={13} color={T.royalBurgundy} className="animate-spin" />
                                  : <Camera size={13} color={T.royalBurgundy} />}
                              </button>
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ImageIcon size={13} color={T.taupe} />
                              </div>
                            )}
                            {onUploadPieceImage && (pieceSrc
                              ? <UploadBadge target={pieceTarget} size={16} />
                              : pickerKey === pieceKey && uploadingKey !== pieceKey && <SourceMenu target={pieceTarget} />)}
                          </div>
                        )}
                        {onTogglePieceSelect && extra?.selectable && (
                          <input
                            type="checkbox"
                            aria-label={`Select ${p.id} for return`}
                            checked={checked}
                            onChange={() => onTogglePieceSelect(p.id)}
                            style={{ width: 15, height: 15, accentColor: T.royalBurgundy, cursor: "pointer" }}
                          />
                        )}
                        <span style={mono(T.royalBurgundy, { fontWeight: 700 })}>{p.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>pc {p.pieceNo}/{p.lineQuantity}</span>
                        {extra?.badge && (
                          <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: extra.badge.color, background: extra.badge.bg, borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" as const }}>
                            {extra.badge.label}
                          </span>
                        )}
                      </div>
                      <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => setPrintSaree({ row: s, pieceId: p.id })}>
                        Print
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }}
      />

      {(onUploadPhoto || onUploadPieceImage) && (
        <>
          <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            style={{ display: "none" }}
            onChange={handleUploadChange}
            aria-label="Upload saree photo from a file"
          />
          {/* `capture` asks a phone to open the rear camera directly instead
            * of the gallery; desktop browsers ignore it and show the picker. */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            style={{ display: "none" }}
            onChange={handleUploadChange}
            aria-label="Take a saree photo with the camera"
          />
        </>
      )}

      <Modal open={!!preview} onOpenChange={o => { if (!o) setPreview(null); }} size="xl">
        <Dialog.Title className="sr-only">Saree photo preview</Dialog.Title>
        <Dialog.Description className="sr-only">Full-size saree photo</Dialog.Description>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {preview && (
            <>
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={preview}
                alt="Saree"
                // `contain` inside a tall box: the whole saree is visible at
                // once rather than cropped to a square the way the thumbnail is.
                style={{
                  maxWidth: "100%", maxHeight: "82vh", width: "auto", height: "auto",
                  objectFit: "contain", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                }}
              />
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <a
                  href={preview}
                  target="_blank"
                  rel="noreferrer"
                  title="Open the full-size photo in a new tab"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.92)", border: `1px solid ${T.borderDef}`,
                    fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, textDecoration: "none",
                  }}
                >
                  <ExternalLink size={13} /> Full size
                </a>
                <IconButton icon={XIcon} label="Close preview" variant="ghost" size="sm" onClick={() => setPreview(null)} />
              </div>
            </>
          )}
        </div>
      </Modal>

      {printSaree && (
        <SariTagPrintModal
          saree={{
            id: printSaree.pieceId,
            weaver: null,
            design: printSaree.pieceId,
            sareeType: printSaree.row.sareeType,
            weight: printSaree.row.weight,
            qcDate: printSaree.row.date,
            source: "external",
            loom: 0,
            supplier: printSaree.row.supplier,
          }}
          onClose={() => setPrintSaree(null)}
        />
      )}
    </>
  );
}
