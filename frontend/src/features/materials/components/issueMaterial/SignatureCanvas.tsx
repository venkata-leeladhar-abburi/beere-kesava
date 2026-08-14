import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import { F, T } from "./theme";
import { Button } from "../../../../shared/ui/primitives";

export interface SignatureCanvasHandle {
  /** Exports the current strokes as a PNG blob, or null if nothing was drawn. */
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
}

interface Point {
  x: number;
  y: number;
}

function pointFromEvent(canvas: HTMLCanvasElement, e: React.PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** Real signature capture: draws strokes on an HTML canvas via pointer events, exportable as a PNG blob. */
export const SignatureCanvas = forwardRef<
  SignatureCanvasHandle,
  { weaverName: string; onChange?: (hasDrawn: boolean) => void }
>(function SignatureCanvas({ weaverName, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<Point | null>(null);
    const [hasDrawn, setHasDrawnState] = useState(false);
    const setHasDrawn = (v: boolean) => {
      setHasDrawnState(v);
      onChange?.(v);
    };

    useImperativeHandle(ref, () => ({
      toBlob: () =>
        new Promise((resolve) => {
          const canvas = canvasRef.current;
          if (!canvas || !hasDrawn) {
            resolve(null);
            return;
          }
          canvas.toBlob((blob) => resolve(blob), "image/png");
        }),
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      },
    }));

    function getContext(): CanvasRenderingContext2D | null {
      return canvasRef.current?.getContext("2d") ?? null;
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      lastPointRef.current = pointFromEvent(canvas, e);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (!canvas || !ctx) return;
      const point = pointFromEvent(canvas, e);
      const last = lastPointRef.current;
      if (last) {
        ctx.strokeStyle = T.darkBurgundy;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      lastPointRef.current = point;
      if (!hasDrawn) setHasDrawn(true);
    }

    function handlePointerUp() {
      drawingRef.current = false;
      lastPointRef.current = null;
    }

    function handleClear() {
      const canvas = canvasRef.current;
      const ctx = getContext();
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }

    return (
      <div style={{ position: "relative" as const }}>
        <canvas
          ref={canvasRef}
          aria-label="Signature drawing area"
          width={520}
          height={150}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: "100%",
            height: 150,
            background: "#FFF",
            border: `1.5px solid ${hasDrawn ? "rgba(30,102,64,0.35)" : T.borderDef}`,
            borderRadius: 14,
            cursor: "crosshair",
            touchAction: "none",
            display: "block",
          }}
        />
        {!hasDrawn && (
          <div
            style={{
              position: "absolute" as const,
              inset: 0,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none" as const,
            }}
          >
            <PenLine size={30} color={T.taupe} style={{ marginBottom: 10, opacity: 0.6 }} />
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
              Sign here as {weaverName}
            </span>
          </div>
        )}
        {hasDrawn && (
          <div
            style={{
              position: "absolute" as const,
              bottom: 10,
              left: 14,
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: F.ui,
              fontSize: 12,
              color: T.green,
            }}
          >
            <CheckCircle2 size={13} /> Signature captured
          </div>
        )}
        {hasDrawn && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleClear}
            className="absolute bottom-[10px] right-[14px] text-[var(--text-accent)] hover:text-[var(--text-accent)]"
          >
            Clear
          </Button>
        )}
      </div>
    );
  },
);
