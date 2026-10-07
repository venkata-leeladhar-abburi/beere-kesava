import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  ScanLine,
  Search,
  PackageSearch,
} from "lucide-react";
import { sareePhotosApi, type SareePhotoRecord } from "@/shared/api/saree-photos";
import { resolveAssetUrl } from "@/shared/api/uploads";
import { SareeDetailsCard, SareePhotoCapture } from "@/features/inventory";
import { CameraScannerModal } from "../../../../shared/ui/CameraScannerModal";
import { Button } from "../../../../shared/ui/primitives";
import { C, F } from "./tokens";
import { PageHero, SectionCard } from "./primitives";

interface SessionShot {
  sareeId: string;
  url: string;
}

/** Keep the text box ready for a USB scanner — but never pop the phone keyboard. */
const focusIfDesktop = (el: HTMLInputElement | null) => {
  if (el && window.innerWidth >= 768) el.focus();
};

/**
 * Saree Photos — Worker Staff scan a saree's tag (camera or USB scanner) or
 * type its ID, see the saree's details, and photograph it for inventory. A
 * saree that already has a photo shows it, with nothing further to do.
 */
export function WorkerSareePhotos(_props: { isDesktop?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [query, setQuery] = useState("");
  const [record, setRecord] = useState<SareePhotoRecord | null>(null);
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [session, setSession] = useState<SessionShot[]>([]);

  useEffect(() => {
    focusIfDesktop(inputRef.current);
  }, []);

  const lookup = async (raw: string) => {
    const code = raw.trim();
    if (!code) {
      setLookupError("Scan a saree tag or type its ID.");
      return;
    }
    const requestId = ++requestRef.current;
    setSearching(true);
    setLookupError("");
    setJustSaved(false);
    try {
      const found = await sareePhotosApi.lookup(code);
      if (requestId !== requestRef.current) return; // a newer scan won
      setRecord(found);
      setQuery("");
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setRecord(null);
      setLookupError(
        err instanceof Error ? err.message : "Couldn't look up that saree. Please try again."
      );
    } finally {
      if (requestId === requestRef.current) {
        setSearching(false);
        focusIfDesktop(inputRef.current);
      }
    }
  };

  const onSaved = (updated: SareePhotoRecord) => {
    setRecord(updated);
    setJustSaved(true);
    if (updated.photo) {
      const shot = { sareeId: updated.sareeId, url: updated.photo.url };
      setSession((prev) => [shot, ...prev.filter((s) => s.sareeId !== updated.sareeId)]);
    }
    focusIfDesktop(inputRef.current);
  };

  const scanNext = () => {
    setRecord(null);
    setJustSaved(false);
    setLookupError("");
    if (window.innerWidth < 768) setScannerOpen(true);
    else inputRef.current?.focus();
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <PageHero
        eyebrow="Worker Staff · Inventory"
        title="Saree"
        titleAccent="Photos"
        description="Scan a saree's tag or enter its ID, check its details, and photograph it. The photo goes straight onto the saree in inventory."
        minHeight={280}
        pills={
          session.length > 0
            ? [{ text: `${session.length} photographed this session`, color: C.goldL }]
            : undefined
        }
      />

      <div
        className="px-4 md:px-7 xl:px-12 flex flex-col gap-6"
        style={{ paddingTop: 28, paddingBottom: 64 }}
      >
        <SectionCard
          icon={ScanLine}
          title="Find a saree"
          subtitle="Scan the tag with the camera or a barcode scanner, or type the saree ID."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(query);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1 relative">
              <ScanLine
                size={18}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.muted,
                  pointerEvents: "none",
                }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Saree ID, e.g. RAVI-L1-B12-003"
                aria-label="Saree ID"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full h-12 rounded-xl border pl-11 pr-3 outline-none focus:ring-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 15,
                  borderColor: C.bdrMed,
                  background: "#FFF",
                  color: C.text,
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="secondary"
                iconLeft={Search}
                disabled={searching}
                className="h-12 rounded-xl flex-1 sm:flex-none"
              >
                {searching ? "Finding…" : "Find"}
              </Button>
              <Button
                type="button"
                variant="primary"
                iconLeft={Camera}
                onClick={() => setScannerOpen(true)}
                className="h-12 rounded-xl flex-1 sm:flex-none"
              >
                Scan tag
              </Button>
            </div>
          </form>
          {lookupError && (
            <div
              role="alert"
              style={{
                marginTop: 10,
                fontFamily: F.u,
                fontSize: 13,
                color: C.crim,
                background: "rgba(192,57,43,0.08)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              {lookupError}
            </div>
          )}
        </SectionCard>

        {record ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <SectionCard icon={PackageSearch} title="Saree details">
              <SareeDetailsCard record={record} />
            </SectionCard>

            <SectionCard
              icon={Camera}
              title="Photo"
              subtitle={
                record.photo ? undefined : "Take the photo, check it, retake if needed, then save."
              }
            >
              <SareePhotoCapture record={record} onSaved={onSaved} />
              {justSaved && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    role="status"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: F.u,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.green,
                    }}
                  >
                    <CheckCircle2 size={16} /> Saved. {record.sareeId} now has its photo in
                    inventory.
                  </div>
                  <Button
                    variant="primary"
                    iconLeft={ScanLine}
                    fullWidth
                    onClick={scanNext}
                    className="h-12 rounded-[12px]"
                  >
                    Scan next saree
                  </Button>
                </div>
              )}
            </SectionCard>
          </div>
        ) : (
          !lookupError && (
            <div
              style={{
                border: `1px dashed rgba(200,155,71,0.45)`,
                borderRadius: 16,
                padding: "36px 20px",
                textAlign: "center",
                background: C.ivory,
              }}
            >
              <ScanLine size={30} color={C.gold} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 700, color: C.text }}>
                Scan a saree to begin
              </div>
              <div
                style={{
                  fontFamily: F.u,
                  fontSize: 13,
                  color: C.muted,
                  marginTop: 4,
                  maxWidth: "min(440px, 100%)",
                  marginInline: "auto",
                  lineHeight: 1.5,
                }}
              >
                Its details appear here. If it already has a photo you'll see it — no need to upload
                again.
              </div>
            </div>
          )
        )}

        {session.length > 0 && (
          <SectionCard
            icon={ImageIcon}
            title="Photographed this session"
            subtitle="Tap one to open it again."
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
              {session.map((s) => (
                <button
                  key={s.sareeId}
                  type="button"
                  onClick={() => void lookup(s.sareeId)}
                  title={`Open ${s.sareeId}`}
                  style={{
                    background: "#FFF",
                    border: `1px solid ${record?.sareeId === s.sareeId ? C.gold : C.bdr}`,
                    borderRadius: 12,
                    padding: 6,
                    cursor: "pointer",
                    textAlign: "left",
                    minWidth: 0,
                  }}
                >
                  <img
                    src={resolveAssetUrl(s.url) ?? undefined}
                    alt={`Saree ${s.sareeId}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      aspectRatio: "3 / 4",
                      objectFit: "cover",
                      borderRadius: 8,
                      display: "block",
                      background: C.cream,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: C.burg,
                      marginTop: 5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.sareeId}
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <CameraScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(text) => {
          setScannerOpen(false);
          setQuery(text);
          void lookup(text);
        }}
        title="Scan Saree Tag"
        accentColor={C.burg}
      />
    </div>
  );
}
