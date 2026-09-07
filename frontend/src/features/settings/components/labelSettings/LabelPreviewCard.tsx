import { Printer } from "lucide-react";
import { F, T } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { usePrintSareeTags, SareeTagPreview } from "@/features/weavers";
import { parseLabelSize } from "../../../../shared/ui/document";

export function LabelPreviewCard({ fields, labelSize }: {
  fields: { barcode: boolean; code: boolean; weaver: boolean; date: boolean; branding: boolean };
  /** The size being edited — the preview follows it live, before saving. */
  labelSize: string;
}) {
  const printSareeTags = usePrintSareeTags();
  const stock = parseLabelSize(labelSize);
  const previewTag = {
    sareeId: "RAVI-L2-001",
    sareeTypeName: "Kanjivaram",
    weaverName: fields.weaver ? "Ravi Kumar" : null,
    loomNumber: fields.weaver ? 2 : null,
    date: fields.date ? new Date().toISOString() : null,
    weight: 842,
  };
  return (
    <div className="w-full xl:w-[48%] xl:max-w-[480px] xl:flex-shrink-0">
      <div
        className="p-4 sm:p-6 md:p-7"
        style={{
          background: "white",
          borderRadius: 16,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 2px 16px rgba(44,24,16,0.08)",
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
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          LIVE PREVIEW
        </div>

        {/* Label preview — the real printed tile, magnified. Rendering the
            actual <SareeTagPreview> rather than a hand-built mock means the
            preview cannot drift from what the printer produces, and it shows
            the true proportions of the configured stock. */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, overflowX: "auto" }}>
          <SareeTagPreview tag={previewTag} stock={stock} zoom={3} />
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
          Actual print size: {stock.widthMm}mm × {stock.heightMm}mm on TSC TE244
        </div>

        {/* Print test label button — was a fake toast with no real print
            call, so "testing" this never actually told you whether a
            printer was set up correctly. Now sends a real tag (same mock
            data as the preview above) through the same print path every
            other tag in the app uses. */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <Button
            variant="secondary" size="sm" iconLeft={Printer}
            onClick={() => printSareeTags([previewTag])}
          >
            Print Test Label
          </Button>
        </div>
      </div>
    </div>
  );
}
