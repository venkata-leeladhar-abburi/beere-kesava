import React from "react";
import { Printer } from "lucide-react";
import { BarcodePreview, F, T } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";

export function LabelPreviewCard({ fields }: {
  fields: { barcode: boolean; code: boolean; weaver: boolean; date: boolean; branding: boolean };
}) {
  return (
    <div style={{ flex: "0 0 52%" }}>
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 2px 16px rgba(44,24,16,0.08)",
          padding: 28,
        }}
      >
        {/* Section heading */}
        <div
          style={{
            fontFamily: F.ui,
            fontWeight: 600,
            fontSize: 13,
            color: T.antiqueGold,
            letterSpacing: 2,
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          LIVE PREVIEW
        </div>

        {/* Label preview box */}
        <div
          style={{
            width: 360,
            height: 180,
            background: "white",
            border: "1.5px solid #6E0F2D",
            borderRadius: 6,
            padding: "12px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            margin: "0 auto 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {fields.branding && (
              <span
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 12,
                  color: T.royalBurgundy,
                }}
              >
                BKB Silks
              </span>
            )}
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 12,
                color: T.taupe,
                background: T.cream,
                borderRadius: 4,
                padding: "2px 5px",
                marginLeft: "auto",
              }}
            >
              Kanjivaram
            </span>
          </div>

          {/* Barcode */}
          {fields.barcode && (
            <div style={{ margin: "4px 0 0" }}>
              <BarcodePreview code="RAVI-L2-001" />
              <div
                style={{
                  fontFamily: F.mono,
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 3,
                  color: "#000",
                }}
              >
                RAVI-L2-001
              </div>
            </div>
          )}

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 6,
            }}
          >
            {fields.weaver && (
              <div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 7,
                    color: T.antiqueGold,
                    textTransform: "uppercase",
                  }}
                >
                  WEAVER
                </div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#000",
                  }}
                >
                  Ravi Kumar
                </div>
              </div>
            )}
            {fields.date && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 7,
                    color: T.antiqueGold,
                    textTransform: "uppercase",
                  }}
                >
                  QC DATE
                </div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#000",
                  }}
                >
                  10 Jun 2026
                </div>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 7,
                  color: T.antiqueGold,
                  textTransform: "uppercase",
                }}
              >
                WEIGHT
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#000",
                }}
              >
                842g
              </div>
            </div>
          </div>

          {/* Bottom branding */}
          {fields.branding && (
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 6,
                color: T.royalBurgundy,
                opacity: 0.6,
                textAlign: "right",
                marginTop: 2,
              }}
            >
              Beere Kesava &amp; Brothers Silks · Est. 1999
            </div>
          )}
        </div>

        {/* Caption */}
        <div
          style={{
            fontFamily: F.ui,
            fontSize: 12,
            color: T.taupe,
            textAlign: "center",
          }}
        >
          Actual print size: 100mm × 50mm on TSC TE244
        </div>

        {/* Print test label button */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <Button variant="secondary" size="sm" iconLeft={Printer}>
            Print Test Label
          </Button>
        </div>
      </div>
    </div>
  );
}
