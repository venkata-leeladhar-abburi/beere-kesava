import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { X, AlertCircle, ScanLine } from "lucide-react";
import { F } from "../tokens";
import { Button } from "../../../../../shared/ui/primitives";

/**
 * Live camera saree-barcode scanner behind the "Scan Barcode" button in the
 * Finishing section. Same engine as the Issue Material GRN scanner
 * (GrnBarcodeScannerModal) and the shop-staff saree scanner — ZXing's
 * MultiFormat reader — pointed at whatever's printed on the saree tag.
 * Decodes and hands the raw text straight back; the caller resolves it
 * against the sarees on screen the same way a typed ID is resolved.
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);

    const reader = new BrowserMultiFormatReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, err, controls) => {
        controlsRef.current = controls;
        if (cancelled) return;
        if (result) {
          controls.stop();
          onDetected(result.getText());
        }
        // NotFoundException fires continuously between frames with no
        // barcode in view — that's the normal steady state, not a failure.
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error && e.name === "NotAllowedError"
            ? "Camera access was denied — allow camera permission and try again."
            : "Couldn't access the camera on this device.",
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan saree barcode"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(20,10,8,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="w-full max-w-[460px]" style={{ background: "#0F0906", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScanLine size={18} color="#FFDFA0" />
            <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFFDF9" }}>Scan Saree Barcode</span>
          </div>
          <Button variant="tertiary" size="sm" onClick={onClose} aria-label="Close camera"
            className="h-8 w-8 rounded-full border-0 bg-[rgba(255,255,255,0.10)] p-0 text-white hover:bg-[rgba(255,255,255,0.18)]">
            <X size={16} />
          </Button>
        </div>

        <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#000" }}>
          <video ref={videoRef} aria-label="Live camera feed for barcode scanning" style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
          {!error && (
            <div aria-hidden style={{ position: "absolute", inset: "18% 12%", border: "2px solid #C89B47", borderRadius: 12, boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)" }} />
          )}
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center" }}>
              <AlertCircle size={28} color="#E8A0A0" />
              <span style={{ fontFamily: F.u, fontSize: 13, color: "#F0DEDE" }}>{error}</span>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 18px 16px" }}>
          <span style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,253,249,0.6)" }}>
            Hold the saree tag steady inside the frame — it'll be picked up automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
